# Test an Agent

Test a specific agent with a prompt to verify it's working correctly.

## Usage

Provide the agent name as an argument: `/test-agent article-writer`

## Available Agents

- `content-architect` - Main coordinator
- `research-director` - External research
- `source-analyst` - Analyzes source materials
- `article-writer` - Creates articles
- `hist-compliance-editor` - Enforces HIST rules
- `fact-checker` - Verifies accuracy
- `video-narrator` - Creates video scripts
- `assessment-designer` - Creates quizzes
- `program-matrix-formatter` - Formats program structure
- `company-researcher` - Analyzes company websites
- `brief-interviewer` - Builds briefs via conversation

## Steps

1. Read the agent definition:
   ```bash
   cat .claude/agents/$ARGUMENTS.md
   ```

2. Test with a simple prompt using the agent orchestrator or direct API call.

3. Verify the output matches expected format.

## Testing Tips

- For `article-writer`: Test with a specific session topic
- For `company-researcher`: Test with a real company URL
- For `brief-interviewer`: Simulate a conversation flow
