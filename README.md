<p align="center">
  <img src="logo.png" width="420" alt="Writingway logo"/>
</p>

# Writingway Desktop

Writingway Desktop is a desktop-first, local-first AI fiction writing workbench. It helps manage novels, chapters, scenes, worldbuilding notes, AI drafting, rewriting, backups, and future local reading workflows in one app.

This fork has diverged substantially from the original browser-focused Writingway 2 project. The maintained product target is now the Electron desktop app.

## Product Direction

Writingway Desktop is intended to become a local writing application rather than a browser app wrapped in Electron. The current editor still reuses the legacy web UI internally, but new product work should target the desktop entry point and desktop UX.

Planned direction:

- Desktop bookshelf as the first screen
- Book/project covers, status, metadata, and richer project management
- Desktop-style navigation and settings
- Local reading/import workflows
- API and local-model assisted writing
- Local backups and recovery as first-class features

## Supported Runtime

### Official target

- Electron desktop app

### Legacy / development only

- Direct browser use through `main.html` or launcher scripts
- `file://` loading
- Browser-first project selection UI

These legacy paths may still work during the transition, but they are no longer the product direction and should not constrain new desktop UI work.

## Quick Start

Install dependencies:

```bash
npm install
```

Run the desktop app:

```bash
npm run desktop
```

Create an unpacked desktop build:

```bash
npm run pack
```

Create Windows distributables in `release/`:

```bash
npm run dist
```

If Electron Builder downloads are unstable on your network, run this first in PowerShell:

```powershell
$env:ELECTRON_BUILDER_BINARIES_MIRROR='https://npmmirror.com/mirrors/electron-builder-binaries/'
```

## Architecture Notes

Electron now loads `desktop.html` as the desktop-owned entry point.

`desktop.html` currently hosts the legacy app in `main.html` as a transition step. Future desktop shell, bookshelf, reader, and native-app navigation work should be built from `desktop.html` and desktop-specific modules instead of adding more browser-era entry logic to `main.html`.

Important paths:

```text
desktop/          Electron main process, preload, and local Node services
desktop.html      Desktop-owned app entry point
main.html         Legacy web app entry, still used by the current editor
src/              Shared app modules during the transition
tools/            Legacy Python services and local tooling
tests/            Unit, UI, backup, and desktop-adjacent checks
```

## AI Modes

Writingway supports:

- OpenRouter
- Anthropic
- OpenAI
- Google AI
- NanoGPT
- LM Studio
- Custom OpenAI-compatible APIs
- Local GGUF mode through llama.cpp when available

The desktop app starts its own local app server and updater service. Local GGUF model startup is still partly inherited from the older launcher flow and should be consolidated into the desktop runtime later.

## Saving and Backups

Writingway includes:

- Manual project save to local disk
- Local versioned backups
- Local backup recovery center
- Backup health checks
- Pinned backups and notes
- JSON backup import/export
- Scene-level backup compare and restore
- GitHub Gist backup

OneDrive and Google Drive are still placeholders and are not implemented.

## Tests

Run focused unit checks:

```bash
npm run unit
```

Run backup integration checks:

```bash
npm run backup-test
```

Run the older browser-oriented UI checks:

```bash
npm run ui
```

Run the historical full test command:

```bash
npm test
```

Note: some older tests still target `main.html` directly because the editor is currently hosted there. As desktop work progresses, tests should move toward the Electron/local desktop entry.

## Current Status

Working today:

- Project, chapter, and scene writing
- Compendium/worldbuilding notes
- AI generation, rewriting, and rewrite presets
- Context resolution from compendium tags and mentions
- Workshop chat
- AI provider configuration
- LM Studio and API provider integration
- Local GGUF flow where configured
- Manual local saves
- Local versioned backups and recovery
- GitHub Gist backup
- Desktop packaging

In transition:

- Desktop-first app shell
- Commercial-grade bookshelf/home screen
- Book metadata and covers
- Local reader/import workflows
- Replacing browser-style dialogs and alerts with desktop UI
- Reducing dependency on legacy web launch paths
