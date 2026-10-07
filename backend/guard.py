"""Sensitive-data guard: card numbers, SSNs, and passwords never reach the model or the saved chat."""

import re

from models import ChatTurn

CARD_RE = re.compile(r"(?<!\d)(?:\d[ -]?){13,19}(?!\d)")
SSN_RE = re.compile(r"(?<!\d)\d{3}-\d{2}-\d{4}(?!\d)")
SECRET_RE = re.compile(r"\b(?:password|passcode|pin|cvv|cvc)\b\s*(?:is|=|:)\s*\S+", re.IGNORECASE)

SENSITIVE_REPLY = (
    "For your safety, please don't share card numbers, passwords, or Social Security numbers in chat. "
    "I can't take payments or logins here, and I haven't sent or saved that message. "
    "I'm happy to help with products, sizes, and prices though!"
)


def _luhn_ok(digits: str) -> bool:
    total = 0
    for i, ch in enumerate(reversed(digits)):
        d = int(ch)
        if i % 2 == 1:
            d = d * 2 - 9 if d > 4 else d * 2
        total += d
    return total % 10 == 0


def contains_sensitive(text: str) -> bool:
    if SSN_RE.search(text) or SECRET_RE.search(text):
        return True
    for match in CARD_RE.finditer(text):
        digits = re.sub(r"\D", "", match.group())
        if 13 <= len(digits) <= 19 and _luhn_ok(digits):
            return True
    return False


def clean_guest_history(history: list[ChatTurn]) -> list[ChatTurn]:
    """Drop any earlier turn that holds sensitive data (and the reply right after it), so it is never re-sent to the model."""
    cleaned: list[ChatTurn] = []
    skip_reply = False
    for turn in history:
        if turn.role == "user" and contains_sensitive(turn.content):
            skip_reply = True
            continue
        if turn.role == "assistant" and skip_reply:
            skip_reply = False
            continue
        skip_reply = False
        cleaned.append(turn)
    return cleaned
