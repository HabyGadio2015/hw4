"""Append-only audit trail of agent activity: output/audit_trail.json.

The file is a JSON array. Each new entry is added at the very end; earlier entries are never rewritten,
truncated, reordered, or removed, and nothing here ever deletes or empties the file. If the file can't be
appended to safely (for example it was damaged by hand), it is left exactly as it is and the entry goes to
output/audit_trail.pending.jsonl instead.

Entries hold times, tool names, and short summaries only: never the shopper's message, email, or name.
"""

import json
import logging
import os
import threading
from datetime import datetime, timezone
from pathlib import Path

from pydantic_ai.messages import ModelMessage, ModelRequest, ModelResponse, ToolCallPart, ToolReturnPart

from models import AuditEntry, AuditToolCall
from tools import PROJECT_DIR

REAL_AUDIT_PATH = PROJECT_DIR / "output" / "audit_trail.json"
AUDIT_PATH = REAL_AUDIT_PATH  # tests point this at a throwaway file; the real trail is only ever appended to
PENDING_PATH = PROJECT_DIR / "output" / "audit_trail.pending.jsonl"
MAX_TEXT = 160
TAIL_BYTES = 64

logger = logging.getLogger("campus_customs.audit")
_lock = threading.Lock()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _short(value: object, limit: int = MAX_TEXT) -> str:
    text = " ".join(str(value).split())
    return text if len(text) <= limit else text[: limit - 1] + "…"


def summarize_result(content: object) -> str:
    """A short description of a tool result: lookups carry a ready-made message, lists are counted."""
    message = getattr(content, "message", None)
    if isinstance(message, str):
        return _short(message)
    if isinstance(content, list):
        ids = [getattr(item, "product_id", None) for item in content][:3]
        shown = ", ".join(i for i in ids if i)
        return _short(f"{len(content)} items" + (f": {shown}" if shown else ""))
    return _short(content)


def tool_calls_from(messages: list[ModelMessage], tool_names: set[str]) -> list[AuditToolCall]:
    """Pair each catalogue tool call in a run with its result, in order."""
    returns = {
        part.tool_call_id: part
        for msg in messages
        if isinstance(msg, ModelRequest)
        for part in msg.parts
        if isinstance(part, ToolReturnPart)
    }
    calls: list[AuditToolCall] = []
    for msg in messages:
        if not isinstance(msg, ModelResponse):
            continue
        for part in msg.parts:
            if isinstance(part, ToolCallPart) and part.tool_name in tool_names:
                returned = returns.get(part.tool_call_id)
                calls.append(
                    AuditToolCall(
                        time=msg.timestamp.astimezone(timezone.utc).isoformat(timespec="seconds") if msg.timestamp else None,
                        tool=part.tool_name,
                        args=_short(json.dumps(part.args_as_dict(), ensure_ascii=False)),
                        result=summarize_result(returned.content) if returned else "(no result)",
                    )
                )
    return calls


def append_entry(entry: AuditEntry, path: Path | None = None) -> None:
    """Add one entry at the end of the JSON array in place. Raises, and changes nothing, if the file isn't a clean array."""
    path = path or AUDIT_PATH
    text = json.dumps(entry.model_dump(), ensure_ascii=False, indent=2)
    block = "\n".join("  " + line for line in text.splitlines())
    with _lock:
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists() or path.stat().st_size == 0:
            path.write_text("[\n" + block + "\n]\n", encoding="utf-8")  # a new or empty file has nothing to lose
            return
        with open(path, "rb+") as f:
            size = f.seek(0, os.SEEK_END)
            f.seek(max(size - TAIL_BYTES, 0))
            tail = f.read()
            stripped = tail.rstrip()
            if not stripped.endswith(b"]"):
                raise ValueError(f"{path.name} does not end with ']'; refusing to modify it")
            before = stripped[:-1].rstrip()  # everything in the tail before the closing bracket
            if not (before.endswith(b"}") or before.endswith(b"[")):
                raise ValueError(f"{path.name} is not a clean JSON array; refusing to modify it")
            cut = size - len(tail) + len(before)  # right after the last entry (or the opening bracket)
            new_tail = (b",\n" if before.endswith(b"}") else b"\n") + block.encode("utf-8") + b"\n]\n"
            f.seek(cut)
            f.write(new_tail)  # overwrites only the old closing "\n]\n"; the new tail is longer, so nothing earlier moves
            f.truncate(cut + len(new_tail))  # drops only stale whitespace after the new closing bracket
            f.flush()
            os.fsync(f.fileno())


def record(entry: AuditEntry, path: Path | None = None, pending: Path | None = None) -> None:
    """Append an entry; if that isn't possible, leave the trail untouched and keep the entry in the pending file."""
    try:
        append_entry(entry, path)
    except Exception as exc:  # noqa: BLE001 - auditing must never break a chat
        logger.warning("audit append failed (%s); saving the entry to the pending file", type(exc).__name__)
        try:
            with open(pending or PENDING_PATH, "a", encoding="utf-8") as f:
                f.write(json.dumps(entry.model_dump(), ensure_ascii=False) + "\n")
        except Exception:  # noqa: BLE001
            logger.exception("could not save the audit entry anywhere")
