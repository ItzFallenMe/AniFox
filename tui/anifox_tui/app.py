from __future__ import annotations

import argparse
import json
import os
import webbrowser
from typing import Any

import httpx
from InquirerPy import inquirer
from rich import box
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.traceback import install

from . import __version__
from .api import AniFoxAPI, AniFoxAPIError
from .selector import Selector

install(show_locals=False)
console = Console()
ACCENT = "dark_orange"
SOURCES = ["vidly", "vidbolt", "vidy", "embedwave"]


def first(item: Any, *keys: str, default: str = "—") -> str:
    if not isinstance(item, dict):
        return str(item) if item is not None else default
    for key in keys:
        value = item.get(key)
        if value not in (None, ""):
            return str(value)
    return default


def as_items(payload: Any, *keys: str) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [x for x in payload if isinstance(x, dict)]
    if isinstance(payload, dict):
        for key in (*keys, "results", "items", "data", "mangaList", "chapters", "sources", "pages"):
            value = payload.get(key)
            if isinstance(value, list):
                return [x for x in value if isinstance(x, dict)]
    return []


def banner(api: AniFoxAPI) -> None:
    body = Text()
    body.append("ANI", style="bold white")
    body.append("FOX", style=f"bold {ACCENT}")
    body.append("  terminal media browser", style="dim")
    console.print(Panel(body, subtitle=f"[dim]{api.base_url}[/]", border_style=ACCENT, box=box.DOUBLE))


def wait() -> None:
    inquirer.text(message="Press Enter to continue", instruction="").execute()


def show_json(title: str, payload: Any) -> None:
    console.print(Panel.fit(f"[bold]{title}[/]", border_style=ACCENT))
    console.print_json(json.dumps(payload, ensure_ascii=False, indent=2, default=str))


def show_manga_card(item: dict[str, Any]) -> None:
    title = first(item, "title", "name")
    description = first(item, "description", default="")
    details = Table.grid(padding=(0, 1))
    details.add_column(style="bold", width=14)
    details.add_column()
    details.add_row("Source", first(item, "source", default="MangaDex"))
    details.add_row("ID", first(item, "id"))
    details.add_row("Latest chapter", first(item, "chapter", "latestChapter"))
    details.add_row("Description", description[:700] if description else "No description supplied.")
    console.print(Panel(details, title=f"[bold]{title}[/]", border_style=ACCENT))


def select_result(items: list[dict[str, Any]], label_keys: tuple[str, ...] = ("title", "name")) -> dict[str, Any] | None:
    if not items:
        console.print("[yellow]No results found.[/]")
        return None
    labels: list[str] = []
    by_label: dict[str, dict[str, Any]] = {}
    for index, item in enumerate(items, start=1):
        title = first(item, *label_keys, default="Untitled")
        meta = " · ".join(str(item[k]) for k in ("year", "media_type", "status") if item.get(k))
        label = f"{index:02d}. {title}" + (f"  [dim]({meta})[/]" if meta else "")
        # InquirerPy renders labels as text, so strip Rich markup from choice labels.
        plain = f"{index:02d}. {title}" + (f" ({meta})" if meta else "")
        labels.append(plain)
        by_label[plain] = item
    selected = Selector.choose("Choose a title", labels)
    return by_label.get(selected) if selected else None


def manga_chapter_flow(api: AniFoxAPI, manga_id: str, chapter: dict[str, Any]) -> None:
    chapter_id = first(chapter, "id", "chapterId", "chapter_id", default="")
    if not chapter_id:
        chapter_id = Selector.ask("Chapter ID")
    if not chapter_id:
        return
    payload = api.manga_chapter(manga_id, chapter_id)
    pages = as_items(payload, "pages", "chapter")
    console.print(Panel("[bold]Chapter pages[/]", border_style=ACCENT))
    if pages:
        for index, page in enumerate(pages, 1):
            url = first(page, "url", "image", "src", "data", default="")
            console.print(f"[{ACCENT}]{index:03d}[/]  {url}")
    else:
        show_json("Chapter response", payload)
    wait()


def manga_detail_flow(api: AniFoxAPI, item: dict[str, Any]) -> None:
    manga_id = first(item, "id", "mangaId", default="")
    if not manga_id:
        console.print("[yellow]This result has no manga ID.[/]")
        wait()
        return
    detail = api.manga_title(manga_id)
    show_manga_card(detail if isinstance(detail, dict) else item)
    detail_obj = detail if isinstance(detail, dict) else {}
    chapters = as_items(detail_obj, "chapters", "chapterList")
    if chapters:
        selected = Selector.choose(
            "Select a chapter (Esc to return)",
            [
                f"{first(ch, 'chapter', 'chapterNumber', 'title', default='Chapter')} · {first(ch, 'title', 'name', default='')}".strip(" ·")
                for ch in chapters
            ],
        )
        if selected:
            labels = [
                f"{first(ch, 'chapter', 'chapterNumber', 'title', default='Chapter')} · {first(ch, 'title', 'name', default='')}".strip(" ·")
                for ch in chapters
            ]
            chapter = chapters[labels.index(selected)]
            manga_chapter_flow(api, manga_id, chapter)
    else:
        console.print("[dim]No chapter list was included in the detail response.[/]")
        wait()


def browse_manga(api: AniFoxAPI, *, search: bool = False) -> None:
    page = 1
    query = Selector.ask("Search MangaDex") if search else ""
    while True:
        payload = api.manga_search(query) if query else api.manga_catalog(page)
        items = as_items(payload, "mangaList", "results")
        selected = select_result(items)
        if selected:
            manga_detail_flow(api, selected)
            continue
        if query:
            if Selector.confirm("Search again?", default=True):
                query = Selector.ask("Search MangaDex")
                if query:
                    continue
            return
        action = Selector.choose("Catalog", ["Next page", "Previous page", "Search", "Back"])
        if action == "Next page":
            page += 1
        elif action == "Previous page":
            page = max(1, page - 1)
        elif action == "Search":
            query = Selector.ask("Search MangaDex")
            page = 1
        else:
            return


def manga_sources(api: AniFoxAPI) -> None:
    show_json("AniFox manga sources", api.manga_sources())
    wait()


def media_detail(api: AniFoxAPI, item: dict[str, Any]) -> None:
    media_type = first(item, "media_type", default="")
    media_id = first(item, "id", default="")
    if media_type not in {"movie", "tv"} or not media_id:
        show_json("Media details", item)
        wait()
        return
    detail = api.tmdb_details(media_type, media_id)
    title = first(detail, "title", "name", default=first(item, "title", "name"))
    overview = first(detail, "overview", default="No synopsis available.")
    table = Table.grid(padding=(0, 1))
    table.add_column(style="bold", width=14)
    table.add_column()
    table.add_row("Type", media_type.upper())
    table.add_row("Release", first(detail, "release_date", "first_air_date"))
    table.add_row("Rating", first(detail, "vote_average"))
    table.add_row("Overview", overview[:1200])
    console.print(Panel(table, title=f"[bold]{title}[/]", border_style=ACCENT))
    actions = ["Resolve stream", "View raw API response", "Back"]
    action = Selector.choose("What next?", actions)
    if action == "Resolve stream":
        if media_type == "movie":
            resolve_and_open(api, media_type="movie", tmdb_id=media_id)
        else:
            seasons = as_items(detail, "seasons")
            season_choices = [
                f"Season {first(s, 'season_number', default='1')} · {first(s, 'name', default='')}".strip(" ·")
                for s in seasons
            ]
            if not season_choices:
                season = int(Selector.ask("Season number", default="1") or "1")
                episode = int(Selector.ask("Episode number", default="1") or "1")
                resolve_and_open(api, media_type="tv", tmdb_id=media_id, season=season, episode=episode)
            else:
                selected = Selector.choose("Choose season", season_choices)
                if selected:
                    season = int(first(seasons[season_choices.index(selected)], "season_number", default="1"))
                    season_data = api.tmdb_season(media_id, season)
                    episodes = as_items(season_data, "episodes")
                    episode_choices = [
                        f"Episode {first(ep, 'episode_number', default='?')} · {first(ep, 'name', default='Untitled')}"
                        for ep in episodes
                    ]
                    chosen_episode = Selector.choose("Choose episode", episode_choices)
                    if chosen_episode:
                        episode = int(first(episodes[episode_choices.index(chosen_episode)], "episode_number", default="1"))
                        resolve_and_open(api, media_type="tv", tmdb_id=media_id, season=season, episode=episode)
    elif action == "View raw API response":
        show_json("TMDB response", detail)
        wait()


def resolve_and_open(
    api: AniFoxAPI,
    *,
    media_type: str,
    tmdb_id: str,
    season: int = 1,
    episode: int = 1,
) -> None:
    source = Selector.choose("Choose AniFox provider", SOURCES)
    if not source:
        return
    url = api.resolve_stream(
        source=source,
        media_type=media_type,
        tmdb_id=tmdb_id,
        season=season,
        episode=episode,
    )
    console.print(Panel(url, title="[bold]Provider URL[/]", border_style=ACCENT))
    if Selector.confirm("Open provider page in your browser?", default=False):
        webbrowser.open(url)


def tmdb_menu(api: AniFoxAPI, *, trending: bool = False) -> None:
    if trending:
        media_type = Selector.choose("Trending category", ["all", "movie", "tv"]) or "all"
        window = Selector.choose("Time window", ["day", "week"]) or "week"
        payload = api.tmdb_trending(media_type, window)
    else:
        query = Selector.ask("Search movies and TV")
        if not query:
            return
        payload = api.tmdb_search(query)
    items = as_items(payload, "results")
    while items:
        selected = select_result(items, ("title", "name"))
        if not selected:
            return
        media_detail(api, selected)
        if not Selector.confirm("Choose another result?", default=True):
            return
    console.print("[yellow]No TMDB results. Check that TMDB_API_KEY is configured on the AniFox deployment.[/]")
    wait()


def main() -> None:
    parser = argparse.ArgumentParser(description="AniFox interactive terminal browser")
    parser.add_argument("--base-url", default=os.getenv("ANIFOX_API_URL", "https://anifox.runs-on.dev"))
    parser.add_argument("--version", action="version", version=f"AniFox TUI {__version__}")
    args = parser.parse_args()
    try:
        api = AniFoxAPI(args.base_url)
    except ValueError as exc:
        console.print(f"[red]{exc}[/]")
        raise SystemExit(2) from exc

    try:
        while True:
            console.clear()
            banner(api)
            console.print("[dim]A terminal front-end for AniFox's same-origin API.[/]\n")
            choice = Selector.choose(
                "Main menu",
                [
                    "Browse manga catalog",
                    "Search manga",
                    "Manga sources",
                    "Trending movies & TV",
                    "Search movies & TV",
                    "API status / configuration",
                    "Quit",
                ],
            )
            if choice == "Browse manga catalog":
                try:
                    browse_manga(api)
                except (AniFoxAPIError, httpx.HTTPError) as exc:
                    console.print(f"[red]API error: {exc}[/]")
                    wait()
            elif choice == "Search manga":
                try:
                    browse_manga(api, search=True)
                except (AniFoxAPIError, httpx.HTTPError) as exc:
                    console.print(f"[red]API error: {exc}[/]")
                    wait()
            elif choice == "Manga sources":
                try:
                    manga_sources(api)
                except (AniFoxAPIError, httpx.HTTPError) as exc:
                    console.print(f"[red]API error: {exc}[/]")
                    wait()
            elif choice == "Trending movies & TV":
                try:
                    tmdb_menu(api, trending=True)
                except (AniFoxAPIError, httpx.HTTPError) as exc:
                    console.print(f"[red]API error: {exc}[/]")
                    wait()
            elif choice == "Search movies & TV":
                try:
                    tmdb_menu(api)
                except (AniFoxAPIError, httpx.HTTPError) as exc:
                    console.print(f"[red]API error: {exc}[/]")
                    wait()
            elif choice == "API status / configuration":
                console.print(Panel(f"API origin: {api.base_url}\nVersion: {__version__}", border_style=ACCENT))
                try:
                    sources = api.manga_sources()
                    console.print("[green]AniFox API is reachable.[/]")
                    console.print_json(json.dumps(sources, ensure_ascii=False, indent=2))
                except (AniFoxAPIError, httpx.HTTPError) as exc:
                    console.print(f"[red]API check failed: {exc}[/]")
                wait()
            else:
                break
    except KeyboardInterrupt:
        pass
    finally:
        api.close()
        console.print("\n[dim]Thanks for using AniFox.[/]")


if __name__ == "__main__":
    main()
