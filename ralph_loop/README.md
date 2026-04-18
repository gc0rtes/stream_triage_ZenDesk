# Ralph Loop - Autonomous AI Development

Ralph Loop automates iterative development by feeding the same prompt to Claude CLI in a loop. Each iteration, Claude reads your PRD, picks the next task, implements it, tests it, commits it, and moves on. Based on the [Ralph Wiggum technique](https://ghuntley.com/ralph/) by Geoffrey Huntley.

## Prerequisites

- [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- Git initialized in your project directory
- Node.js (if building a JS/TS project)

## Required Files

Your project needs **3 files** to run the ralph loop:

### 1. `ralph.sh` — The loop runner

The bash script that calls Claude repeatedly. No changes needed unless you want to customize the prompt.

```bash
chmod +x ralph.sh
```

### 2. `prd.json` — Your Product Requirements Document

Defines **what** gets built. Claude reads this every iteration to find the next task.

```json
{
  "name": "My Project",
  "description": "What the project does",
  "tech_stack": "React Vite, Tailwind CSS, Vitest",
  "tasks": [
    {
      "id": 1,
      "title": "Short task title",
      "description": "Detailed description of what to build, what tools/libraries to use, what tests to write, and what success looks like.",
      "passes": false
    },
    {
      "id": 2,
      "title": "Second task",
      "description": "This task builds on task 1...",
      "passes": false
    }
  ]
}
```

**Key rules for `prd.json`:**
- Each task has `"passes": false` — Claude sets it to `true` when done
- Task descriptions should be **very specific** — mention file paths, component names, libraries, test expectations
- Include the `tech_stack` field and reference it in task descriptions so Claude uses the right tools
- Order tasks by dependency (task 2 can depend on task 1, etc.)

### 3. `progress.txt` — Iteration log

Claude appends notes here after each task. Start with an empty file or a header:

```
# Ralph Progress Log

This file tracks learnings and progress across iterations.
Append your notes here - do not overwrite previous entries.
```

## Usage

```bash
# Run with 10 iterations max
./ralph.sh 10

# Run with default 5 iterations
./ralph.sh

# Set via environment variable
MAX_ITERATIONS=20 ./ralph.sh
```

**Tip:** Set max iterations to at least the number of tasks. Some tasks may need a retry iteration if tests fail, so add a buffer (e.g., 8 tasks = set 12-15 iterations).

## How It Works

```
┌─────────────┐
│  ralph.sh   │ ── feeds same prompt each iteration
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Claude CLI  │ ── reads prd.json, finds next "passes": false task
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Implement   │ ── writes code, runs tests, fixes failures
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Update PRD  │ ── sets "passes": true, appends to progress.txt
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Git commit  │ ── commits with descriptive message
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Loop check  │ ── if all tasks pass → RALPH_COMPLETE → exit
└─────────────┘    if not → next iteration
```

## Output Files

| File | Purpose |
|------|---------|
| `ralph.log` | Full Claude output from every iteration |
| `progress.txt` | Summary notes from each completed task |
| `prd.json` | Updated with `"passes": true` as tasks complete |

## Tips for Writing Good PRD Tasks

1. **Be explicit about tech stack** — Don't just say "add a component", say "Create `src/components/Button.jsx` using React and Tailwind CSS"
2. **Include test requirements** — "Write a Vitest test in `src/__tests__/Button.test.jsx` that verifies..."
3. **One task = one feature** — Keep tasks focused; Claude works on one per iteration
4. **Describe success criteria** — "The button should render with green background when type='success'"
5. **Reference previous tasks** — "Wire the Button component from Task 1 into the App.jsx layout"

## Example: Quick Start

```bash
# 1. Create project directory
mkdir my-project && cd my-project
git init

# 2. Create the 3 required files
# - Copy ralph.sh into the directory
# - Create your prd.json with tasks
# - Create an empty progress.txt

# 3. Make ralph.sh executable
chmod +x ralph.sh

# 4. Run it
./ralph.sh 10
```
