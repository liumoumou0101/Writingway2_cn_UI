(function () {
    const viewTitles = {
        bookshelf: '书库',
        writer: '写作',
        reader: '阅读',
        recovery: '恢复中心',
        settings: '设置'
    };

    function getState() {
        return window.WritingwayDesktopState;
    }

    function setView(view) {
        const state = getState();
        const nextView = state ? state.normalizeView(view) : 'bookshelf';
        const root = document.getElementById('desktop-root');
        if (!root) return;

        root.dataset.view = nextView;

        document.querySelectorAll('[data-view-target]').forEach((button) => {
            button.classList.toggle('is-active', button.dataset.viewTarget === nextView);
        });

        document.querySelectorAll('[data-view-panel]').forEach((panel) => {
            panel.classList.toggle('is-active', panel.dataset.viewPanel === nextView);
        });

        const title = document.getElementById('desktop-view-title');
        if (title) title.textContent = viewTitles[nextView] || 'Writingway';

        if (state) state.saveView(nextView);
    }

    function bindNavigation() {
        document.querySelectorAll('[data-view-target]').forEach((button) => {
            button.addEventListener('click', () => {
                setView(button.dataset.viewTarget);
            });
        });
    }

    function getWriterFrame() {
        return document.getElementById('legacy-writer-frame');
    }

    function getLegacyAppData() {
        const frame = getWriterFrame();
        const writerWindow = frame ? frame.contentWindow : null;
        const writerDocument = frame && frame.contentDocument;

        if (!writerWindow || !writerDocument || !writerWindow.Alpine) return null;

        const appRoot = writerDocument.querySelector('[x-data="app"]');
        if (!appRoot) return null;

        try {
            return writerWindow.Alpine.$data(appRoot);
        } catch (error) {
            return null;
        }
    }

    function waitForLegacyAppData() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 80;

            const check = () => {
                const app = getLegacyAppData();
                if (app) {
                    resolve(app);
                    return;
                }

                attempts += 1;
                if (attempts >= maxAttempts) {
                    reject(new Error('Legacy writer app is not ready.'));
                    return;
                }

                window.setTimeout(check, 100);
            };

            check();
        });
    }

    async function runLegacyAction(action) {
        setView('writer');

        const app = await waitForLegacyAppData();
        if (action === 'ai-settings') {
            app.showAISettings = true;
            return;
        }

        if (action === 'backup-settings') {
            if (typeof app.openBackupSettings === 'function') {
                await app.openBackupSettings();
            } else {
                app.showBackupSettings = true;
            }
            return;
        }

        if (action === 'local-recovery') {
            if (typeof app.openLocalBackupRecovery === 'function') {
                await app.openLocalBackupRecovery();
            } else {
                app.showLocalBackupRecoveryModal = true;
            }
        }
    }

    function bindLegacyActions() {
        document.querySelectorAll('[data-legacy-action]').forEach((button) => {
            button.addEventListener('click', async () => {
                button.disabled = true;
                try {
                    await runLegacyAction(button.dataset.legacyAction);
                } catch (error) {
                    console.error('Failed to run legacy desktop action:', error);
                    setView('writer');
                } finally {
                    button.disabled = false;
                }
            });
        });
    }

    function init() {
        bindNavigation();
        bindLegacyActions();
        const state = getState();
        setView(state ? state.loadInitialView() : 'bookshelf');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.WritingwayDesktopShell = {
        runLegacyAction,
        setView
    };
})();
