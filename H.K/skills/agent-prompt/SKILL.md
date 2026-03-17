---
name: agent-prompt
description: "MUST USE when deploying subagents, teammates, or agent teams. Structures agent prompts for maximum effectiveness — context, task, constraints, output format, reflection. Use BEFORE every Agent tool call, TeamCreate, or SendMessage to teammates."
---

# Agent Prompt Engineering

**Load this skill EVERY TIME you deploy subagents or teammate teams.**

This skill ensures every agent receives a structured, effective prompt instead of vague instructions. Better prompts = better agent results = less rework.

## When to Use

- Before ANY `Agent` tool call (subagent or named teammate)
- Before creating tasks for a team (`TaskCreate`)
- Before sending instructions to teammates (`SendMessage`)
- When an agent returns poor results → re-prompt using this framework

## Prompt Structure

Every agent prompt MUST follow this structure:

```xml
<context>
What the agent needs to know about the project, codebase, or current state.
Include: relevant file paths, tech stack, what was already done.
Do NOT include: information the agent doesn't need for THIS specific task.
</context>

<task>
Clear, specific instruction of what to accomplish.
One sentence that answers: "What should the agent deliver?"
</task>

<constraints>
- What the agent must NOT do (e.g., "do not modify files outside of src/auth/")
- Boundaries: which files, which directories, which scope
- Quality bar: "only fix X, do not refactor Y"
- Model restriction if applicable: "use haiku for this task"
</constraints>

<output_format>
Exact structure of what the agent should return.
Be specific: table, list, code diff, YAML, summary paragraph.
Example of the expected output if the format matters.
</output_format>

<success_criteria>
How to know the task was completed correctly.
- "All tests pass"
- "Zero references to ../data/ remaining"
- "Every file in scope has been reviewed"
</success_criteria>

<reflection>
Before returning your results, verify:
- Did you complete every item in the task?
- Does your output match the requested format?
- Did you respect all constraints?
If any answer is no, fix it before returning.
</reflection>
```

## Adaptation by Agent Type

| Agent type | Prompt depth | Notes |
|-----------|-------------|-------|
| **Haiku subagent** | Lighter — focus on task + constraints | Haiku works best with concise, direct prompts |
| **Sonnet subagent** | Full structure — all 6 sections | Sonnet handles complex multi-step tasks well |
| **Opus subagent** | Full structure + reasoning context | Only use Opus when explicitly requested |
| **Named teammate** | Full structure + team context | Include: team name, task ID, who else is working on what |

## Techniques to Apply

### 1. Scope Isolation
Each agent should work on ONE clear scope. If the task touches 3 unrelated areas, spawn 3 agents — not one agent with 3 tasks.

### 2. Context Minimization
Don't dump the entire project context into every agent. Give each agent ONLY what it needs:
- Bad: "Read the entire codebase and find issues"
- Good: "Read src/auth/handler.ts and src/auth/middleware.ts. Check if JWT validation uses constant-time comparison."

### 3. Output Anchoring
Tell the agent the EXACT format you expect. Agents that don't know what format to use waste tokens on formatting decisions.
- Bad: "Summarize what you found"
- Good: "Return a markdown table with columns: File | Issue | Line | Severity"

### 4. Defensive Constraints
Prevent agents from going off-track:
- "Do NOT modify any files — read only"
- "Do NOT create new files"
- "Do NOT run destructive git commands"
- "Stay within the scope of {directory}"

### 5. Reflection Gate
Ask agents to self-verify before returning:
- "Before returning, grep for any remaining instances of X to confirm zero left"
- "Before returning, count the files you processed and confirm it matches the expected count"

## Anti-Patterns

| Bad prompt | Why it fails | Fix |
|-----------|-------------|-----|
| "Fix the tests" | No context, no scope, no constraints | "Fix the 3 failing tests in src/auth/__tests__/. Read each test, identify the failure, fix minimally." |
| "Review this code" | No criteria, no output format | "Review src/api/ for security issues. Return a table: File, Issue, Severity, Suggested Fix." |
| "Do research on X" | No boundaries, no deliverable | "Search for X. Return 5 key findings as bullet points with source URLs." |
| "Help with the project" | Everything wrong | Never do this. |

## Team Coordination

When deploying multiple teammates:
- Each teammate gets its OWN prompt with its OWN scope
- Clearly state what OTHER teammates are working on (avoid overlap)
- Define task dependencies: "Wait for teammate-A to finish task #1 before starting task #2"
- Use TaskCreate with clear descriptions that follow this same prompt structure

## Quick Checklist

Before sending ANY prompt to an agent, verify:
- [ ] Context: Does the agent know enough (but not too much)?
- [ ] Task: Is the deliverable crystal clear in one sentence?
- [ ] Constraints: Does the agent know what NOT to do?
- [ ] Output: Does the agent know the exact format to return?
- [ ] Success: Can the agent verify it's done correctly?
- [ ] Reflection: Did I ask the agent to self-check?

User: $ARGUMENTS
