# Decisions

## Model Routing

- Simple CRUD or small edits: `deepseek-v4-pro`, reasoning OFF.
- Medium module-level changes: `deepseek-v4-pro`, reasoning LOW.
- Complex logic or root-cause bug analysis: `deepseek-v4-pro-reasoning`, reasoning ON.
- Test failure analysis: `deepseek-v4-pro-reasoning`, reasoning ON.
- Architecture and global design decisions remain with Codex.

## Control Rules

- Codex is the only decision maker for scope, architecture, acceptance, and replanning.
- OpenCode must not expand task scope or alter objectives.
- DeepSeek must not make architecture decisions.
- Do not delete large numbers of files.
- Do not run dangerous git operations unless explicitly authorized.
- Do not bypass tests.
- Do not report tests as passing unless they were actually run and passed.

## 2026-06-29 Process Correction

- Product-code implementation must be delegated to OpenCode through a written task spec before edits begin.
- Codex direct implementation is not the default, even for small UI slices.
- When OpenCode is unavailable as a callable tool, Codex should produce task specs and wait for execution output instead of silently acting as the executor.
- Documentation and state-management updates remain safe for Codex to perform directly.

## 2026-06-29 OpenCode Bridge Feasibility

- Local `opencode` CLI is available at `C:\Users\10937\scoop\shims\opencode.exe`.
- `opencode --version` returns `1.17.11`.
- DeepSeek credentials are configured in OpenCode.
- `opencode models deepseek` lists:
  - `deepseek/deepseek-chat`
  - `deepseek/deepseek-reasoner`
  - `deepseek/deepseek-v4-flash`
  - `deepseek/deepseek-v4-pro`
- Practical model mapping:
  - simple and medium tasks: `deepseek/deepseek-v4-pro`
  - high-reasoning and failure diagnosis: `deepseek/deepseek-reasoner`
  - fast/low-cost tasks: `deepseek/deepseek-v4-flash` if acceptable for the task
- `opencode run` can read `.ai_state/opencode_tasks/*.md` via `--file` and return structured output.
- No extra Codex plugin is required for basic OpenCode delegation because Codex can invoke OpenCode through the shell.
- Direct `codex.exe` CLI invocation from `C:\Program Files\WindowsApps\...` currently fails with `Access is denied`; do not rely on Codex CLI as the execution bridge in this workspace.
