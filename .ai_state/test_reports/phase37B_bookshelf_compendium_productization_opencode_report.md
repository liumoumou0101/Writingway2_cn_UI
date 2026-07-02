# Phase 37B: Bookshelf & Compendium Productization Report

Date: 2026-07-02
Task: `phase37B_bookshelf_compendium_productization`
Status: **COMPLETE**

## Test Results

| Test | Result | Notes |
|---|---|---|
| `node tests/desktop-library.js` | PASSED | Desktop project library test passed |
| `node tests/writer-button-audit.js` | PASSED | Writer button audit passed |

## Scope Verification

- [x] No files in `desktop/storage/`, `desktop/services/`, `src/core/`, `package.json`, or `release/` were modified
- [x] No business logic, data structures, import/export semantics, or context resolution rules were changed
- [x] No existing functionality entries were removed
- [x] No new business storage fields were introduced

## Changes Summary

### 1. Bookshelf (书库) - `desktop.html`, `src/desktop/desktop-shell.js`, `src/styles/desktop.css`

#### Left Sidebar Reorganized into Three Fixed Blocks

| Before | After | Change |
|---|---|---|
| "开始" section | "创作入口" section | Renamed + added `desktop-action-group-primary` class for visual emphasis |
| "导入" section | "导入迁移" section | Renamed to clarify purpose |
| "维护" section | "维护" section | Unchanged |

- The "创作入口" block now has a subtle teal-tinted border and background to visually distinguish the primary creation entry point from secondary actions.

#### Empty State: Executable CTA

Before: Static text message `"还没有保存到磁盘的项目。使用「新建作品」创建第一部小说，或导入已有项目。"`

After: Two clear action buttons rendered inside the empty state area:
- **"新建作品"** button (primary action) - triggers `openProjectCreator()`
- **"导入项目"** button (secondary action) - triggers project import file dialog

Both buttons are created programmatically with direct event listeners, ensuring they always work regardless of when `bindProjectLibrary()` was initially called.

Added CSS: `.desktop-library-status-text` and `.desktop-library-status-actions` for the CTA layout (centered, flexbox, 12px gap).

#### Project Card Hierarchy (unchanged, verified)

- "继续写作" remains the primary button (teal gradient, hover glow)
- "编辑信息" and "更多" are secondary mini-actions
- "移出书库" is visually separated as a danger action (red-tinted, right-aligned, separate row)
- This already matched the spec requirements

### 2. Compendium (资料库) - `desktop.html`, `src/desktop/desktop-shell.js`, `src/styles/desktop.css`

#### Empty States: Hidden Disabled Form, Clear Guidance

**No project open:** The large disabled form is now completely hidden. Instead, an empty state overlay shows:
- Icon (book emoji)
- Title: "未打开项目"
- Description: "从书库打开一个项目，即可编辑该项目的资料。"

**No entry selected:** The disabled form is hidden. Instead, an empty state overlay shows:
- Title: "选择资料条目"
- Description: "从左侧列表中选择资料卡进行编辑，或点击「新资料」创建资料卡。"

The form is only shown when both a project is open AND an entry is selected.

Added CSS: `.desktop-compendium-editor-empty`, `.desktop-compendium-empty-content`, `.desktop-compendium-empty-icon` for centered empty state layout.

#### Content vs Context Section Separation

Two section dividers added to the form grid:

1. **"资料内容"** heading - groups: Type, Title, Summary, Tags, Aliases, Body
2. **"写作上下文 · 注入策略"** heading - groups: Always Inject checkbox, Injection Policy fieldset, Character fieldset

The editor header kicker changed from "Entry" to "资料编辑".

Added CSS: `.desktop-compendium-section-heading` (full-width grid item, accented color, uppercase, letter-spaced, bottom border).

#### Character Fieldset Renamed

From "人物信息" to **"人物约束"** to better convey that these fields serve as writer constraints.

#### Injection Badge Visual Hierarchy

Improved `.desktop-compendium-injection-badge` styling:
- Increased padding: `2px 7px` → `3px 8px`
- Increased font size: `10px` → `11px`
- Increased font weight: `500` → `600`
- Added distinct visual states per mode:
  - `always`: Strong teal highlight (border 0.48 opacity, background 0.22)
  - `mention` / `auto`: Medium teal (border 0.28, background 0.12)
  - `manual` / `disabled`: Dimmed, gray-tinted

#### Trigger Checkboxes as Toggle Pills

Redesigned trigger checkboxes into bordered pill toggles:
- Each trigger checkbox has a bordered pill wrapper with hover border effect
- Checked state shows teal border + subtle teal background
- Better visual feedback for active/inactive trigger conditions

Added CSS: `.desktop-compendium-triggers label` bordered pill styling, `:has(input:checked)` state.

#### Character Fieldset Visual Distinction

Added subtle teal border tint to character fieldset (`border-color: rgba(73, 166, 155, 0.16)`) to visually connect it with the writing context area.

## Files Modified

| File | Lines Changed | Nature |
|---|---|---|
| `desktop.html` | ~10 edits | Sidebar labels, compendium empty state, form section headings, legend text |
| `src/styles/desktop.css` | ~60 lines added | Empty state CTAs, section headings, badge/toggle/fieldset styling |
| `src/desktop/desktop-shell.js` | ~40 lines changed | Empty state CTA buttons, compendium form show/hide logic |

## Verification Checklist

- [x] No deleted functionality entries
- [x] Project creation, import, refresh, open, edit, more actions, remove - all preserved
- [x] Compendium new/edit/delete/save, injection policy, character fields, search, type filter - all preserved
- [x] `desktop-mainline-test` passes
- [x] `writer-audit` passes
- [x] No structural CSS changes that would cause overflow at 1366x768/1920x1080/2560x1440
- [x] Danger operations ("移出书库", "删除" in compendium) visually separated from primary operations
- [x] Bookshelf first screen: primary CTA (继续写作 / 新建作品) clearly visible
- [x] Compendium no longer appears as a full page of disabled form fields
