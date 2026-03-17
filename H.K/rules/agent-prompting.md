# Agent Prompting Rules

When deploying subagents or teammate teams (Agent tool, TeamCreate, SendMessage):

1. **Load the `/agent-prompt` skill** before creating prompts for agents — it contains the full prompting framework
2. Structure every agent prompt with: `<context>`, `<task>`, `<constraints>`, `<output_format>`
3. Define role, boundaries, and what the agent must NOT do
4. Specify the exact output format expected
5. Include success criteria so the agent knows when it's done
6. Add reflection: ask the agent to verify its own output before returning

Never send vague one-liner prompts to agents. Every agent deserves a structured, clear prompt.
