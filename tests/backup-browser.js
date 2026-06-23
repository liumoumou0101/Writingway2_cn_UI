const assert = require('assert');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const { startDesktopServers } = require('../desktop/local-server');

const APP_URL = 'http://127.0.0.1:8000/main.html';

(async () => {
    const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'writingway-backup-browser-'));
    let servers = null;
    let browser = null;

    try {
        servers = await startDesktopServers({
            appRoot: path.resolve(__dirname, '..'),
            dataRoot,
            chooseBackupFolder: null,
            chooseProjectSaveFolder: null,
            openPath: null
        });

        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        const pageErrors = [];
        page.on('pageerror', error => pageErrors.push(error.message || String(error)));
        page.on('console', message => {
            if (message.type() === 'error') pageErrors.push(message.text());
        });

        await page.goto(APP_URL, { waitUntil: 'load', timeout: 30000 });
        await page.waitForFunction(() => window.BackupManager && window.db && window.FileSystemSave, null, { timeout: 30000 });

        const result = await page.evaluate(async () => {
            await db.delete();
            await db.open();

            const projectId = `browser-backup-${Date.now()}`;
            const chapterId = `${projectId}-chapter`;
            const sceneId = `${projectId}-scene`;
            const created = new Date().toISOString();

            const project = { id: projectId, name: 'Browser Backup Test', created, modified: created };
            const chapter = { id: chapterId, projectId, title: 'Chapter 1', order: 0, created, modified: created };
            const scene = { id: sceneId, projectId, chapterId, title: 'Scene 1', order: 0, created, modified: created };

            await db.projects.put(project);
            await db.chapters.put(chapter);
            await db.scenes.put(scene);
            await db.content.put({ sceneId, text: 'original text', wordCount: 2, updatedAt: Date.now() });

            const app = {
                currentProject: project,
                currentChapter: chapter,
                chapters: [{ ...chapter, scenes: [scene] }],
                scenes: [scene],
                backupProvider: 'local',
                backupRetentionMode: 'count',
                backupRetentionCount: 10,
                backupRetentionDays: 30,
                backupLocation: '',
                backupCount: 0,
                async loadProjects() {
                    this.projects = await db.projects.toArray();
                },
                async selectProject(nextProjectId) {
                    this.currentProject = await db.projects.get(nextProjectId);
                }
            };

            const backup = await window.BackupManager.backupNow(app, { reason: 'manual', note: 'before edit' });
            if (!backup.success) throw new Error(backup.error || 'backup failed');
            const noteUpdate = await window.BackupManager.updateLocalBackup(app, backup.backupId, { note: 'edited in browser test' });
            if (!noteUpdate.success) throw new Error(noteUpdate.error || 'backup note update failed');

            await db.content.put({ sceneId, text: 'changed text', wordCount: 2, updatedAt: Date.now() });
            const backupData = await window.BackupManager.getLocalBackupData(projectId, backup.backupId);
            if (!backupData.success) throw new Error(backupData.error || 'get backup failed');
            const importFile = new File(
                [JSON.stringify(backupData.backup, null, 2)],
                'import-test.writingway-backup.json',
                { type: 'application/json' }
            );
            const imported = await window.BackupManager.restoreBackupFileAsNewProject(app, importFile);
            if (!imported.success) throw new Error(imported.error || 'backup import failed');
            const importedProject = await db.projects.get(imported.projectId);
            app.currentProject = project;
            app.currentChapter = chapter;
            app.chapters = [{ ...chapter, scenes: [scene] }];
            app.scenes = [scene];

            const restore = await window.BackupManager.restoreSceneFromBackupDiff(app, {
                status: 'modified',
                sceneId,
                title: 'Scene 1',
                backupScene: backupData.backup.scenes[0],
                currentScene: scene,
                currentText: 'changed text',
                backupText: backupData.backup.sceneContents[sceneId]
            });
            if (!restore.success) throw new Error(restore.error || 'scene restore failed');

            const restoredContent = await db.content.get(sceneId);

            const missingBackupSceneId = `${projectId}-missing-scene`;
            const added = await window.BackupManager.restoreSceneFromBackupDiff(app, {
                status: 'added',
                sceneId: missingBackupSceneId,
                title: 'Recovered Scene',
                backupScene: {
                    id: missingBackupSceneId,
                    projectId,
                    chapterId,
                    title: 'Recovered Scene',
                    order: 1,
                    created,
                    modified: created
                },
                currentScene: null,
                currentText: '',
                backupText: 'text from deleted scene'
            });
            if (!added.success) throw new Error(added.error || 'added scene restore failed');

            const newScene = await db.scenes.get(added.sceneId);
            const newContent = await db.content.get(added.sceneId);
            const backups = await window.BackupManager.listLocalBackups(app);
            const alpineApp = document.querySelector('[x-data="app"]')?._x_dataStack?.[0] || window.__test?.getApp?.();
            let confirmText = '';
            let sceneConfirmText = '';
            if (alpineApp) {
                alpineApp.currentProject = project;
                alpineApp.chapters = [chapter];
                alpineApp.scenes = [scene];
                alpineApp.backupList = backups.success ? backups.backups : [];
                confirmText = alpineApp.restoreBackupConfirmMessage(noteUpdate.backup, {
                    stats: alpineApp.backupPreview(noteUpdate.backup),
                    sceneDiff: { added: [], removed: [], modified: [], unchanged: 1 }
                });
                sceneConfirmText = alpineApp.restoreSceneConfirmMessage({
                    status: 'modified',
                    title: 'Scene 1',
                    currentText: 'changed text',
                    backupText: 'original text'
                });
            }
            const storageSummary = alpineApp ? alpineApp.backupStorageSummary() : {};
            const timelineGroups = alpineApp ? alpineApp.backupTimelineGroups().map(group => ({ key: group.key, count: group.backups.length })) : [];

            return {
                restoredText: restoredContent && restoredContent.text,
                addedSceneTitle: newScene && newScene.title,
                addedSceneText: newContent && newContent.text,
                editedNote: noteUpdate.backup && noteUpdate.backup.note,
                importedProjectName: importedProject && importedProject.name,
                hasExportMethod: !!window.BackupManager.exportLocalBackup,
                storageCount: storageSummary.count || 0,
                storageSize: storageSummary.totalSize || 0,
                timelineGroupKeys: timelineGroups.map(group => group.key),
                confirmText,
                sceneConfirmText,
                backupCount: backups.success ? backups.backups.length : 0,
                beforeRestoreCount: backups.success ? backups.backups.filter(item => item.reason === 'before-restore').length : 0
            };
        });

        assert.strictEqual(result.restoredText, 'original text', 'modified scene should restore backup text');
        assert.strictEqual(result.addedSceneTitle, 'Recovered Scene (Recovered)', 'missing backup scene should be restored as a new scene');
        assert.strictEqual(result.addedSceneText, 'text from deleted scene', 'new restored scene should keep backup text');
        assert.strictEqual(result.editedNote, 'edited in browser test', 'backup note should be editable through BackupManager');
        assert.strictEqual(result.importedProjectName, 'Browser Backup Test (Recovered)', 'backup JSON should import as a recovered project');
        assert.strictEqual(result.hasExportMethod, true, 'BackupManager should expose JSON export');
        assert.ok(result.storageCount >= 3, 'backup storage summary should count local backups');
        assert.ok(result.storageSize > 0, 'backup storage summary should include total file size');
        assert.ok(result.timelineGroupKeys.length > 0, 'backup timeline should return visible groups');
        assert.match(result.confirmText, /pre-restore snapshot|恢复前快照/, 'project restore confirmation should mention pre-restore snapshot');
        assert.match(result.confirmText, /replace|替换/, 'project restore confirmation should mention replacement');
        assert.match(result.sceneConfirmText, /Only this scene|只会修改这个场景/, 'scene restore confirmation should describe scene-level impact');
        assert.ok(result.backupCount >= 3, 'manual backup plus pre-restore snapshots should be listed');
        assert.ok(result.beforeRestoreCount >= 2, 'scene restores should create pre-restore snapshots');

        const relevantErrors = pageErrors.filter(error => !/403/.test(error));
        assert.deepStrictEqual(relevantErrors, [], `unexpected browser errors: ${relevantErrors.join('\n')}`);

        console.log('Backup browser integration test passed.');
    } finally {
        if (browser) await browser.close();
        if (servers) servers.close();
        await fs.rm(dataRoot, { recursive: true, force: true });
    }
})().catch(error => {
    console.error('Backup browser integration test failed:', error && error.stack ? error.stack : error);
    process.exit(1);
});
