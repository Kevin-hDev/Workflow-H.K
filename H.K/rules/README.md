# H.K Rules

Rules are lightweight instructions loaded automatically at the start of every Claude Code conversation. They act as permanent reminders — always in context, always applied.

## Installation

Copy the rule files into your Claude Code rules directory:

```bash
cp rules/*.md ~/.claude/rules/
```

That's it. The rules will be active in every conversation from now on.

## Available Rules

### `agent-prompting.md`

**What it does:** Ensures Claude structures every subagent and teammate prompt properly before deployment. Without this rule, Claude sends vague one-liner prompts that produce mediocre results.

**How it works:**
1. The rule is loaded at conversation start (permanent reminder)
2. When Claude detects it needs to deploy agents, the rule triggers the `/agent-prompt` skill
3. The skill provides the full prompting framework (context, task, constraints, output format, reflection)
4. Claude applies the framework to every agent prompt it creates

**Why both a rule AND a skill?**
- The **rule** (~10 lines) is the trigger — always in context, minimal token cost
- The **skill** (`/agent-prompt`, ~130 lines) is the full reference — loaded on demand when needed
- In long conversations, the rule may get compacted but the skill can be reloaded

**Requires:** The `/agent-prompt` skill must be installed in H.K skills.

## Creating Custom Rules

You can create your own rules in `~/.claude/rules/`. Keep them short (under 20 lines) — rules are loaded in EVERY conversation, so long rules waste tokens.

Good rule: 5-10 lines of clear, actionable instructions.
Bad rule: 200 lines of documentation (use a skill instead).
