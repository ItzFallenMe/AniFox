from __future__ import annotations

import os
from typing import Any
from urllib.parse import quote

import httpx


class AniFoxAPIError(RuntimeError):
    """Raised when the AniFox API returns an error."""


class AniFoxAPI:
    """Small typed-by-convention client for AniFox's same-origin API."""

    def __init__(self, base_url: str | None = None, timeout: float = 20.0) -> None:
        origin = (base_url or os.getenv("ANIFOX_API_URL") or "https://anifox.runs-on.dev").strip()
        if not origin.startswith(("https://", "http://")):
            raise ValueError("API origin must start with http:// or https://")
        self.base_url = origin.rstrip("/")
        self.client = httpx.Client(
            base_url=self.base_url,
            timeout=timeout,
            headers={"Accept": "application/json", "User-Agent": "AniFox-TUI/0.1.0"},
            follow_redirects=False,
        )

    def close(self) -> None:
        self.client.close()

    def get(self, path: str, **params: Any) -> Any:
        response = self.client.get(f"/api/{path.lstrip('/')}", params=params)
        if response.is_redirect:
            return {"redirect_url": response.headers.get("location"), "status_code": response.status_code}
        try:
            payload = response.json()
        except ValueError as exc:
            raise AniFoxAPIError(
                f"AniFox returned a non-JSON response (HTTP {response.status_code})."
            ) from exc
        if response.is_error:
            message = payload.get("error") or payload.get("message") if isinstance(payload, dict) else None
            raise AniFoxAPIError(message or f"Request failed (HTTP {response.status_code}).")
        return payload

    def manga_sources(self) -> Any:
        return self.get("manga/sources")

    def manga_catalog(self, page: int = 1) -> Any:
        return self.get("manga/catalog", page=page)

    def manga_search(self, query: str) -> Any:
        return self.get("manga/search", query=query, source="mangadex")

    def manga_title(self, manga_id: str) -> Any:
        return self.get(f"manga/title/{quote(manga_id, safe='')}")

    def manga_chapter(self, manga_id: str, chapter_id: str) -> Any:
        return self.get(
            f"manga/chapter/{quote(manga_id, safe='')}/{quote(chapter_id, safe='')}"
        )

    def tmdb_search(self, query: str, page: int = 1) -> Any:
        return self.get("tmdb/search/multi", query=query, page=page)

    def tmdb_trending(self, media_type: str = "all", window: str = "week") -> Any:
        return self.get(f"tmdb/trending/{media_type}/{window}")

    def tmdb_details(self, media_type: str, media_id: str) -> Any:
        if media_type not in {"movie", "tv"}:
            raise ValueError("TMDB media type must be movie or tv.")
        return self.get(f"tmdb/{media_type}/{quote(media_id, safe='')}")

    def tmdb_season(self, tv_id: str, season: int) -> Any:
        return self.get(f"tmdb/tv/{quote(tv_id, safe='')}/season/{season}")

    def resolve_stream(
        self,
        *,
        source: str,
        media_type: str,
        tmdb_id: str | None = None,
        anilist_id: str | None = None,
        season: int = 1,
        episode: int = 1,
    ) -> str:
        params: dict[str, Any] = {"source": source, "type": media_type}
        if tmdb_id:
            params["tmdbId"] = tmdb_id
        if anilist_id:
            params["anilistId"] = anilist_id
        if media_type == "tv":
            params.update(season=season, episode=episode)
        elif media_type == "anime":
            params["episode"] = episode
        result = self.get("stream", **params)
        target = result.get("redirect_url") if isinstance(result, dict) else None
        if not target:
            raise AniFoxAPIError("AniFox did not return a provider URL.")
        return target
