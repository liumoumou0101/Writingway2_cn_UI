# Codex Development Plan

## Operating Model

Codex is the controller for planning, task decomposition, architecture decisions, review, acceptance, and failure handling.

OpenCode is the execution layer for scoped implementation, command execution, tests, logs, diffs, and structured reports.

DeepSeek V4 Pro is the generation layer for low-cost local code generation and patch production under OpenCode direction.

## Workflow

1. Analyze the user request.
2. Decide whether the work stays with Codex or is delegated to OpenCode.
3. Split implementation work into small, verifiable OpenCode tasks.
4. Select an OpenCode model strategy for each task.
5. Review OpenCode output using diff, logs, and test reports.
6. Mark the task as success, partial, or failed.
7. On failure, analyze the failure type and issue a smaller follow-up task.
8. After two consecutive failures, Codex takes over diagnosis and replanning.

## Mandatory Delegation Gate

For any implementation task that changes product code, tests, styling, or build behavior, Codex must create an OpenCode task before execution.

Codex may directly edit only orchestration documents such as `.ai_state/**`, planning docs, task specs, acceptance notes, and review records.

If no callable OpenCode tool is available in the current environment, Codex must:

1. Write the task spec into `.ai_state/opencode_tasks/`.
2. Mark the task as `blocked_waiting_for_opencode_execution` or `ready_for_opencode`.
3. Avoid product-code edits until OpenCode execution output is provided, unless the user explicitly authorizes Codex to take over.

Codex may take over implementation only after:

- OpenCode fails the same scoped task twice, or
- the user explicitly instructs Codex to implement directly, or
- the task is a documentation-only orchestration update.

## Acceptance Gate

Codex acceptance must be based on an OpenCode report containing:

- changed files
- executed commands
- test results
- diff summary
- failure analysis, if any

If a task was performed directly by Codex due to a process violation or explicit takeover, the execution log must say so plainly and must not label it as OpenCode work.

## OpenCode CLI Bridge

Current workspace feasibility check confirmed that OpenCode can be invoked through PowerShell.

Use this pattern for execution:

```powershell
opencode run -m deepseek/deepseek-v4-pro --file .ai_state\opencode_tasks\<task>.md -- "Execute this task exactly as specified. Do not expand scope. Return the required structured report."
```

Use this pattern for diagnosis or high-reasoning tasks:

```powershell
opencode run -m deepseek/deepseek-reasoner --file .ai_state\opencode_tasks\<task>.md -- "Analyze this failure and return the required structured report. Do not modify files unless the task explicitly allows it."
```

Important:

- Put `--` between `--file ...` and the message; otherwise OpenCode may treat the message as another file path.
- Do not use `--dangerously-skip-permissions` unless the user explicitly authorizes it.
- Do not run tests that bind `127.0.0.1:8000` in parallel.
- Save OpenCode reports under `.ai_state/test_reports/` or append them to `.ai_state/execution_log.md`.

## OpenCode Task Requirements

Each task must include:

- `task_id`
- `task_type`
- `objective`
- `model_selection`
- `files_allowed`
- `files_forbidden`
- `test_plan`
- `success_criteria`
- `failure_conditions`

## OpenCode Report Requirements

Each execution report must include:

- `task_id`
- `status`
- `modified_files`
- `executed_commands`
- `test_results`
- `git_diff_summary`
- `failure_analysis`
- `next_suggestion`
