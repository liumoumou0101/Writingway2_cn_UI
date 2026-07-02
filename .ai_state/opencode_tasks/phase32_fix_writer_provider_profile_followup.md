# OpenCode Task: phase32_fix_writer_provider_profile_followup

## task_id

phase32_fix_writer_provider_profile_followup

## task_type

failure diagnosis and scoped fix

## objective

Fix the partial implementation from `phase32_writer_provider_profile_model_switch` without expanding scope.

Observed after the first OpenCode timeout:

1. `node tests/settings-service.js` passes.
2. `node tests/provider-stream.js` passes.
3. `npm run writer-audit` fails because `[data-native-thinking-toggle]` is disabled after the audit selects `deepseek-v4-pro`.
4. `desktop.html` appears to have lost the opening `<section class="desktop-settings-section" data-settings-section="generation">` around the generation defaults controls after the new provider profiles section.
5. Writer profile options currently include API profiles even when they have no saved API key. The requirement says unconfigured API vendors/profiles must not appear as selectable working profiles.

## model_selection

- model: deepseek/deepseek-reasoner
- reasoning: ON
- rationale: diagnosis/fix after a failed implementation and a writer-audit failure.

## files_allowed

- `desktop.html`
- `src/desktop/desktop-shell.js`
- `src/core/settings/settings-schema.js`
- `src/core/settings/model-catalog.js`
- `src/core/generation/provider-stream.js`
- `tests/writer-button-audit.js`
- `tests/settings-service.js`
- `tests/provider-stream.js`
- `.ai_state/test_reports/phase32_fix_writer_provider_profile_followup_opencode_report.md`
- `.ai_state/test_reports/phase32_writer_provider_profile_model_switch_opencode_report.md` if you want to complete the original report

## files_forbidden

- Prompt templates
- Context resolver / compendium logic
- Workflow engine
- Project storage schema
- Release artifacts
- Git operations
- Any unrelated UI redesign

## required_fixes

1. Restore valid Settings HTML
   - Ensure the generation defaults controls are inside `<section class="desktop-settings-section" data-settings-section="generation">`.
   - Ensure the new profiles section is properly closed before the generation section starts.

2. Fix DeepSeek thinking enablement
   - When the writer profile is `inherit` and the global runtime provider is DeepSeek API, selecting `deepseek-v4-pro` or `deepseek-v4-flash` must enable the Thinking checkbox.
   - When writer profile is `inherit`, model options should include DeepSeek model options if the inherited global provider is DeepSeek API.
   - `nativeGenerationConfig()` must still produce `model: "deepseek-v4-pro"` and `enableThinking: true` for the writer audit's inherit/global DeepSeek case.

3. Filter selectable profiles
   - Extra API profiles shown in `[data-native-profile-select]` must be API-compatible and must have a saved API key.
   - Profiles without `hasApiKey`/`apiKey` may be visible in Settings, but must not appear as writer-selectable working profiles.
   - Local/global inherit remains available.

4. Keep first-pass behavior
   - Do not add Anthropic/Google writer support.
   - Do not alter prompt templates or narrative-control logic.
   - Do not weaken API key hiding in public settings.

## test_plan

Run sequentially:

1. `node tests/settings-service.js`
2. `node tests/provider-stream.js`
3. `npm run writer-audit`
4. `npm run desktop-mainline-test`
5. `npm run unit`

If the full set risks timing out, prioritize the first three and clearly state what was not run.

## success_criteria

- The Settings page HTML has a valid profiles section and generation section.
- `npm run writer-audit` passes, including DeepSeek model thinking and provider profile scenarios.
- Unconfigured extra API profiles are not selectable from the writer page.
- Public settings still hide raw API keys.
- Required report saved to `.ai_state/test_reports/phase32_fix_writer_provider_profile_followup_opencode_report.md`.

## failure_conditions

- Writer audit still fails.
- Thinking toggle remains disabled for configured DeepSeek model selection.
- Raw API keys appear in public settings.
- Unsupported/unconfigured vendors appear as writer-selectable working profiles.
- Changes expand into unrelated features.

## required_report_format

Save a report at `.ai_state/test_reports/phase32_fix_writer_provider_profile_followup_opencode_report.md` and include:

- task_id
- status
- modified_files
- executed_commands
- test_results
- git_diff_summary
- failure_analysis
- next_suggestion
