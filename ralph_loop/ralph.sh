#!/bin/bash
set -e

# Ralph Loop - Autonomous AI Development
# Usage: ./ralph.sh [max_iterations]

MAX_ITERATIONS=${1:-${MAX_ITERATIONS:-5}}

if [ -z "$1" ] && [ -z "$MAX_ITERATIONS" ]; then
    echo "Usage: ./ralph.sh <max_iterations>"
    echo "Example: ./ralph.sh 10"
    exit 1
fi

PROMPT=$(cat <<'EOF'
Read the following files to understand the current state:
- AGENT.md (tech stack, setup instructions, and development rules — follow these strictly)
- prd.json (product requirements with passes: true/false for each task)
- progress.txt (notes from previous iterations)

Then follow these steps:
1. FIND the highest priority task ID from the prd.json that has "passes": false. Choose based on dependencies and logical order, not just the highest ID.

2. Implement that single task. Run any available tests to verify the task is working.

3. UPDATE the prd.json by setting "passes": true for that ID.

4. Append a note to progress.txt with the task ID, title, and a brief description of the work done.

5. COMMIT the changes to the repository with a descriptive commit message.

6. Only work on one task at a time. Do not attempt to implement multiple tasks in a single iteration.

If all tasks in prd.json have passes: true, output exactly:
RALPH_COMPLETE

EOF
)

echo "Starting Ralph loop (max $MAX_ITERATIONS iterations)"
echo "=================================================="

for ((i=1; i<=MAX_ITERATIONS; i++)); do
    echo ""
    echo "=== Iteration $i/$MAX_ITERATIONS ===" | tee -a ralph.log
    echo "$(date '+%Y-%m-%d %H:%M:%S')" | tee -a ralph.log
    echo "---" >> ralph.log

    # Run Claude with the prompt and capture output
    # Note: Requires Claude CLI installed and authenticated
    OUTPUT=$(echo "$PROMPT" | claude --print --dangerously-skip-permissions 2>&1 | tee -a ralph.log)

    echo "" >> ralph.log

    # Check for completion signal
    if echo "$OUTPUT" | grep -q "RALPH_COMPLETE"; then
        echo ""
        echo "=================================================="
        echo "Ralph completed all tasks after $i iterations!"
        exit 0
    fi
done
