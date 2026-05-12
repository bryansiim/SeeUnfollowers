from __future__ import annotations

import shutil
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .parsers import parse_followers, parse_following, parse_recently_unfollowed


_WANTED_JSON_NAMES = {"following.json", "recently_unfollowed_profiles.json"}


def _is_wanted(filename: str) -> bool:
    name = Path(filename).name
    if name in _WANTED_JSON_NAMES:
        return True
    return name.startswith("followers_") and name.endswith(".json")


def _safe_extract(zip_path: Path, dest: Path) -> None:
    with zipfile.ZipFile(zip_path) as zf:
        dest_resolved = str(dest.resolve())
        for member in zf.infolist():
            if member.is_dir() or not _is_wanted(member.filename):
                continue
            target = (dest / member.filename).resolve()
            if not str(target).startswith(dest_resolved):
                raise HTTPException(400, f"Refusing to extract path outside dest: {member.filename}")
            zf.extract(member, dest)


def create_app() -> FastAPI:
    app = FastAPI(title="SeeUnfollowers (parser)", version="0.2.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    def health() -> dict:
        return {"status": "ok"}

    @app.post("/api/parse")
    async def parse(file: UploadFile = File(...)) -> dict:
        if not (file.filename or "").lower().endswith(".zip"):
            raise HTTPException(400, "Expected a .zip file")
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
        try:
            with tmp:
                shutil.copyfileobj(file.file, tmp)
            with tempfile.TemporaryDirectory() as extract_dir:
                root = Path(extract_dir)
                try:
                    _safe_extract(Path(tmp.name), root)
                    followers = parse_followers(root)
                    following = parse_following(root)
                    recently = parse_recently_unfollowed(root)
                except HTTPException:
                    raise
                except (zipfile.BadZipFile, FileNotFoundError, ValueError) as exc:
                    raise HTTPException(400, str(exc)) from exc
                except Exception as exc:
                    raise HTTPException(
                        400,
                        f"Falha ao processar o zip ({type(exc).__name__}): {exc}",
                    ) from exc
                return {
                    "source_zip_name": file.filename or "instagram.zip",
                    "taken_at": datetime.now(timezone.utc).isoformat(),
                    "followers": [
                        {"username": a.username, "timestamp": a.timestamp} for a in followers
                    ],
                    "following": [
                        {"username": a.username, "timestamp": a.timestamp} for a in following
                    ],
                    "recently_unfollowed": [
                        {"username": a.username, "timestamp": a.timestamp} for a in recently
                    ],
                }
        finally:
            Path(tmp.name).unlink(missing_ok=True)

    return app


app = create_app()
