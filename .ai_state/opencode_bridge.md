# OpenCode Bridge Feasibility Report

Date: 2026-06-29

## Result

OpenCode delegation is feasible in this workspace through the local CLI.

## Confirmed Commands

```powershell
opencode --version
```

Result:

```text
1.17.11
```

```powershell
opencode providers list
```

Result summary:

```text
DeepSeek api credential configured
```

```powershell
opencode models deepseek
```

Result:

```text
deepseek/deepseek-chat
deepseek/deepseek-reasoner
deepseek/deepseek-v4-flash
deepseek/deepseek-v4-pro
```

```powershell
opencode run -m deepseek/deepseek-v4-pro "Reply exactly: OPENCODE_READY. Do not inspect or modify files."
```

Result:

```text
OPENCODE_READY.
```

```powershell
opencode run -m deepseek/deepseek-reasoner "Reply exactly: REASONING_READY. Do not inspect or modify files."
```

Result:

```text
REASONING_READY
```

```powershell
opencode run -m deepseek/deepseek-v4-pro --file .ai_state\opencode_tasks\phase23_w2_save_status_paragraph_spacing.md -- "Read the attached OpenCode task spec and reply with exactly three lines: task_id=<id>, status=<status>, can_execute=<yes/no>. Do not modify files or run tests."
```

Result:

```text
task_id=phase23_w2_save_status_paragraph_spacing, status=ready_for_opencode, can_execute=yes
```

## Codex CLI Probe

`codex.exe` exists under the WindowsApps package path, but direct invocation fails:

```text
Access is denied
```

Do not use local Codex CLI as the bridge unless that WindowsApps execution issue is resolved.

## Bridge Decision

Use OpenCode CLI as the execution bridge:

```powershell
opencode run -m <provider/model> --file .ai_state\opencode_tasks\<task>.md -- "<bounded execution instruction>"
```

Model mapping:

- Simple or medium implementation: `deepseek/deepseek-v4-pro`
- High-reasoning bug diagnosis or failed tests: `deepseek/deepseek-reasoner`
- Fast low-cost checks: `deepseek/deepseek-v4-flash`

No extra plugin is required for the basic bridge. A dedicated plugin or wrapper script would only be useful later to standardize report capture, command quoting, and task status updates.

