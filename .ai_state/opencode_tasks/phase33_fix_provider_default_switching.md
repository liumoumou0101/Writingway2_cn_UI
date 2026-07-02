# OpenCode Task: phase33_fix_provider_default_switching

## task_id

phase33_fix_provider_default_switching

## task_type

small follow-up fix

## objective

Fix one acceptance gap from `phase33_provider_profile_manager_usability`:

The provider editor currently fills endpoint/model defaults only when fields are empty or endpoint looks local. It must also update fields when they still contain the previous provider's default endpoint/model.

Example expected behavior:

1. Open a new profile editor.
2. Provider defaults to DeepSeek and endpoint/model may be DeepSeek defaults.
3. Change provider to OpenAI.
4. If endpoint is still `https://api.deepseek.com/chat/completions`, replace it with `https://api.openai.com/v1/chat/completions`.
5. If model is still `deepseek-v4-pro`, replace it with OpenAI's default model hint if configured.

Do not expand scope beyond provider-default switching and tests.

## model_selection

- model: deepseek/deepseek-v4-pro
- reasoning: OFF/LOW

## files_allowed

- `src/desktop/desktop-shell.js`
- `src/core/settings/model-catalog.js`
- `src/core/settings/settings-schema.js`
- `tests/writer-button-audit.js`
- `.ai_state/test_reports/phase33_fix_provider_default_switching_opencode_report.md`

## files_forbidden

- Provider streaming logic
- Prompt/context/workflow/project storage files
- Release artifacts
- Git operations

## required_fix

- Add a robust helper in the renderer or catalog layer to detect whether a field currently contains any known provider default endpoint/model.
- On provider change in the profile editor:
  - If endpoint is empty OR local-looking OR equals any known provider default endpoint, update it to the newly selected provider default endpoint when available.
  - If model is empty OR equals any known provider default model hint, update it to the newly selected provider default model hint when available.
  - If user has typed a non-default custom endpoint/model, do not overwrite it.
- Keep existing DeepSeek endpoint auto-fill behavior compatible.

## test_plan

Run sequentially:

1. `npm run writer-audit`
2. `node tests/settings-service.js`

If time permits:

3. `npm run desktop-mainline-test`

## success_criteria

- Writer audit or focused test proves DeepSeek default endpoint/model switch to OpenAI defaults when changing provider.
- Writer audit or focused test proves a custom endpoint/model is not overwritten when changing provider.
- Required tests pass.
- Report saved.

## failure_conditions

- Custom user endpoint/model is overwritten.
- Existing profile save/test behavior regresses.
- Tests fail.

## required_report_format

Save a report at `.ai_state/test_reports/phase33_fix_provider_default_switching_opencode_report.md` and include:

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
