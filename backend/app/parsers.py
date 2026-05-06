"""Parse Instagram data export JSONs.

Tolerant of:
- Different zip scopes (full export, "connections" subset, "followers_and_following" subset, or
  a zip whose root already contains the JSON files).
- Structural variations Instagram has shipped across exports (usernames in `title` vs
  `string_list_data[0].value`; recently_unfollowed as a dict OR top-level list with `label_values`).
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ParsedAccount:
    username: str
    timestamp: int | None


def _find_data_dir(extracted_root: Path) -> Path:
    """Locate the directory containing followers/following JSONs in any zip layout."""
    fixed_candidates = [
        extracted_root / "connections" / "followers_and_following",
        extracted_root / "followers_and_following",
        extracted_root,
    ]
    for c in fixed_candidates:
        if c.is_dir() and (any(c.glob("followers_*.json")) or (c / "following.json").exists()):
            return c
    for d in extracted_root.rglob("*"):
        if d.is_dir() and (any(d.glob("followers_*.json")) or (d / "following.json").exists()):
            return d
    raise FileNotFoundError(
        "Não encontrei os JSONs de seguidores no zip. "
        "Esperado: 'followers_*.json' e 'following.json' (no caminho 'connections/followers_and_following/' "
        "ou em qualquer subpasta)."
    )


def _username_from_entry(entry: dict) -> str | None:
    title = (entry.get("title") or "").strip()
    if title:
        return title
    sld = entry.get("string_list_data") or []
    if sld:
        value = (sld[0].get("value") or "").strip()
        if value:
            return value
    return None


def _timestamp_from_entry(entry: dict) -> int | None:
    sld = entry.get("string_list_data") or []
    if sld:
        ts = sld[0].get("timestamp")
        if isinstance(ts, int):
            return ts
    return None


def _parse_entries(entries: list[dict]) -> list[ParsedAccount]:
    out: list[ParsedAccount] = []
    seen: set[str] = set()
    for entry in entries:
        username = _username_from_entry(entry)
        if not username or username in seen:
            continue
        seen.add(username)
        out.append(ParsedAccount(username=username, timestamp=_timestamp_from_entry(entry)))
    return out


def _parse_label_value_entries(entries: list[dict]) -> list[ParsedAccount]:
    """Newer Instagram shape: each entry has a `label_values` array with {label, value} pairs."""
    out: list[ParsedAccount] = []
    seen: set[str] = set()
    for entry in entries:
        username = None
        for lv in entry.get("label_values") or []:
            if lv.get("label") == "Username":
                username = (lv.get("value") or "").strip()
                break
        if not username or username in seen:
            continue
        seen.add(username)
        ts = entry.get("timestamp")
        out.append(ParsedAccount(username=username, timestamp=ts if isinstance(ts, int) else None))
    return out


def parse_followers(extracted_root: Path) -> list[ParsedAccount]:
    """Parse all followers_*.json files (Instagram shards big lists)."""
    base = _find_data_dir(extracted_root)
    files = sorted(base.glob("followers_*.json"))
    if not files:
        single = base / "followers.json"
        if single.exists():
            files = [single]
        else:
            raise FileNotFoundError(f"No followers_*.json found under {base}")
    all_entries: list[dict] = []
    for f in files:
        data = json.loads(f.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError(f"{f.name} expected to be a JSON array, got {type(data).__name__}")
        all_entries.extend(data)
    return _parse_entries(all_entries)


def parse_following(extracted_root: Path) -> list[ParsedAccount]:
    base = _find_data_dir(extracted_root)
    path = base / "following.json"
    if not path.exists():
        raise FileNotFoundError(f"No following.json found under {base}")
    data = json.loads(path.read_text(encoding="utf-8"))
    entries = data.get("relationships_following") if isinstance(data, dict) else None
    return _parse_entries(entries or [])


def parse_recently_unfollowed(extracted_root: Path) -> list[ParsedAccount]:
    base = _find_data_dir(extracted_root)
    path = base / "recently_unfollowed_profiles.json"
    if not path.exists():
        return []
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        return _parse_entries(data.get("relationships_unfollowed_users") or [])
    if isinstance(data, list):
        return _parse_label_value_entries(data)
    return []
