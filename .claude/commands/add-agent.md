# Add New Agent

Create a new specialized agent for the training system.

## Agent Template

Create a new file in `.claude/agents/[agent-name].md`:

```markdown
---
name: agent-name
description: Clear description of when to use this agent. Include "Use PROACTIVELY" if it should auto-trigger.
tools: Read, Write, WebFetch, WebSearch, Task, TodoWrite
model: sonnet
---

# AGENT NAME - Role Description

You are the [Role] for Pacy's HIST-based training system. Your responsibility is [main purpose].

## YOUR CORE RESPONSIBILITIES

1. **Responsibility 1**: Description
2. **Responsibility 2**: Description
3. **Responsibility 3**: Description

## INPUT FORMAT

What the agent expects to receive:

- Item 1
- Item 2

## OUTPUT FORMAT

What the agent should produce (use JSON for structured output):

\`\`\`json
{
"field": "value"
}
\`\`\`

## QUALITY STANDARDS

- Standard 1
- Standard 2

## IMPORTANT GUIDELINES

- Guideline 1
- Guideline 2
```

## Checklist

- [ ] Name is lowercase with hyphens
- [ ] Description clearly states when to use
- [ ] Tools are limited to what's needed
- [ ] Model is appropriate (sonnet for most, haiku for simple tasks)
- [ ] System prompt has clear structure
- [ ] Output format is specified
- [ ] Quality standards defined

## After Creating

The agent will auto-load when the backend starts. Test with `/test-agent [name]`.
