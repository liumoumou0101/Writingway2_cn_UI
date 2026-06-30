# Codex Review: phase26_desktop_ui_closure

## Scope

OpenCode executed `phase26_desktop_ui_closure_pass`, then Codex found one acceptance issue and issued `phase26_desktop_ui_closure_followup_workshop_actions`.

## Result

success

## Changed Product Files

- `desktop.html`
- `src/desktop/desktop-shell.js`
- `src/styles/desktop.css`

## What Changed

- Writer assistant tabs now wrap instead of horizontally overflowing, with compact button sizing for 1366 and 1920 desktop widths.
- Empty or placeholder-feeling desktop surfaces were tightened:
  - bookshelf placeholder layout expands better on wide screens
  - settings layout expands better on wide screens
  - workflow copy now labels the current workflow as an experimental guided writing flow
  - recovery restore buttons have clearer disabled styling
- Workshop output actions are now hidden before an assistant response and reappear after an assistant response exists.

## OpenCode Acceptance Notes

The first OpenCode pass reported success, but Codex independent verification found the workshop action bar still visible before assistant output. Root cause: `renderWorkshop()` correctly set `hidden`, but `.desktop-workshop-output-actions { display: flex; }` overrode the browser's default `[hidden] { display: none; }`.

Codex created a smaller follow-up task. OpenCode fixed it with:

```css
.desktop-workshop-output-actions[hidden] {
    display: none;
}
```

## Verification

OpenCode reported:

- `npm run unit` passed in the first pass
- `npm run desktop-mainline-test` passed in both passes
- `npm run writer-audit` passed in both passes

Codex independently ran:

- Focused Playwright DOM/viewport check: passed
  - 1366x768 writer tabs: 8 visible, horizontal overflow 0
  - 1920x1080 writer tabs: 8 visible, horizontal overflow 0
  - workshop actions hidden before assistant output
  - workshop actions visible after assistant output
  - recovery restore buttons disabled before backup selection
- `npm run unit`: passed
- `npm run desktop-mainline-test`: passed
- `npm run writer-audit`: passed
- `npm run dist`: passed and refreshed `release/`
- `npm run packaged-smoke`: first run hit transient Windows `EPERM` on temp `sessions.json` rename; immediate rerun passed

## Residual Risk

- Desktop UI is now substantially cleaner, but this was not a full design-system rewrite. Manual testing should still cover real monitor sizes, especially long Chinese project names, dense prompt-template lists, and backup/recovery lists with many entries.
