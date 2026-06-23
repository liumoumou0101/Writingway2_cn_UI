const assert = require('assert');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { startDesktopServers } = require('../desktop/local-server');

const APP_URL = 'http://127.0.0.1:8000';

function snapshot(projectId, name, sceneText, exportedAt) {
    const chapterId = `${projectId}-chapter-1`;
    const sceneId = `${projectId}-scene-1`;
    return {
        version: '2.1-backup-test',
        exportedAt,
        project: {
            id: projectId,
            name,
            created: exportedAt,
            modified: exportedAt
        },
        chapters: [{
            id: chapterId,
            projectId,
            title: 'Chapter 1',
            order: 0,
            created: exportedAt,
            modified: exportedAt
        }],
        scenes: [{
            id: sceneId,
            projectId,
            chapterId,
            title: 'Scene 1',
            order: 0,
            created: exportedAt,
            modified: exportedAt
        }],
        sceneContents: {
            [sceneId]: sceneText
        },
        compendium: [],
        prompts: [],
        codex: [],
        promptHistory: [],
        workshopSessions: []
    };
}

async function api(pathname, options = {}) {
    const response = await fetch(`${APP_URL}${pathname}`, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        ...options
    });
    const body = await response.json().catch(() => ({}));
    assert.ok(response.ok && body.ok, `${pathname} failed: ${response.status} ${JSON.stringify(body)}`);
    return body;
}

async function createBackup(payload, requestOptions) {
    return api('/api/create-backup', {
        method: 'POST',
        body: JSON.stringify({
            ...payload,
            backupRequest: requestOptions
        })
    });
}

(async () => {
    const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'writingway-backup-api-'));
    let servers = null;

    try {
        servers = await startDesktopServers({
            appRoot: path.resolve(__dirname, '..'),
            dataRoot,
            chooseBackupFolder: null,
            chooseProjectSaveFolder: null,
            openPath: null
        });

        const projectId = `backup-test-${Date.now()}`;
        const baseTime = Date.parse('2026-06-23T00:00:00.000Z');

        const first = await createBackup(
            snapshot(projectId, 'Backup API Test', 'first stable draft', new Date(baseTime).toISOString()),
            { reason: 'manual', note: 'stable draft', retention: { mode: 'count', count: 10 } }
        );
        assert.ok(first.backupId, 'first backup should return an id');

        let list = await api(`/api/list-backups?projectId=${encodeURIComponent(projectId)}`);
        assert.strictEqual(list.backups.length, 1, 'one backup should be listed after first create');
        assert.strictEqual(list.backups[0].pinned, false, 'new backups should not be pinned by default');
        assert.strictEqual(list.backups[0].note, 'stable draft', 'backup note should be preserved');

        const pinned = await api('/api/update-backup', {
            method: 'POST',
            body: JSON.stringify({ projectId, backupId: first.backupId, pinned: true })
        });
        assert.strictEqual(pinned.backup.pinned, true, 'update-backup should pin a backup');

        for (let i = 1; i <= 3; i++) {
            await createBackup(
                snapshot(projectId, 'Backup API Test', `revision ${i}`, new Date(baseTime + i * 1000).toISOString()),
                { reason: 'manual', note: `revision ${i}`, retention: { mode: 'count', count: 1 } }
            );
        }

        list = await api(`/api/list-backups?projectId=${encodeURIComponent(projectId)}`);
        const ids = list.backups.map(backup => backup.id);
        assert.ok(ids.includes(first.backupId), 'pinned backup should survive retention pruning');
        assert.strictEqual(list.backups.filter(backup => !backup.pinned).length, 1, 'retention count should apply to unpinned backups');
        assert.strictEqual(list.backups.length, 2, 'list should include pinned backups plus retained unpinned backups');

        const pinnedData = await api(`/api/get-backup?projectId=${encodeURIComponent(projectId)}&backupId=${encodeURIComponent(first.backupId)}`);
        assert.strictEqual(pinnedData.backup.backupMeta.pinned, true, 'pinned flag should be stored in backup metadata');
        assert.deepStrictEqual(Object.values(pinnedData.backup.sceneContents), ['first stable draft'], 'pinned backup contents should remain readable');

        const unpinned = await api('/api/update-backup', {
            method: 'POST',
            body: JSON.stringify({ projectId, backupId: first.backupId, pinned: false })
        });
        assert.strictEqual(unpinned.backup.pinned, false, 'update-backup should unpin a backup');

        await api('/api/cleanup-backups', {
            method: 'POST',
            body: JSON.stringify({ scope: 'project', projectId })
        });
        list = await api(`/api/list-backups?projectId=${encodeURIComponent(projectId)}`);
        assert.strictEqual(list.backups.length, 0, 'explicit project cleanup should delete all backups');

        console.log('Backup API test passed.');
    } finally {
        if (servers) servers.close();
        await fs.rm(dataRoot, { recursive: true, force: true });
    }
})().catch(error => {
    console.error('Backup API test failed:', error && error.stack ? error.stack : error);
    process.exit(1);
});
