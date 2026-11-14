from __future__ import annotations

from typing import Any, Sequence

from InquirerPy import inquirer
from InquirerPy.base.control import Choice


class Selector:
    """Small selector facade, following Viu's pluggable selector pattern."""

    @staticmethod
    def choose(message: str, choices: Sequence[str], *, instruction: str = "↑/↓ move · Enter select") -> str | None:
        if not choices:
            return None
        result = inquirer.fuzzy(
            message=message,
            choices=list(choices),
            instruction=instruction,
            match_exact=False,
            max_height="70%",
        ).execute()
        return result if isinstance(result, str) else None

    @staticmethod
    def ask(message: str, *, default: str = "") -> str:
        return str(inquirer.text(message=message, default=default).execute() or "").strip()

    @staticmethod
    def confirm(message: str, *, default: bool = False) -> bool:
        return bool(inquirer.confirm(message=message, default=default).execute())
