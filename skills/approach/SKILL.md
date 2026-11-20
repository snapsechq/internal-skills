---
name: approach
description: A high-velocity, disciplined framework for approaching any coding or code-related task. Enforces default plan-first mode (proposing a concise plan for user approval before editing files), bans git history/commit churn, prevents scope creep, minimizes tool calling, and eliminates excessive post-checks. Use whenever the user asks for code changes, bug fixes, feature implementation, refactoring, or code-related tasks.
---

# Approach: High-Velocity, Plan-First Coding Framework

This skill teaches agents how to approach coding and software engineering tasks with high velocity, minimal tool churn, and disciplined precision.

---

## Core Philosophy

1. **Plan before acting**: Default to planning mode. Present a clear, concise plan to the user and wait for approval before making file changes.
2. **Surgical context**: Read only what is strictly required to understand the immediate task. Never explore peripheral files.
3. **Batch execution**: Perform all necessary reads, edits, or commands in unified, batched turns rather than piecemeal tool calls.
4. **Minimal post-checks**: Run at most a single targeted validation check. Never enter multi-pass verification loops.

---

## The Two-Phase Workflow

### Phase 1: Planning Mode (DEFAULT)

Whenever a coding task is presented, the agent **must start in planning mode**. Do not make edits or write code until the user approves the plan.

1. **Targeted Inspection**:
   - Read only the specific target file(s) mentioned by the user or directly involved in the issue.
   - Do NOT run broad greps or read unrelated files.
2. **Formulate the Plan**:
   - Provide a concise plan using this exact structure:
     - **Objective**: 1–2 sentence summary of what will be accomplished.
     - **Affected Files**: Explicit file paths to be created or modified.
     - **Key Changes**: Bulleted list of specific changes/logic to apply.
     - **Validation Step**: The single command or test that will verify the change.
3. **Request Approval**:
   - Conclude by asking the user to confirm or adjust the plan before proceeding.

> **Exception**: If the user's prompt explicitly instructs immediate execution (e.g., "fix this immediately without asking", "go ahead and do it now"), you may combine the plan summary directly into the execution turn.

---

### Phase 2: Execution Mode (After Approval)

Once the user approves the plan:

1. **Batch Edits**:
   - Apply edits to all target files in a single turn.
   - Make clean, surgical modifications that stick strictly to the approved scope.
2. **Single Targeted Verification**:
   - Run at most ONE relevant check (e.g., build command, targeted unit test, or syntax check) chained with `&&` if dependent.
   - Do NOT run redundant checks, linter sweeps, or full regression suites unless requested.
3. **Concise Report**:
   - Present a succinct summary of what changed and the result of the validation step, with clickable file links.

---

## Strict Anti-Patterns (Banned Behaviors)

### 1. No Git History or Commit Browsing
- **Never** run `git log`, `git reflog`, `git show <commit>`, `git blame`, or inspect commit messages unless the user specifically asked for historical context.
- Treat the current working tree as the source of truth.

### 2. No Scope Creep or Unnecessary Exploration
- Do not inspect surrounding directories, config files, or helper modules that are not directly relevant to the user request.
- If a target file path is provided, inspect only that file. Avoid "exploring the architecture" unless the user asks an architectural question.

### 3. No Tool Calling Churn
- Never issue one tool call per turn when multiple calls can be batched in parallel.
- Never repeat a search or re-read a file that has not changed.
- Avoid multi-step search pipelines when the target location is already known.

### 4. No Excessive Post-Verification Loops
- Avoid running multiple rounds of `git status`, `git diff`, test suites, and linter runs after an edit.
- If a verification check succeeds, stop immediately and report the outcome.
- Do not re-run passing tests without new changes.

---

## Output Template: Plan Format

When presenting the plan in Phase 1, use this concise template:

```markdown
### Proposed Plan

**Objective**: [1 sentence on the goal]

**Files to Modify**:
- `[path/to/file.ext]`: [brief description of change]

**Changes**:
1. [Specific edit 1]
2. [Specific edit 2]

**Verification**:
- `[single validation command, e.g., npm run build / pytest path/to/test]`

Please let me know if you would like me to proceed with this plan or make any adjustments.
```
