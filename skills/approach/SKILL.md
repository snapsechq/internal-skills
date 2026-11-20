---
name: approach
description: Defines the lean, efficient, high-impact methodology for approaching coding, code review, bug fixing, refactoring, and general engineering tasks in Antigravity. Use this skill whenever starting, planning, or executing any software engineering task, writing code, reviewing diffs or PRs, investigating bugs, or refactoring, to minimize tool calls, eliminate unnecessary research (like reading git logs or irrelevant files), and deliver fast, focused, high-quality results without wasting time or tokens.
---

# Approach to Engineering Tasks

This skill defines the operational mindset and execution protocol for software engineering tasks in Antigravity. Its core objective is **maximum efficiency and precision**: solving problems with minimal tool calls, minimal token overhead, and zero unnecessary exploratory detours.

---

## The Core Philosophy: Minimal Sufficient Context

Every tool call carries latency, cost, and context pollution. A senior engineer does not read the entire repository or dig through months of commit history to change a button, fix a null pointer, or review a pull request. They identify the minimal blast radius, inspect only what is strictly necessary, apply the change or feedback, verify locally, and finish.

### The Golden Rule
> **Never explore code or history out of curiosity or speculation.** Gather only the minimal sufficient context required to complete the specific task accurately.

---

## What NOT To Do (Common Inefficiencies to Avoid)

### 1. No Git Archaeological Dives
- **Do not run `git log`, `git blame`, `git diff HEAD~N`, or `git show`** unless the user explicitly asks for historical context (e.g., "when was this introduced?" or "bisect this regression").
- **Why**: The current working tree is the single source of truth. Past commits, commit messages, and author histories are almost always irrelevant to solving the immediate problem and consume massive context and time.

### 2. No Unbounded Codebase Reconnaissance
- **Do not browse the entire codebase** or read files outside the direct blast radius of the task.
- **Do not read dependency lockfiles** (`package-lock.json`, `pnpm-lock.yaml`, `Cargo.lock`) unless explicitly tasked with dependency resolution.
- **Do not read multiple adjacent files "just in case"**. Trace only the direct import, caller, or type definition that directly impacts your task.
- **Why**: Broad exploration fills the context window with noise, leading to higher hallucination rates, slower turnaround times, and unnecessary API calls.

### 3. No Speculative Runtime or Environment Probing
- **Do not probe the live runtime environment**: Avoid running commands like `ps`, `netstat`, `lsof`, `curl localhost`, or inspecting system daemons unless explicitly requested.
- **Do not attempt to inspect live databases or external services**: Assume the local development environment is static or partial—databases, caches, or background services may not be running locally.
- **Do not search for runtime logs**: Trust error messages and context provided by the user in the prompt. If runtime information is truly missing and required, ask concisely rather than hunting for log files.

### 4. Never Run Repository-Wide Test Suites Unprompted
- **Do not execute `npm test`, `pytest`, `cargo test`, `mvn test` across the whole repository** unless explicitly commanded by the user.
- **Why**: Full test suites in real-world repositories often take minutes, require unconfigured databases or network mocks, have existing flaky tests, and consume tens of thousands of tokens of stderr/stdout.

---

## Protocols by Task Type

### Protocol A: Coding & Bug Fixing

When implementing a feature, fixing a bug, or refactoring:

```
[Understand Request] ──► [Pinpoint Entry File] ──► [Read Local Scope Only] ──► [Edit] ──► [Targeted Verification] ──► [Done]
```

1. **Pinpoint the Entry Point directly**:
   - If the user gave a file path or symbol name, go directly to that file with `read_file`.
   - If the location is unknown, perform **one** targeted search (e.g. `grep` or file search for the exact identifier or error string). Do not wander.
2. **Inspect the immediate scope**:
   - Read only the relevant function, component, or lines. Avoid reading 1000+ line files in full if only 50 lines are relevant.
   - Follow imports or types only if the contract or interface is ambiguous from the immediate code.
3. **Assume baseline health**:
   - Assume all untouched code is working. Do not attempt unprompted cleanups, refactoring of adjacent functions, or fixing pre-existing linter warnings outside your scope.
4. **Make minimal, surgical edits**:
   - Keep changes tightly scoped to the request. Respect existing architectural patterns, formatting, and conventions in the file.
5. **Fast targeted verification**:
   - Run lightweight static checks on only the files you touched (e.g., `tsc --noEmit` on the file, `node -c <file>`, or targeted linter on the modified file).
   - Verify that your change does not break syntax, type definitions, or crash the service.
   - Stop and return the answer once verified.

---

### Protocol B: Code Review & PR Analysis

When asked to review a code snippet, diff, or pull request:

```
[Read Diff / Target Files] ──► [Analyze Blast Radius] ──► [Evaluate Quality & Risks] ──► [Deliver Structured Review]
```

1. **Stay anchored to the diff**:
   - Base your review solely on the changed files or provided patch.
   - Do NOT run `git log` or inspect historical commits to evaluate the PR author's past work.
   - Only inspect outside files if an imported contract or exported API signature changed and its direct caller/callee needs validation.
2. **Focus on high-value review dimensions**:
   - **Correctness & Logic**: Edge cases, null/undefined safety, race conditions, off-by-one errors.
   - **Security**: Injection vectors, auth/permission checks, sensitive data exposure.
   - **Performance**: Unnecessary re-renders, N+1 queries, unindexed lookups, memory leaks.
   - **Maintainability & Typing**: Type soundness, idiomatic conventions, clear naming.
3. **Review output format**:
   - Be concise and actionable.
   - Categorize comments by severity (e.g., `Critical`, `Warning`, `Suggestion`).
   - Include concrete replacement code snippets for suggested changes so the user can immediately apply them without guessing.

---

## Efficiency Checklist Before Making a Tool Call

Before executing any tool call, ask yourself:

| Question | If YES | If NO |
| :--- | :--- | :--- |
| **Is this information already in the prompt or context?** | **Stop.** Do not make the tool call. | Proceed. |
| **Am I about to run a `git` command (`git log`, `git blame`, etc.)?** | **Stop.** Unless explicitly requested, do not run it. | Proceed. |
| **Is this file directly relevant to the edit or review?** | Proceed with targeted reading. | **Stop.** Do not read tangential files. |
| **Am I about to run a full test suite unprompted?** | **Stop.** Use targeted syntax/linter checks instead. | Proceed. |
| **Can I accomplish this in fewer steps?** | Optimize and combine tool calls. | Proceed. |

---

## Summary Checklist for Completion

- [ ] Changed/reviewed only what was requested.
- [ ] No unprompted git history or commit inspection.
- [ ] No extraneous file reads or wandering through unrelated modules.
- [ ] No runtime daemon, port, or database poking.
- [ ] Verification completed with fast, lightweight, targeted checks (syntax, typing, or lint).
- [ ] Response is concise, direct, and actionable.
