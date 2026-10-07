"""Campus Customs shop agent (PydanticAI entry point / wiring).

main.py calls `chat()` for every POST /api/chat. The agent is built once, on first use:
    system prompt  ← prompts/prompt.md (must contain its "## Safety rules" section)
    model          ← make_model() in tools.py: gpt-5.6-luna through Portkey, PORTKEY_API_KEY from .env
    tools          ← AGENT_TOOLS in tools.py (read-only catalogue search + product details)
    output         ← AgentReply in models.py (reply text + product_ids)
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_ai import Agent, RunContext
from pydantic_ai.messages import ModelMessage, ModelRequest, ModelResponse, TextPart, UserPromptPart
from pydantic_ai.usage import UsageLimits

from models import AgentReply, ChatResponse, ChatTurn, ShopDeps
from tools import AGENT_TOOLS, BACKEND_DIR, make_model, product_cards

PROMPT_PATH = BACKEND_DIR / "prompts" / "prompt.md"
SAFETY_HEADING = "## Safety rules"
# Caps one chat turn so a confused model can't loop on tools (and spend) forever.
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
        name = ctx.deps.shopper_first_name
        return f"The shopper is logged in; their first name is {name}." if name else "The shopper is not logged in."

    return agent


def to_message_history(history: list[ChatTurn]) -> list[ModelMessage]:
    """Rebuild earlier turns from the website as PydanticAI messages (text only)."""
    messages: list[ModelMessage] = []
    for turn in history:
        if turn.role == "user":
            messages.append(ModelRequest(parts=[UserPromptPart(content=turn.content)]))
        else:
            messages.append(ModelResponse(parts=[TextPart(content=turn.content)]))
    return messages


async def chat(message: str, history: list[ChatTurn], shopper_first_name: str | None = None) -> ChatResponse:
    result = await build_agent().run(
        message,
        deps=ShopDeps(shopper_first_name=shopper_first_name),
        message_history=to_message_history(history),
        usage_limits=USAGE_LIMITS,
    )
    reply: AgentReply = result.output
    # Cards are rebuilt from the database, so a price or stock number on a card can never be invented.
    return ChatResponse(reply=reply.reply, products=product_cards(reply.product_ids))
