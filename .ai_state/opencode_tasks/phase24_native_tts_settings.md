# OpenCode Task: phase24_native_tts_settings

```yaml
task_id: phase24_native_tts_settings
task_type: medium_ui_settings_polish
status: ready_for_opencode
model_selection:
  model: deepseek-v4-pro
  reasoning: LOW
objective: >
  Add native settings controls for text-to-speech voice and speed, and make
  native writer read-aloud use those controls instead of relying on hidden legacy
  localStorage values.
files_allowed:
  - desktop.html
  - src/desktop/desktop-shell.js
  - src/styles/desktop.css
  - tests/writer-button-audit.js
  - docs/REFACTOR_TODO.md
files_forbidden:
  - main.html
  - src/app.js
  - src/core/**
  - desktop/services/**
  - desktop/storage/**
  - desktop/local-server.js
  - package.json
  - package-lock.json
  - .ai_state/**
constraints:
  - Do not change project data schemas or backend settings services.
  - Treat TTS settings as local UI preferences only.
  - Do not add dependencies.
  - Do not redesign the whole settings page.
  - Do not change generation provider settings behavior.
  - Do not run tests that bind 127.0.0.1:8000 in parallel.
product_intent:
  - Writers should be able to choose a TTS voice from the native settings page.
  - Writers should be able to set read-aloud speed from the native settings page.
  - Read-aloud should use those preferences consistently.
  - Existing old localStorage keys may be read for compatibility, but the native settings UI should become the primary entry.
implementation_guidance:
  - Add a compact TTS section to the existing native settings page.
  - Suggested selectors:
    - `data-settings-tts-voice`
    - `data-settings-tts-rate`
    - `data-settings-tts-rate-value`
    - optionally `data-settings-tts-refresh-voices`
  - Populate voices from `window.speechSynthesis.getVoices()` when available.
  - Handle `voiceschanged` so voice options can appear after the browser loads them.
  - Persist preferences in localStorage, preferably reusing compatible keys such as `writingway:ttsVoice` and `writingway:ttsSpeed`.
  - `readNativeSceneAloud()` should read the same preference source used by settings controls.
  - Keep fallback voice selection for Chinese voices when no explicit voice is selected.
  - Writer audit should stub `speechSynthesis.getVoices()`, set voice/rate controls, trigger read aloud, and assert `SpeechSynthesisUtterance.voice` and `.rate`.
test_plan:
  - npm run writer-audit
  - npm run desktop-mainline-test
  - npm run unit
success_criteria:
  - Settings page exposes TTS voice and speed controls.
  - Voice list populates from `speechSynthesis.getVoices()`.
  - Changing TTS controls persists local preferences.
  - Native read-aloud applies selected voice and speed.
  - Existing read/stop behavior still works.
  - Writer audit covers selected voice and speed.
  - All listed tests pass sequentially.
failure_conditions:
  - Provider/generation settings regress.
  - Read-aloud stops working in environments with speech synthesis.
  - TTS preferences are written into project data or backend settings schemas.
  - Forbidden files are modified.
  - Tests are skipped, parallelized into known port conflicts, or falsely reported.
required_report:
  - task_id
  - status
  - modified_files
  - executed_commands
  - test_results
  - git_diff_summary
  - failure_analysis
  - next_suggestion
```

