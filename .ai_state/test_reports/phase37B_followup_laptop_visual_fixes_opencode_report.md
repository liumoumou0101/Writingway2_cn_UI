# Phase 37B Follow-up: Laptop Visual Fixes Report

**Date:** 2026-07-02
**Task:** `phase37B_followup_laptop_visual_fixes`

## Summary

All three visual issues identified in the Codex recheck report for 1280x720 and 1366x768 viewports have been addressed. All automated tests pass, and Playwright visual checks confirm fixes at all three target viewports.

## Changes Made

### Fix 1: Bookshelf Left Workspace — Maintenance Buttons No Longer Clipped

**Problem:** At 1280x720 and 1366x768, the `.desktop-placeholder-copy` (sticky left panel) content exceeded viewport height, causing the "维护" section buttons (刷新书库, 打开项目目录) to be clipped below the fold.

**Changes in `src/styles/desktop.css`:**

- Added `max-height: calc(100vh - 124px)` and `overflow-y: auto` to `.desktop-placeholder-copy` (line 596), making the left panel internally scrollable so all buttons remain accessible.
- Added `@media (max-height: 860px)` query (after line 579) that reduces padding, gap, button min-height, and font sizes within action groups at small viewport heights.

**Verification:** Playwright confirms both `[data-refresh-projects]` and `[data-open-project-folder]` are visible at all three target viewports. At 1280x720, the panel becomes scrollable with `scrollHeight > clientHeight`.

### Fix 2: Save Path Text Ellipsis

**Problem:** The project save location path (`保存位置：...`) displayed in `.desktop-library-meta` could be very long, appearing cramped.

**Changes in `src/styles/desktop.css`:**

- Added `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;` to `.desktop-library-meta` (line 624).

**Changes in `src/desktop/desktop-shell.js`:**

- Updated `setProjectLibraryMeta()` (line 282) to set `meta.title = message`, preserving full path accessibility via hover tooltip.

**Verification:** Playwright confirms ellipsis CSS properties are applied. Full path remains available via the element's `title` attribute.

### Fix 3: Compendium Empty State — Hidden Disabled Controls

**Problem:** When no project is open, the compendium sidebar still showed the full tools area (search input, type filter, disabled "新资料" button), creating a "filter form + big blank" appearance.

**Changes in `src/styles/desktop.css`:**

- Added `.desktop-compendium-tools[hidden] { display: none; }` (after line 1039).

**Changes in `src/desktop/desktop-shell.js`:**

- In `renderCompendium()` (line 2964), added logic to hide `.desktop-compendium-tools` when `!hasProject`, and show it when a project is open.

**Existing behavior preserved:** The editor form (`[data-compendium-form]`) is already hidden when no project is open (lines 3013-3019), and the empty state shows "未打开项目" with clear guidance: "从书库打开一个项目，即可编辑该项目的资料。"

**Verification:** Playwright confirms at all three viewports: form is hidden, tools area is hidden, empty state is visible with title "未打开项目".

## Automated Test Results

| Test | Result |
|------|--------|
| `npm run desktop-mainline-test` | PASSED |
| `npm run writer-audit` | PASSED |

## Playwright Visual Check Results

Screenshots saved to: `.ai_state/test_reports/phase37b_visual_check/`

### 1280x720

| Check | Result |
|-------|--------|
| 书库 横向溢出 | false |
| 书库 左侧工作台可见 | true |
| 书库 刷新书库可见 | true |
| 书库 打开项目目录可见 | true |
| 书库 保存路径省略样式 | true |
| 资料库 横向溢出 | false |
| 资料库 无项目时表单隐藏 | true |
| 资料库 无项目时工具区隐藏 | true |
| 资料库 空状态可见 | true |
| 资料库 空状态标题 | "未打开项目" |

### 1366x768

| Check | Result |
|-------|--------|
| 书库 横向溢出 | false |
| 书库 左侧工作台可见 | true |
| 书库 刷新书库可见 | true |
| 书库 打开项目目录可见 | true |
| 书库 保存路径省略样式 | true |
| 资料库 横向溢出 | false |
| 资料库 无项目时表单隐藏 | true |
| 资料库 无项目时工具区隐藏 | true |
| 资料库 空状态可见 | true |
| 资料库 空状态标题 | "未打开项目" |

### 1536x864

| Check | Result |
|-------|--------|
| 书库 横向溢出 | false |
| 书库 左侧工作台可见 | true |
| 书库 刷新书库可见 | true |
| 书库 打开项目目录可见 | true |
| 书库 保存路径省略样式 | true |
| 资料库 横向溢出 | false |
| 资料库 无项目时表单隐藏 | true |
| 资料库 无项目时工具区隐藏 | true |
| 资料库 空状态可见 | true |
| 资料库 空状态标题 | "未打开项目" |

## Files Modified

| File | Changes |
|------|---------|
| `src/styles/desktop.css` | Added `max-height` + `overflow-y: auto` to `.desktop-placeholder-copy`; added `@media (max-height: 860px)` compact layout; added text-overflow ellipsis to `.desktop-library-meta`; added `[hidden]` rule for `.desktop-compendium-tools` |
| `src/desktop/desktop-shell.js` | Updated `setProjectLibraryMeta()` to set `title` attribute; added tools visibility toggle in `renderCompendium()` based on project state |
| `tests/phase37b_visual_check.js` | New Playwright visual check script |

## No Changes Made To

- Business logic, data structures, import/export
- Material save/persist logic
- Context injection rules
- Writer page core generation logic
- Any button entries removed (刷新书库 and 打开项目目录 preserved)
- Project or compendium APIs

## Success Criteria Verification

- [x] 小屏书库首屏不再出现维护按钮被裁切的尴尬状态
- [x] 保存路径视觉更克制 (ellipsis + tooltip title)
- [x] 资料库无项目状态更像明确空状态，而不是半禁用工作台
- [x] 自动测试通过 (`desktop-mainline-test`, `writer-audit`)
- [x] Playwright visual checks at 1280x720, 1366x768, 1536x864 — all pass
