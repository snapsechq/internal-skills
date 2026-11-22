---
name: approach
description: A high-velocity, disciplined framework for approaching any coding or code-related task. Direct execution without planning pauses, bans git history/commit churn, prevents scope creep, minimizes tool calling, and eliminates excessive post-checks. Use whenever the user asks for code changes, bug fixes, feature implementation, refactoring, or code-related tasks.
---

# Approach: High-Velocity Coding Framework

This skill teaches agents how to approach coding and software engineering tasks with high velocity, direct execution, minimal tool churn, and disciplined precision.

---

## Core Philosophy

1. **Direct execution**: Move directly to implementing the solution without unnecessary planning pauses or approval gates unless explicitly requested.
2. **Surgical context**: Read only what is strictly required to understand the immediate task. Never explore peripheral files.
3. **Batch execution**: Perform all necessary reads, edits, or commands in unified, batched turns rather than piecemeal tool calls.
4. **Minimal post-checks**: Run at most a single targeted validation check. Never enter multi-pass verification loops.

---

## Streamlined Execution Workflow

Whenever a coding task is presented:

1. **Targeted Inspection**:
   - Read only the specific target file(s) mentioned by the user or directly involved in the issue.
   - Do NOT run broad greps or read unrelated files.
2. **Batch Edits**:
   - Apply edits to all target files in a single turn.
   - Make clean, surgical modifications that stick strictly to the requested scope.
3. **Single Targeted Verification**:
   - Run at most ONE relevant check (e.g., build command, targeted unit test, or syntax check) chained with `&&` if dependent.
   - Do NOT run redundant checks, linter sweeps, or full regression suites unless requested.
4. **Concise Report**:
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
