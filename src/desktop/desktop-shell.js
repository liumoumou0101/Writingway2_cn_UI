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

    function formatNumber(value) {
        return new Intl.NumberFormat('zh-CN').format(Number(value) || 0);
    }

    function formatDate(value) {
        if (!value) return '未知时间';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '未知时间';
        return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    function firstBookGlyph(name) {
        const text = String(name || '书').trim();
        return Array.from(text)[0] || '书';
    }

    function setProjectLibraryStatus(message, tone) {
        const status = document.querySelector('[data-project-library-status]');
        if (!status) return;
        status.textContent = message || '';
        status.dataset.tone = tone || 'info';
        status.hidden = !message;
    }

    function setProjectLibraryMeta(message) {
        const meta = document.querySelector('[data-project-library-meta]');
        if (meta) meta.textContent = message || '';
    }

    function createProjectCard(project) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'desktop-project-card';
        card.dataset.projectId = project.id || '';
        card.title = project.name || '未命名项目';

        const cover = document.createElement('div');
        cover.className = 'desktop-project-cover';
        if (project.coverImage) {
            const image = document.createElement('img');
            image.src = project.coverImage;
            image.alt = '';
            cover.appendChild(image);
        } else {
            cover.textContent = firstBookGlyph(project.name);
        }

        const body = document.createElement('div');
        body.className = 'desktop-project-card-body';

        const name = document.createElement('strong');
        name.textContent = project.name || '未命名项目';

        const stats = document.createElement('span');
        stats.textContent = `${formatNumber(project.wordCount)} 字 / ${formatNumber(project.chapterCount)} 章 / ${formatNumber(project.sceneCount)} 场`;

        const time = document.createElement('span');
        time.textContent = `最近保存 ${formatDate(project.timestamp)}`;

        const path = document.createElement('small');
        path.textContent = project.health === 'invalid' ? `文件异常：${project.healthMessage || '无法读取'}` : (project.filename || project.path || '');
        if (project.health === 'invalid') path.dataset.tone = 'error';

        body.append(name, stats, time, path);
        card.append(cover, body);
        card.addEventListener('click', () => setView('writer'));

        return card;
    }

    function renderProjectLibrary(projects, projectSaveLocation) {
        const grid = document.querySelector('[data-project-grid]');
        if (!grid) return;

        grid.replaceChildren();

        if (!projects || projects.length === 0) {
            setProjectLibraryStatus('还没有保存到磁盘的项目。进入写作器后点击保存，书库就会显示作品卡片。', 'empty');
            setProjectLibraryMeta(projectSaveLocation ? `项目目录：${projectSaveLocation}` : '项目目录尚未建立');
            return;
        }

        setProjectLibraryStatus('', 'ok');
        setProjectLibraryMeta(`${projects.length} 本书 / 项目目录：${projectSaveLocation || '默认目录'}`);
        projects.forEach((project) => {
            grid.appendChild(createProjectCard(project));
        });
    }

    async function loadProjectLibrary() {
        setProjectLibraryStatus('正在读取项目...', 'info');
        try {
            const response = await fetch('/api/list-projects', { cache: 'no-store' });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }
            renderProjectLibrary(result.projects || [], result.projectSaveLocation || '');
        } catch (error) {
            console.warn('Failed to load desktop project library:', error);
            renderProjectLibrary([], '');
            setProjectLibraryStatus(`读取书库失败：${error.message || error}`, 'error');
            setProjectLibraryMeta('请确认桌面本地服务正在运行。');
        }
    }

    function bindNavigation() {
        document.querySelectorAll('[data-view-target]').forEach((button) => {
            button.addEventListener('click', () => {
                setView(button.dataset.viewTarget);
            });
        });
    }

    function bindProjectLibrary() {
        document.querySelectorAll('[data-refresh-projects]').forEach((button) => {
            button.addEventListener('click', () => {
                loadProjectLibrary();
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
        bindProjectLibrary();
        bindLegacyActions();
        const state = getState();
        setView(state ? state.loadInitialView() : 'bookshelf');
        loadProjectLibrary();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.WritingwayDesktopShell = {
        loadProjectLibrary,
        runLegacyAction,
        setView
    };
})();
