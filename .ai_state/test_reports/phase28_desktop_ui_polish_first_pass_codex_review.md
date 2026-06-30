# Codex Review: phase28_desktop_ui_polish_first_pass

## Result

success after follow-up

## Scope

OpenCode implemented the first desktop UI polish pass with CSS-only product changes. Codex found one visual regression in the compendium checkbox and issued follow-up task `phase28_desktop_ui_polish_followup_checkbox`, which OpenCode fixed.

## Changed Product Files

- `src/styles/desktop.css`

## What Improved

- Shared control baseline for text inputs, search inputs, number inputs, selects, textareas, checkboxes, ranges, and file inputs.
- Select controls now have consistent padding, focus states, and dark-theme dropdown arrow styling.
- Writer assistant tabs and panel sections have clearer spacing and active states.
- Context, metadata, structure, generation, and rewrite panels read more like grouped tool sections.
- Bookshelf action area, project badges, and library status styling are calmer.
- Compendium tools and editor form are more product-like.
- Settings sections are more compact with clearer headings and consistent controls.
- Reader controls and recovery toolbar received the same control treatment.

## Follow-up Fix

Codex visual review found the compendium `默认加入生成上下文` checkbox had become oversized because generic `.desktop-compendium-form-grid input` rules affected checkbox inputs. OpenCode fixed this by excluding checkbox/range inputs from generic full-width form rules and adding a compact checkbox-row rule.

## Codex Verification

- Generated viewport screenshots for 1366x768 and 1920x1080.
- DOM checks:
  - 1366x768 document horizontal overflow: 0
  - 1920x1080 document horizontal overflow: 0
  - visible select controls were not clipped
  - no detected visible control overlap
- Compendium checkbox verification:
  - `[data-compendium-always]` bounding box: 16x16

## Tests

- `npm run writer-audit`: passed
- `npm run desktop-mainline-test`: passed
- `npm run unit`: passed

## Remaining UI Work

- Workflow still needs deeper timeline/artifact visualization.
- Bookshelf project cards still expose too many actions directly.
- Settings would benefit from category navigation.
- Recovery needs a stronger dense-list and diff-detail design for real backup-heavy projects.
