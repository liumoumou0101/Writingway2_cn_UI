# Desktop Mainline Plan

Writingway is now maintained as a desktop-first project. The legacy browser app remains available only as a transition layer and development aid.

## Decision

- Electron desktop is the official product target.
- `main` is the desktop mainline branch.
- `desktop.html` is the desktop-owned entry point.
- `main.html` is the legacy web/editor entry and should not receive new top-level product shell work.
- Upstream Writingway 2 is now a reference source, not a merge target.

## Why This Split Exists

The project now depends on desktop-oriented workflows:

- Local app and updater services
- Local project save paths
- Local backup recovery
- Future local bookshelf and reader workflows
- Future native-feeling menus, dialogs, and file import

Keeping browser usage as a first-class product target would make every new desktop feature carry extra compatibility logic and keep the UI feeling like a web page.

## Current Transitional Shape

Electron loads:

```text
desktop.html
```

`desktop.html` currently hosts:

```text
main.html?runtime=desktop
```

This is intentional and temporary. It creates a desktop-owned entry without duplicating the large legacy app file. The next desktop UI work should replace this shell incrementally.

## Development Rules

New desktop product work should:

- Start from `desktop.html` and desktop-specific modules.
- Prefer desktop UX patterns over browser/landing-page patterns.
- Treat local filesystem and app services as first-class capabilities.
- Avoid adding new browser-launch instructions or direct `file://` user flows.
- Keep shared business logic in reusable modules when practical.
- Add tests for desktop entry behavior as the new shell grows.

Legacy web/editor work may still happen when:

- Fixing bugs in existing editor behavior.
- Updating shared AI, prompt, backup, or compendium logic.
- Keeping transitional tests passing.

Do not add new product navigation, bookshelf, reader, or desktop app shell features to `main.html` unless it is a short-lived bridge.

## Near-Term Roadmap

1. Desktop identity cleanup
   - Desktop entry in Electron.
   - README and docs updated.
   - Web mode marked legacy/development only.

2. Desktop app shell
   - Left navigation rail.
   - Desktop-style home/book area.
   - Settings and recovery entry points.

3. Bookshelf
   - Card/grid view.
   - Covers.
   - Search and sorting.
   - Project metadata.

4. Project metadata
   - Description.
   - Status.
   - Tags/genre.
   - Target word count.
   - Cover editing.

5. Local reader MVP
   - Import local `.txt` / `.md`.
   - Chapter detection.
   - Reading progress.
   - Reader typography controls.

6. Web legacy cleanup
   - Remove browser-first user messaging.
   - Replace direct browser tests where appropriate.
   - Move desktop features out of legacy entry points.

## Testing Priorities

Before merging desktop mainline work:

```bash
npm run unit
npm run backup-test
npm run pack
```

As the desktop shell grows, add dedicated desktop-entry tests rather than expanding legacy `main.html` checks.
