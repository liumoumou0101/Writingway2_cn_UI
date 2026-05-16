#!/usr/bin/env python3
"""
Writingway app server.

Serves the repo as static files and exposes a small JSON API for
filesystem-backed project saves.
"""

from __future__ import annotations

import json
import os
import re
import tempfile
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


HOST = "127.0.0.1"
PORT = 8000
ROOT = Path(__file__).resolve().parent.parent
PROJECTS_DIR = ROOT / "projects"
BACKUPS_DIR = ROOT / "project-backups"


def json_bytes(payload: dict) -> bytes:
    return json.dumps(payload, ensure_ascii=False).encode("utf-8")


def sanitize_filename(value: str) -> str:
    safe = re.sub(r'[<>:"/\\|?*\x00-\x1F]+', "_", value or "").strip()
    safe = re.sub(r"\s+", " ", safe).strip(" .")
    return safe[:80] or "project"


def project_filename(project: dict) -> str:
    project_id = str(project.get("id") or "").strip()
    if not project_id:
        raise ValueError("Project id is required")
    safe_name = sanitize_filename(str(project.get("name") or "project"))
    return f"{safe_name}--{project_id}.json"


def project_backup_dir(project_id: str) -> Path:
    safe_project_id = sanitize_filename(project_id)
    return BACKUPS_DIR / safe_project_id


def backup_filename(project: dict, exported_at: str | None = None) -> str:
    project_id = str(project.get("id") or "").strip()
    if not project_id:
        raise ValueError("Project id is required")
    safe_name = sanitize_filename(str(project.get("name") or "project"))
    timestamp = exported_at or datetime.now(timezone.utc).isoformat()
    timestamp = timestamp.replace(":", "-").replace(".", "-").replace("+00:00", "Z")
    return f"{timestamp}--{safe_name}--{sanitize_filename(project_id)}.json"


class WritingwayHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def respond_json(self, status: int, payload: dict) -> None:
        body = json_bytes(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == "/api/health":
            self.respond_json(
                HTTPStatus.OK,
                {
                    "ok": True,
                    "service": "writingway-server",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )
            return
        if parsed.path == "/api/list-backups":
            self.handle_list_backups(parsed.query)
            return
        if parsed.path == "/api/get-backup":
            self.handle_get_backup(parsed.query)
            return
        super().do_GET()

    def do_POST(self):
        if self.path == "/api/save-project":
            self.handle_save_project()
            return
        if self.path == "/api/create-backup":
            self.handle_create_backup()
            return
        self.respond_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Not found"})

    def handle_save_project(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Invalid Content-Length"})
            return

        if length <= 0:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Request body is required"})
            return

        try:
            raw = self.rfile.read(length)
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Invalid JSON"})
            return

        project = payload.get("project") if isinstance(payload, dict) else None
        if not isinstance(project, dict):
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Missing project payload"})
            return

        try:
            PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
            filename = project_filename(project)
            target = PROJECTS_DIR / filename
            project_id = str(project.get("id"))

            for existing in PROJECTS_DIR.glob(f"*--{project_id}.json"):
                if existing != target and existing.exists():
                    existing.unlink()

            payload["filesystemSavedAt"] = datetime.now(timezone.utc).isoformat()
            payload["filesystemSaveVersion"] = 1

            with tempfile.NamedTemporaryFile(
                "w",
                encoding="utf-8",
                dir=str(PROJECTS_DIR),
                delete=False,
                suffix=".tmp",
            ) as tmp_file:
                json.dump(payload, tmp_file, ensure_ascii=False, indent=2)
                tmp_file.write("\n")
                temp_name = tmp_file.name

            os.replace(temp_name, target)

            self.respond_json(
                HTTPStatus.OK,
                {
                    "ok": True,
                    "path": str(target.relative_to(ROOT)),
                    "filename": filename,
                },
            )
        except Exception as exc:
            self.respond_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"ok": False, "error": str(exc)},
            )

    def read_json_payload(self) -> dict | None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Invalid Content-Length"})
            return None

        if length <= 0:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Request body is required"})
            return None

        try:
            raw = self.rfile.read(length)
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Invalid JSON"})
            return None
        return payload

    def handle_create_backup(self):
        payload = self.read_json_payload()
        if payload is None:
            return

        project = payload.get("project") if isinstance(payload, dict) else None
        if not isinstance(project, dict):
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Missing project payload"})
            return

        try:
            project_id = str(project.get("id") or "").strip()
            if not project_id:
                raise ValueError("Project id is required")

            backup_dir = project_backup_dir(project_id)
            backup_dir.mkdir(parents=True, exist_ok=True)
            filename = backup_filename(project, payload.get("exportedAt"))
            target = backup_dir / filename

            payload["localBackupSavedAt"] = datetime.now(timezone.utc).isoformat()
            payload["localBackupVersion"] = 1

            with tempfile.NamedTemporaryFile(
                "w",
                encoding="utf-8",
                dir=str(backup_dir),
                delete=False,
                suffix=".tmp",
            ) as tmp_file:
                json.dump(payload, tmp_file, ensure_ascii=False, indent=2)
                tmp_file.write("\n")
                temp_name = tmp_file.name

            os.replace(temp_name, target)

            self.respond_json(
                HTTPStatus.OK,
                {
                    "ok": True,
                    "backupId": filename,
                    "path": str(target.relative_to(ROOT)),
                    "timestamp": payload["localBackupSavedAt"],
                },
            )
        except Exception as exc:
            self.respond_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"ok": False, "error": str(exc)},
            )

    def handle_list_backups(self, query: str):
        params = parse_qs(query or "")
        project_id = (params.get("projectId") or [""])[0].strip()
        if not project_id:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Missing projectId"})
            return

        try:
            backup_dir = project_backup_dir(project_id)
            backups = []
            if backup_dir.exists():
                for backup_file in sorted(backup_dir.glob("*.json"), reverse=True):
                    stat = backup_file.stat()
                    backups.append(
                        {
                            "id": backup_file.name,
                            "timestamp": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                            "path": str(backup_file.relative_to(ROOT)),
                            "size": stat.st_size,
                        }
                    )

            self.respond_json(HTTPStatus.OK, {"ok": True, "backups": backups})
        except Exception as exc:
            self.respond_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"ok": False, "error": str(exc)},
            )

    def handle_get_backup(self, query: str):
        params = parse_qs(query or "")
        project_id = (params.get("projectId") or [""])[0].strip()
        backup_id = (params.get("backupId") or [""])[0].strip()
        if not project_id or not backup_id:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Missing projectId or backupId"})
            return

        if Path(backup_id).name != backup_id:
            self.respond_json(HTTPStatus.BAD_REQUEST, {"ok": False, "error": "Invalid backupId"})
            return

        try:
            backup_file = project_backup_dir(project_id) / backup_id
            if not backup_file.exists() or not backup_file.is_file():
                self.respond_json(HTTPStatus.NOT_FOUND, {"ok": False, "error": "Backup not found"})
                return

            with backup_file.open("r", encoding="utf-8") as f:
                backup = json.load(f)

            self.respond_json(HTTPStatus.OK, {"ok": True, "backup": backup})
        except Exception as exc:
            self.respond_json(
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"ok": False, "error": str(exc)},
            )


def main():
    PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
    BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((HOST, PORT), WritingwayHandler)
    print(f"Writingway server running at http://{HOST}:{PORT}")
    print(f"Project saves will be written to {PROJECTS_DIR}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nWritingway server stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
