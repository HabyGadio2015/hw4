"""Campus Customs shop agent (PydanticAI entry point / wiring).

main.py calls `chat()` for every POST /api/chat. The agent is built once, on first use:
    system prompt  ← prompts/prompt.md (must contain its "## Safety rules" section)
    model          ← make_model() in tools.py: gpt-5.6-luna through Portkey, PORTKEY_API_KEY from .env
    tools          ← AGENT_TOOLS in tools.py (read-only: search, description, price, stock by size)
    output         ← AgentReply in models.py (reply text + product_ids)
"""

from __future__ import annotations

import logging
import re
import time
from functools import lru_cache

from pydantic_ai import Agent, RunContext
from pydantic_ai.exceptions import UsageLimitExceeded
from pydantic_ai.messages import ModelMessage, ModelRequest, ModelResponse, TextPart, UserPromptPart
from pydantic_ai.usage import UsageLimits

import audit
from models import AgentReply, AuditEntry, ChatResponse, ChatTurn, PageContext, ShopDeps, UserPublic
from tools import AGENT_TOOLS, BACKEND_DIR, fetch_product_detail, make_model, product_cards

PROMPT_PATH = BACKEND_DIR / "prompts" / "prompt.md"
SAFETY_HEADING = "## Safety rules"
# Caps one chat turn so a confused model can't loop on tools (and spend) forever.
# Only plain site paths are ever put into the prompt (the path comes from the browser).
SAFE_PATH = re.compile(r"/[A-Za-z0-9/_-]{0,100}")
USAGE_LIMITS = UsageLimits(request_limit=6, tool_calls_limit=8)


def load_system_prompt() -> str:
    if not PROMPT_PATH.exists() or not PROMPT_PATH.read_text(encoding="utf-8").strip():
        raise FileNotFoundError(f"Missing system prompt: {PROMPT_PATH}")
    prompt = PROMPT_PATH.read_text(encoding="utf-8")
    # The safety rules must always be part of the system prompt; refuse to run without them.
    if SAFETY_HEADING not in prompt:
        raise RuntimeError(f"{PROMPT_PATH.name} is missing its '{SAFETY_HEADING[3:]}' section.")
    return prompt


@lru_cache(maxsize=1)
def build_agent() -> Agent[ShopDeps, AgentReply]:
    agent = Agent(
        make_model(),
        deps_type=ShopDeps,
        output_type=AgentReply,
        system_prompt=load_system_prompt(),
        tools=AGENT_TOOLS,
        retries=2,
    )

    @agent.instructions
    def shopper_context(ctx: RunContext[ShopDeps]) -> str:
        return describe_context(ctx.deps)

    return agent


def make_deps(user: UserPublic | None, page: PageContext | None) -> ShopDeps:
    """Per-request deps. The page's product comes from our database, not from text the browser sent."""
    product = fetch_product_detail(page.product_id) if page and page.product_id else None
    return ShopDeps(user=user, page=page, page_product=product)


def describe_context(deps: ShopDeps) -> str:
    """Plain-text facts for the agent: who is chatting and which page they are on."""
    lines = []
    if deps.user:
        u = deps.user
        lines.append(
            f"The shopper is logged in. Name: {u.name}. First name: {u.first_name or u.name}. Email: {u.email}. "
            "Their chats are saved for them."
        )
    else:
        lines.append("The shopper is not logged in, so you don't know who they are, and their chat is not saved.")
    p = deps.page_product
    if p:
        lines.append(
            f'The shopper is on the product page for "{p.name}" (product_id {p.product_id}), a {p.garment_type} '
            f"listed in these colors: {', '.join(p.colors)}. If they say \"this\", \"it\", \"this one\", or "
            "\"this item\", they mean this product: use this product_id with your tools."
        )
    elif deps.page and SAFE_PATH.fullmatch(deps.page.path):
        lines.append(f"The shopper is on the website page {deps.page.path}.")
    return "\n".join(lines)


def to_message_history(history: list[ChatTurn]) -> list[ModelMessage]:
    """Rebuild earlier turns from the website as PydanticAI messages (text only)."""
    messages: list[ModelMessage] = []
    for turn in history:
        if turn.role == "user":
            messages.append(ModelRequest(parts=[UserPromptPart(content=turn.content)]))
        else:
            messages.append(ModelResponse(parts=[TextPart(content=turn.content)]))
    return messages


logger = logging.getLogger("campus_customs.chat")
TOOL_NAMES = {tool.__name__ for tool in AGENT_TOOLS}


async def chat(
    message: str,
    history: list[ChatTurn],
    user: UserPublic | None = None,
    page: PageContext | None = None,
) -> ChatResponse:
    started = time.perf_counter()
    who = f"user:{user.id}" if user else "guest"
    page_path = page.path if page and SAFE_PATH.fullmatch(page.path) else None

    def elapsed_ms() -> int:
        return int((time.perf_counter() - started) * 1000)

    try:
        result = await build_agent().run(
            message,
            deps=make_deps(user, page),
            message_history=to_message_history(history),
            usage_limits=USAGE_LIMITS,
        )
    except UsageLimitExceeded:
        audit.record(AuditEntry(time=audit.now_iso(), user=who, page=page_path, stop_reason="usage_limit", duration_ms=elapsed_ms()))
        raise
    except Exception as exc:
        audit.record(
            AuditEntry(time=audit.now_iso(), user=who, page=page_path, stop_reason="error", error=type(exc).__name__, duration_ms=elapsed_ms())
        )
        raise
    reply: AgentReply = result.output
    new_messages = result.new_messages()
    tool_calls = audit.tool_calls_from(new_messages, TOOL_NAMES)
    tools_used = [call.tool for call in tool_calls]
    usage = result.usage  # a property in this PydanticAI version, not a method
    # One line per chat for cost monitoring. Never logs the message text.
    logger.info(
        "chat user=%s tools=%s requests=%s tokens_in=%s tokens_out=%s ms=%d",
        user.id if user else "guest", tools_used, usage.requests, usage.input_tokens, usage.output_tokens, elapsed_ms(),
    )
    # Cards are rebuilt from the database, so a price or stock number on a card can never be invented.
    cards = product_cards(reply.product_ids)
    last_response = next((m for m in reversed(new_messages) if isinstance(m, ModelResponse)), None)
    audit.record(
        AuditEntry(
            time=audit.now_iso(),
            user=who,
            page=page_path,
            stop_reason="answered",
            finish_reason=getattr(last_response, "finish_reason", None),
            model_requests=usage.requests,
            tool_calls=tool_calls,
            cards_returned=len(cards),
            tokens_in=usage.input_tokens,
            tokens_out=usage.output_tokens,
            duration_ms=elapsed_ms(),
        )
    )
    return ChatResponse(
        reply=reply.reply,
        results_title=reply.results_title if cards else None,
        products=cards,
        tools_used=tools_used,
    )
