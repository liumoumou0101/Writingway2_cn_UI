# OpenCode Report: phase29_fix_project_more_toggle_label

## task_id

phase29_fix_project_more_toggle_label

## status

PASS

## modified_files

- `src/desktop/desktop-shell.js` (line 300): Fixed inverted ternary in the `moreButton` click handler textContent assignment.

## executed_commands

1. `npm run desktop-mainline-test` — PASS
2. `npm run writer-audit` — PASS

## test_results

| Test Suite | Result |
|---|---|
| `tests/desktop-library.js` | PASS |
| `tests/desktop-reader.js` | PASS |
| `tests/writer-button-audit.js` | PASS |

All specified tests passed on first run after the fix.

## git_diff_summary

One-line change in `src/desktop/desktop-shell.js` line 300:

```diff
-                moreButton.textContent = hidden ? '收起' : '更多';
+                moreButton.textContent = hidden ? '更多' : '收起';
```

This reverses the ternary to match correct behavior:
- `hidden = true` (drawer collapsed): button shows "更多"
- `hidden = false` (drawer expanded): button shows "收起"

The `is-expanded` class toggle on line 299 was already correct and was not changed.

## failure_analysis

None. The root cause was a simple reversed ternary: the label assignment inverted the mapping between `hidden` state and displayed text. The class toggle (`is-expanded`) was already correct, which made the mismatch obvious.

## next_suggestion

No further action needed. The "更多/收起" toggle now behaves correctly:
- Initial collapsed state: "更多" with no `is-expanded` class
- After click to expand: "收起" with `is-expanded` class
- After click to collapse: "更多" with `is-expanded` removed
