# Codex Review: phase23_w2_save_status_paragraph_spacing

Date: 2026-06-29

## OpenCode Report Summary

OpenCode reported `completed`.

Reported passing commands:

- `npm run writer-audit`
- `npm run desktop-mainline-test`
- `npm run unit`

Reported modified files:

- `desktop.html`
- `src/desktop/desktop-shell.js`
- `src/styles/desktop.css`
- `tests/writer-button-audit.js`

## Codex Acceptance Decision

`partial`

## Findings

1. Paragraph-spacing CSS appears invalid.

   Location: `src/styles/desktop.css`

   Current implementation:

   ```css
   padding-block: calc(34px + var(--native-editor-paragraph-spacing, 0em) * 1em);
   ```

   CSS `calc()` does not support multiplication in normal browser CSS. Because the custom property is already set as an `em` length in JavaScript, the expression should not multiply it by another `1em`.

2. Test coverage missed the actual visual/style application.

   `tests/writer-button-audit.js` checks that the paragraph-spacing slider display reads `0.5` and that font size applies, but it does not verify that paragraph spacing changes a computed style or a meaningful editor layout value.

3. Product semantics are still approximate.

   A native `textarea` cannot apply true paragraph margins inside its text content. For this slice, an editor spacing control may be acceptable as an approximation, but the label and test should avoid implying true rich paragraph layout unless the editor rendering path changes.

## Required Follow-up

Issue a smaller OpenCode fix task:

- Correct the invalid CSS.
- Make the applied style testable.
- Update writer audit to verify the spacing style changes, not just the displayed slider value.
- Keep scope limited to the current typography/save-status slice.

