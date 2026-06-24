(function () {
    const viewTitles = {
        bookshelf: '书库',
        writer: '写作',
        reader: '阅读',
        recovery: '恢复中心',
        settings: '设置'
    };
    const projectLibraryState = {
        projects: [],
        projectSaveLocation: '',
        query: '',
        sort: 'recent',
        editingProject: null,
        editingCoverImage: ''
    };
    const READER_STORAGE_KEY = 'writingway:desktop:reader';
    const readerState = {
        document: null,
        chapterIndex: 0,
        fontSize: 18,
        lineHeight: 1.8,
        theme: 'dark'
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
        const card = document.createElement('article');
        card.className = 'desktop-project-card';
        card.dataset.projectId = project.id || '';
        card.dataset.projectFilename = project.filename || '';
        card.title = project.name || '未命名项目';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');

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

        const badges = document.createElement('div');
        badges.className = 'desktop-project-badges';
        if (project.status) {
            const status = document.createElement('span');
            status.className = 'desktop-project-badge';
            status.textContent = project.status;
            badges.appendChild(status);
        }
        (project.tags || []).slice(0, 3).forEach((tag) => {
            const tagBadge = document.createElement('span');
            tagBadge.className = 'desktop-project-badge';
            tagBadge.textContent = tag;
            badges.appendChild(tagBadge);
        });

        const description = document.createElement('p');
        description.className = 'desktop-project-description';
        description.textContent = project.description || '还没有简介。';

        const stats = document.createElement('span');
        stats.textContent = `${formatNumber(project.wordCount)} 字 / ${formatNumber(project.chapterCount)} 章 / ${formatNumber(project.sceneCount)} 场`;

        const time = document.createElement('span');
        time.textContent = `最近保存 ${formatDate(project.timestamp)}`;

        const path = document.createElement('small');
        path.textContent = project.health === 'invalid' ? `文件异常：${project.healthMessage || '无法读取'}` : (project.filename || project.path || '');
        if (project.health === 'invalid') path.dataset.tone = 'error';

        const actions = document.createElement('div');
        actions.className = 'desktop-project-actions';
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'desktop-mini-action';
        editButton.textContent = '编辑信息';
        editButton.addEventListener('click', (event) => {
            event.stopPropagation();
            openProjectEditor(project);
        });

        const revealButton = document.createElement('button');
        revealButton.type = 'button';
        revealButton.className = 'desktop-mini-action';
        revealButton.textContent = '定位文件';
        revealButton.addEventListener('click', async (event) => {
            event.stopPropagation();
            await revealProjectFile(project);
        });

        const copyPathButton = document.createElement('button');
        copyPathButton.type = 'button';
        copyPathButton.className = 'desktop-mini-action';
        copyPathButton.textContent = '复制路径';
        copyPathButton.addEventListener('click', async (event) => {
            event.stopPropagation();
            await copyProjectPath(project);
        });

        const backupButton = document.createElement('button');
        backupButton.type = 'button';
        backupButton.className = 'desktop-mini-action';
        backupButton.textContent = '备份';
        backupButton.addEventListener('click', async (event) => {
            event.stopPropagation();
            await openProjectBackupSettings(project);
        });

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'desktop-mini-action desktop-mini-action-danger';
        removeButton.textContent = '移出书库';
        removeButton.addEventListener('click', async (event) => {
            event.stopPropagation();
            await removeProjectFromLibrary(project);
        });

        actions.append(editButton, revealButton, copyPathButton, backupButton, removeButton);

        body.append(name, badges, description, stats, time, path, actions);
        card.append(cover, body);

        const openProject = async () => {
            card.setAttribute('aria-disabled', 'true');
            try {
                await openDesktopProject(project);
            } catch (error) {
                console.error('Failed to open desktop project:', error);
                setProjectLibraryStatus(`打开失败：${error.message || error}`, 'error');
            } finally {
                card.removeAttribute('aria-disabled');
            }
        };

        card.addEventListener('click', openProject);
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openProject();
            }
        });

        return card;
    }

    function getFilteredProjects() {
        const query = projectLibraryState.query.trim().toLowerCase();
        const projects = projectLibraryState.projects.filter((project) => {
            if (!query) return true;
            return [
                project.name,
                project.filename,
                project.path,
                project.description,
                project.status,
                ...(project.tags || [])
            ].some((value) => String(value || '').toLowerCase().includes(query));
        });

        const sorted = [...projects];
        sorted.sort((a, b) => {
            if (projectLibraryState.sort === 'name') {
                return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
            }
            if (projectLibraryState.sort === 'words') {
                return (Number(b.wordCount) || 0) - (Number(a.wordCount) || 0);
            }
            if (projectLibraryState.sort === 'chapters') {
                return (Number(b.chapterCount) || 0) - (Number(a.chapterCount) || 0);
            }

            return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
        });

        return sorted;
    }

    function renderProjectLibrary() {
        const grid = document.querySelector('[data-project-grid]');
        if (!grid) return;

        grid.replaceChildren();
        const projects = getFilteredProjects();
        const total = projectLibraryState.projects.length;
        const projectSaveLocation = projectLibraryState.projectSaveLocation;

        if (total === 0) {
            setProjectLibraryStatus('还没有保存到磁盘的项目。进入写作器后点击保存，书库就会显示作品卡片。', 'empty');
            setProjectLibraryMeta(projectSaveLocation ? `项目目录：${projectSaveLocation}` : '项目目录尚未建立');
            return;
        }

        if (projects.length === 0) {
            setProjectLibraryStatus('没有找到匹配的作品。换个关键词试试，或者清空搜索框。', 'empty');
            setProjectLibraryMeta(`${total} 本书 / 项目目录：${projectSaveLocation || '默认目录'}`);
            return;
        }

        setProjectLibraryStatus('', 'ok');
        const shownText = projects.length === total ? `${total} 本书` : `显示 ${projects.length} / ${total} 本书`;
        setProjectLibraryMeta(`${shownText} / 项目目录：${projectSaveLocation || '默认目录'}`);
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
            projectLibraryState.projects = result.projects || [];
            projectLibraryState.projectSaveLocation = result.projectSaveLocation || '';
            renderProjectLibrary();
        } catch (error) {
            console.warn('Failed to load desktop project library:', error);
            projectLibraryState.projects = [];
            projectLibraryState.projectSaveLocation = '';
            renderProjectLibrary();
            setProjectLibraryStatus(`读取书库失败：${error.message || error}`, 'error');
            setProjectLibraryMeta('请确认桌面本地服务正在运行。');
        }
    }

    async function openProjectFolder() {
        setProjectLibraryStatus('正在打开项目目录...', 'info');
        try {
            const response = await fetch('/api/open-project-save-folder', { method: 'POST' });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }
            setProjectLibraryStatus('', 'ok');
        } catch (error) {
            console.warn('Failed to open project folder:', error);
            setProjectLibraryStatus(`打开项目目录失败：${error.message || error}`, 'error');
        }
    }

    function parseTags(value) {
        return String(value || '').split(',').map((tag) => tag.trim()).filter(Boolean);
    }

    async function revealProjectFile(project) {
        setProjectLibraryStatus('正在定位项目文件...', 'info');
        try {
            const response = await fetch('/api/reveal-project-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: project.id,
                    filename: project.filename
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }
            setProjectLibraryStatus('已在文件管理器中定位项目文件。', 'ok');
        } catch (error) {
            console.warn('Failed to reveal project file:', error);
            setProjectLibraryStatus(`定位项目文件失败：${error.message || error}`, 'error');
        }
    }

    async function copyProjectPath(project) {
        const path = project.absolutePath || project.path || project.filename || '';
        if (!path) {
            setProjectLibraryStatus('没有可复制的项目路径。', 'error');
            return;
        }

        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(path);
            } else {
                const input = document.createElement('textarea');
                input.value = path;
                input.style.position = 'fixed';
                input.style.opacity = '0';
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                input.remove();
            }
            setProjectLibraryStatus('项目路径已复制。', 'ok');
        } catch (error) {
            console.warn('Failed to copy project path:', error);
            setProjectLibraryStatus(`复制路径失败：${error.message || error}`, 'error');
        }
    }

    async function openProjectBackupSettings(project) {
        try {
            await openDesktopProject(project);
            await runLegacyAction('backup-settings');
        } catch (error) {
            console.warn('Failed to open project backup settings:', error);
            setProjectLibraryStatus(`打开备份设置失败：${error.message || error}`, 'error');
        }
    }

    async function removeProjectFromLibrary(project) {
        const confirmed = window.confirm(`确定要把《${project.name || '未命名项目'}》移出书库吗？\n\n项目文件不会被删除，只会移动到项目目录下的 .removed-projects 文件夹。`);
        if (!confirmed) return;

        setProjectLibraryStatus('正在移出书库...', 'info');
        try {
            const response = await fetch('/api/remove-project-from-library', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId: project.id,
                    filename: project.filename
                })
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok || !result.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }
            await loadProjectLibrary();
            setProjectLibraryStatus('已移出书库，文件仍保留在 .removed-projects 文件夹。', 'ok');
        } catch (error) {
            console.warn('Failed to remove project from library:', error);
            setProjectLibraryStatus(`移出书库失败：${error.message || error}`, 'error');
        }
    }

    function projectEditorElements() {
        return {
            modal: document.querySelector('[data-project-edit-modal]'),
            form: document.querySelector('[data-project-edit-form]'),
            name: document.querySelector('[data-project-edit-name]'),
            status: document.querySelector('[data-project-edit-status]'),
            tags: document.querySelector('[data-project-edit-tags]'),
            description: document.querySelector('[data-project-edit-description]'),
            cover: document.querySelector('[data-project-edit-cover]'),
            coverPreview: document.querySelector('[data-project-edit-cover-preview]'),
            statusMessage: document.querySelector('[data-project-edit-status-message]')
        };
    }

    function renderCoverPreview(coverImage) {
        const { coverPreview } = projectEditorElements();
        if (!coverPreview) return;
        coverPreview.replaceChildren();

        if (!coverImage) {
            coverPreview.textContent = '未设置封面';
            coverPreview.dataset.empty = 'true';
            return;
        }

        delete coverPreview.dataset.empty;
        const image = document.createElement('img');
        image.src = coverImage;
        image.alt = '封面预览';
        coverPreview.appendChild(image);
    }

    function setProjectEditorStatus(message, tone) {
        const { statusMessage } = projectEditorElements();
        if (!statusMessage) return;
        statusMessage.textContent = message || '';
        statusMessage.dataset.tone = tone || 'info';
    }

    function openProjectEditor(project) {
        const elements = projectEditorElements();
        if (!elements.modal || !elements.form) return;

        projectLibraryState.editingProject = project;
        projectLibraryState.editingCoverImage = project.coverImage || '';

        elements.name.value = project.name || '';
        elements.status.value = project.status || '';
        elements.tags.value = (project.tags || []).join(', ');
        elements.description.value = project.description || '';
        if (elements.cover) elements.cover.value = '';
        setProjectEditorStatus('', 'info');
        renderCoverPreview(projectLibraryState.editingCoverImage);

        elements.modal.hidden = false;
        window.setTimeout(() => elements.name && elements.name.focus(), 0);
    }

    function closeProjectEditor() {
        const { modal } = projectEditorElements();
        if (modal) modal.hidden = true;
        projectLibraryState.editingProject = null;
        projectLibraryState.editingCoverImage = '';
    }

    function readCoverFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve('');
                return;
            }
            if (!file.type || !file.type.startsWith('image/')) {
                reject(new Error('请选择图片文件'));
                return;
            }
            if (file.size > 2500000) {
                reject(new Error('封面图片不能超过 2.5MB'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('读取封面失败'));
            reader.readAsDataURL(file);
        });
    }

    async function saveProjectEditor() {
        const project = projectLibraryState.editingProject;
        const elements = projectEditorElements();
        if (!project || !elements.form) return;

        const metadata = {
            name: elements.name.value,
            status: elements.status.value,
            tags: parseTags(elements.tags.value),
            description: elements.description.value,
            coverImage: projectLibraryState.editingCoverImage
        };

        setProjectEditorStatus('正在保存...', 'info');
        const response = await fetch('/api/update-project-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                projectId: project.id,
                filename: project.filename,
                metadata
            })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
            throw new Error(result.error || `HTTP ${response.status}`);
        }

        closeProjectEditor();
        await loadProjectLibrary();
        setProjectLibraryStatus('作品信息已保存。', 'ok');
    }

    function projectCreatorElements() {
        return {
            modal: document.querySelector('[data-project-create-modal]'),
            form: document.querySelector('[data-project-create-form]'),
            name: document.querySelector('[data-project-create-name]'),
            status: document.querySelector('[data-project-create-status]'),
            tags: document.querySelector('[data-project-create-tags]'),
            description: document.querySelector('[data-project-create-description]'),
            statusMessage: document.querySelector('[data-project-create-status-message]')
        };
    }

    function setProjectCreatorStatus(message, tone) {
        const { statusMessage } = projectCreatorElements();
        if (!statusMessage) return;
        statusMessage.textContent = message || '';
        statusMessage.dataset.tone = tone || 'info';
    }

    function openProjectCreator() {
        const elements = projectCreatorElements();
        if (!elements.modal || !elements.form) return;
        elements.form.reset();
        if (elements.status) elements.status.value = '构思中';
        setProjectCreatorStatus('', 'info');
        elements.modal.hidden = false;
        window.setTimeout(() => elements.name && elements.name.focus(), 0);
    }

    function closeProjectCreator() {
        const { modal } = projectCreatorElements();
        if (modal) modal.hidden = true;
    }

    async function createProjectFromDesktop() {
        const elements = projectCreatorElements();
        const metadata = {
            name: elements.name.value,
            status: elements.status.value,
            tags: parseTags(elements.tags.value),
            description: elements.description.value,
            coverImage: ''
        };

        setProjectCreatorStatus('正在创建...', 'info');
        const response = await fetch('/api/create-project', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ metadata })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
            throw new Error(result.error || `HTTP ${response.status}`);
        }

        closeProjectCreator();
        await loadProjectLibrary();
        await openDesktopProject(result.summary);
    }

    function readerElements() {
        return {
            file: document.querySelector('[data-reader-file]'),
            fontSize: document.querySelector('[data-reader-font-size]'),
            lineHeight: document.querySelector('[data-reader-line-height]'),
            theme: document.querySelector('[data-reader-theme]'),
            themePanel: document.querySelector('[data-reader-theme-panel]'),
            title: document.querySelector('[data-reader-title]'),
            source: document.querySelector('[data-reader-source]'),
            content: document.querySelector('[data-reader-content]'),
            chapters: document.querySelector('[data-reader-chapters]'),
            progress: document.querySelector('[data-reader-progress]'),
            progressLabel: document.querySelector('[data-reader-progress-label]'),
            progressPercent: document.querySelector('[data-reader-progress-percent]'),
            prev: document.querySelector('[data-reader-prev]'),
            next: document.querySelector('[data-reader-next]')
        };
    }

    function readerDocumentTitle(fileName) {
        return String(fileName || '本地小说').replace(/\.(txt|md|markdown)$/i, '') || '本地小说';
    }

    function parseReaderChapters(text, fileName) {
        const normalized = String(text || '').replace(/\r\n?/g, '\n').trim();
        if (!normalized) {
            return {
                title: readerDocumentTitle(fileName),
                chapters: []
            };
        }

        const headingPattern = /^(?:#{1,3}\s+.+|第[零〇一二三四五六七八九十百千万\d]+[章节卷部集回].*|Chapter\s+\d+.*)$/i;
        const lines = normalized.split('\n');
        const chapters = [];
        let current = {
            title: readerDocumentTitle(fileName),
            lines: []
        };
        let foundHeading = false;

        lines.forEach((line) => {
            const trimmed = line.trim();
            if (headingPattern.test(trimmed)) {
                if (foundHeading || current.lines.some((item) => item.trim())) {
                    chapters.push(current);
                }
                foundHeading = true;
                current = {
                    title: trimmed.replace(/^#{1,3}\s+/, '').trim() || `第 ${chapters.length + 1} 章`,
                    lines: []
                };
                return;
            }
            current.lines.push(line);
        });

        if (current.lines.some((line) => line.trim()) || !chapters.length) {
            chapters.push(current);
        }

        return {
            title: readerDocumentTitle(fileName),
            chapters: chapters.map((chapter, index) => ({
                id: `chapter-${index + 1}`,
                title: chapter.title || `第 ${index + 1} 章`,
                content: chapter.lines.join('\n').trim()
            })).filter((chapter) => chapter.title || chapter.content)
        };
    }

    function snapshotToReaderDocument(snapshot) {
        const project = snapshot && snapshot.project;
        if (!project || !project.id) return null;

        const chapters = Array.isArray(snapshot.chapters) ? [...snapshot.chapters] : [];
        const scenes = Array.isArray(snapshot.scenes) ? [...snapshot.scenes] : [];
        const sceneContents = snapshot.sceneContents && typeof snapshot.sceneContents === 'object'
            ? snapshot.sceneContents
            : {};

        const sortedChapters = chapters.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
        const sortedScenes = scenes.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
        const readerChapters = sortedChapters.map((chapter, index) => {
            const chapterScenes = sortedScenes.filter((scene) => scene.chapterId === chapter.id);
            const content = chapterScenes.map((scene) => {
                const text = String(sceneContents[scene.id] || '').trim();
                if (!text) return '';
                return chapterScenes.length > 1 ? `${scene.title || '场景'}\n\n${text}` : text;
            }).filter(Boolean).join('\n\n');

            return {
                id: chapter.id || `project-chapter-${index + 1}`,
                title: chapter.title || `第 ${index + 1} 章`,
                content
            };
        }).filter((chapter) => chapter.title || chapter.content);

        if (!readerChapters.length && sortedScenes.length) {
            readerChapters.push({
                id: 'project-scenes',
                title: project.name || '当前作品',
                content: sortedScenes.map((scene) => String(sceneContents[scene.id] || '').trim()).filter(Boolean).join('\n\n')
            });
        }

        return {
            source: 'project',
            projectId: String(project.id),
            title: project.name || '当前作品',
            fileName: `${project.name || 'project'}.writingway`,
            importedAt: snapshot.filesystemSavedAt || snapshot.exportedAt || new Date().toISOString(),
            chapters: readerChapters
        };
    }

    function loadReaderFromProjectSnapshot(snapshot, options = {}) {
        const documentData = snapshotToReaderDocument(snapshot);
        if (!documentData) return false;

        const previous = readerState.document;
        const sameProject = previous && previous.source === 'project' && previous.projectId === documentData.projectId;
        readerState.document = documentData;
        readerState.chapterIndex = sameProject ? readerState.chapterIndex : 0;
        saveReaderState();
        renderReader();

        if (options.showReader) setView('reader');
        return true;
    }

    function readerParagraphs(content) {
        const blocks = String(content || '').split(/\n{2,}/)
            .map((block) => block.trim())
            .filter(Boolean);
        if (blocks.length) return blocks;
        return String(content || '').split('\n').map((line) => line.trim()).filter(Boolean);
    }

    function saveReaderState() {
        try {
            localStorage.setItem(READER_STORAGE_KEY, JSON.stringify({
                document: readerState.document,
                chapterIndex: readerState.chapterIndex,
                fontSize: readerState.fontSize,
                lineHeight: readerState.lineHeight,
                theme: readerState.theme
            }));
        } catch (error) {
            console.warn('Failed to save reader state:', error);
        }
    }

    function loadReaderState() {
        try {
            const saved = JSON.parse(localStorage.getItem(READER_STORAGE_KEY) || '{}');
            if (saved && typeof saved === 'object') {
                readerState.document = saved.document && Array.isArray(saved.document.chapters) ? saved.document : null;
                readerState.chapterIndex = Number(saved.chapterIndex) || 0;
                readerState.fontSize = Number(saved.fontSize) || readerState.fontSize;
                readerState.lineHeight = Number(saved.lineHeight) || readerState.lineHeight;
                readerState.theme = saved.theme || readerState.theme;
            }
        } catch (error) {
            console.warn('Failed to load reader state:', error);
        }
    }

    function clampReaderChapter() {
        const total = readerState.document ? readerState.document.chapters.length : 0;
        if (!total) {
            readerState.chapterIndex = 0;
            return;
        }
        readerState.chapterIndex = Math.max(0, Math.min(total - 1, readerState.chapterIndex));
    }

    function applyReaderSettings() {
        const elements = readerElements();
        if (elements.fontSize) elements.fontSize.value = String(readerState.fontSize);
        if (elements.lineHeight) elements.lineHeight.value = String(readerState.lineHeight);
        if (elements.theme) elements.theme.value = readerState.theme;
        if (elements.themePanel) {
            elements.themePanel.dataset.readerTheme = readerState.theme;
            elements.themePanel.style.setProperty('--reader-font-size', `${readerState.fontSize}px`);
            elements.themePanel.style.setProperty('--reader-line-height', String(readerState.lineHeight));
        }
    }

    function renderReader() {
        clampReaderChapter();
        applyReaderSettings();
        const elements = readerElements();
        if (!elements.content) return;

        const documentData = readerState.document;
        const chapters = documentData ? documentData.chapters : [];
        const chapter = chapters[readerState.chapterIndex];

        if (!documentData || !chapters.length || !chapter) {
            if (elements.title) elements.title.textContent = '还没有导入本地小说';
            if (elements.source) elements.source.textContent = 'Reader';
            if (elements.content) {
                elements.content.replaceChildren();
                const empty = document.createElement('p');
                empty.textContent = '选择左侧的 txt 或 md 文件后，这里会显示正文。阶段 1 先提供本地导入、章节识别、进度和排版控制。';
                elements.content.appendChild(empty);
            }
            if (elements.chapters) elements.chapters.replaceChildren();
            if (elements.progress) elements.progress.value = 0;
            if (elements.progressLabel) elements.progressLabel.textContent = '未导入';
            if (elements.progressPercent) elements.progressPercent.textContent = '0%';
            if (elements.prev) elements.prev.disabled = true;
            if (elements.next) elements.next.disabled = true;
            return;
        }

        const progress = Math.round(((readerState.chapterIndex + 1) / chapters.length) * 100);
        if (elements.title) elements.title.textContent = chapter.title;
        if (elements.source) elements.source.textContent = `${documentData.title} / ${readerState.chapterIndex + 1} / ${chapters.length}`;
        if (elements.progress) elements.progress.value = progress;
        if (elements.progressLabel) elements.progressLabel.textContent = `${readerState.chapterIndex + 1} / ${chapters.length} 章`;
        if (elements.progressPercent) elements.progressPercent.textContent = `${progress}%`;
        if (elements.prev) elements.prev.disabled = readerState.chapterIndex <= 0;
        if (elements.next) elements.next.disabled = readerState.chapterIndex >= chapters.length - 1;

        elements.content.replaceChildren();
        const paragraphs = readerParagraphs(chapter.content);
        if (!paragraphs.length) {
            const empty = document.createElement('p');
            empty.textContent = '这一章暂时没有正文。';
            elements.content.appendChild(empty);
        } else {
            paragraphs.forEach((paragraph) => {
                const node = document.createElement('p');
                node.textContent = paragraph;
                elements.content.appendChild(node);
            });
        }

        if (elements.chapters) {
            elements.chapters.replaceChildren();
            chapters.forEach((item, index) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'desktop-reader-chapter';
                button.classList.toggle('is-active', index === readerState.chapterIndex);
                button.textContent = item.title || `第 ${index + 1} 章`;
                button.addEventListener('click', () => {
                    readerState.chapterIndex = index;
                    saveReaderState();
                    renderReader();
                });
                elements.chapters.appendChild(button);
            });
        }
    }

    function readReaderFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('请选择 txt 或 md 文件'));
                return;
            }
            const name = String(file.name || '');
            const isSupported = /\.(txt|md|markdown)$/i.test(name) || /^text\//.test(file.type || '');
            if (!isSupported) {
                reject(new Error('阅读器暂时只支持 txt / md 文件'));
                return;
            }
            if (file.size > 5000000) {
                reject(new Error('文件不能超过 5MB'));
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('读取文件失败'));
            reader.readAsText(file, 'utf-8');
        });
    }

    async function importReaderFile(file) {
        const text = await readReaderFile(file);
        const parsed = parseReaderChapters(text, file.name);
        readerState.document = {
            title: parsed.title,
            fileName: file.name,
            importedAt: new Date().toISOString(),
            chapters: parsed.chapters
        };
        readerState.chapterIndex = 0;
        saveReaderState();
        renderReader();
    }

    function bindReader() {
        loadReaderState();
        renderReader();
        const elements = readerElements();

        if (elements.file) {
            elements.file.addEventListener('change', async () => {
                try {
                    await importReaderFile(elements.file.files && elements.file.files[0]);
                } catch (error) {
                    console.warn('Failed to import reader file:', error);
                    if (elements.content) {
                        elements.content.replaceChildren();
                        const message = document.createElement('p');
                        message.textContent = error.message || String(error);
                        elements.content.appendChild(message);
                    }
                } finally {
                    elements.file.value = '';
                }
            });
        }

        if (elements.fontSize) {
            elements.fontSize.addEventListener('input', () => {
                readerState.fontSize = Number(elements.fontSize.value) || 18;
                applyReaderSettings();
                saveReaderState();
            });
        }

        if (elements.lineHeight) {
            elements.lineHeight.addEventListener('input', () => {
                readerState.lineHeight = Number(elements.lineHeight.value) || 1.8;
                applyReaderSettings();
                saveReaderState();
            });
        }

        if (elements.theme) {
            elements.theme.addEventListener('change', () => {
                readerState.theme = elements.theme.value || 'dark';
                applyReaderSettings();
                saveReaderState();
            });
        }

        if (elements.prev) {
            elements.prev.addEventListener('click', () => {
                readerState.chapterIndex -= 1;
                saveReaderState();
                renderReader();
            });
        }

        if (elements.next) {
            elements.next.addEventListener('click', () => {
                readerState.chapterIndex += 1;
                saveReaderState();
                renderReader();
            });
        }
    }

    async function toggleFullscreen() {
        if (window.writingwayDesktop && typeof window.writingwayDesktop.toggleFullscreen === 'function') {
            await window.writingwayDesktop.toggleFullscreen();
            return;
        }

        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            return;
        }

        if (document.fullscreenElement && document.exitFullscreen) {
            await document.exitFullscreen();
        }
    }

    function bindNavigation() {
        document.querySelectorAll('[data-view-target]').forEach((button) => {
            button.addEventListener('click', () => {
                setView(button.dataset.viewTarget);
            });
        });
    }

    function bindLegacyProjectUpdates() {
        window.addEventListener('message', (event) => {
            if (event.origin !== window.location.origin) return;
            if (!event.data) return;
            if (event.data.type === 'writingway:desktop:project-saved') {
                loadReaderFromProjectSnapshot(event.data.snapshot);
                loadProjectLibrary();
                return;
            }
            if (event.data.type === 'writingway:desktop:project-data-changed') {
                loadProjectLibrary();
            }
        });
    }

    function bindProjectLibrary() {
        document.querySelectorAll('[data-refresh-projects]').forEach((button) => {
            button.addEventListener('click', () => {
                loadProjectLibrary();
            });
        });

        document.querySelectorAll('[data-open-new-project]').forEach((button) => {
            button.addEventListener('click', openProjectCreator);
        });

        document.querySelectorAll('[data-open-project-folder]').forEach((button) => {
            button.addEventListener('click', () => {
                openProjectFolder();
            });
        });

        const search = document.querySelector('[data-project-search]');
        if (search) {
            search.addEventListener('input', () => {
                projectLibraryState.query = search.value || '';
                renderProjectLibrary();
            });
        }

        const sort = document.querySelector('[data-project-sort]');
        if (sort) {
            sort.addEventListener('change', () => {
                projectLibraryState.sort = sort.value || 'recent';
                renderProjectLibrary();
            });
        }
    }

    function bindProjectCreator() {
        const elements = projectCreatorElements();
        if (!elements.modal || !elements.form) return;

        elements.form.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                await createProjectFromDesktop();
            } catch (error) {
                console.error('Failed to create desktop project:', error);
                setProjectCreatorStatus(`创建失败：${error.message || error}`, 'error');
            }
        });

        document.querySelectorAll('[data-close-project-creator]').forEach((button) => {
            button.addEventListener('click', closeProjectCreator);
        });

        elements.modal.addEventListener('click', (event) => {
            if (event.target === elements.modal) closeProjectCreator();
        });
    }

    function bindProjectEditor() {
        const elements = projectEditorElements();
        if (!elements.modal || !elements.form) return;

        elements.form.addEventListener('submit', async (event) => {
            event.preventDefault();
            try {
                await saveProjectEditor();
            } catch (error) {
                console.error('Failed to save project metadata:', error);
                setProjectEditorStatus(`保存失败：${error.message || error}`, 'error');
            }
        });

        document.querySelectorAll('[data-close-project-editor]').forEach((button) => {
            button.addEventListener('click', closeProjectEditor);
        });

        elements.modal.addEventListener('click', (event) => {
            if (event.target === elements.modal) closeProjectEditor();
        });

        const clearCover = document.querySelector('[data-clear-project-cover]');
        if (clearCover) {
            clearCover.addEventListener('click', () => {
                projectLibraryState.editingCoverImage = '';
                if (elements.cover) elements.cover.value = '';
                renderCoverPreview('');
            });
        }

        if (elements.cover) {
            elements.cover.addEventListener('change', async () => {
                try {
                    const image = await readCoverFile(elements.cover.files && elements.cover.files[0]);
                    projectLibraryState.editingCoverImage = image;
                    renderCoverPreview(image);
                    setProjectEditorStatus('', 'info');
                } catch (error) {
                    setProjectEditorStatus(error.message || String(error), 'error');
                    elements.cover.value = '';
                }
            });
        }
    }

    function bindWindowControls() {
        document.querySelectorAll('[data-toggle-fullscreen]').forEach((button) => {
            button.addEventListener('click', async () => {
                try {
                    await toggleFullscreen();
                } catch (error) {
                    console.warn('Failed to toggle fullscreen:', error);
                }
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

    function getLegacyWindow() {
        const frame = getWriterFrame();
        return frame ? frame.contentWindow : null;
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

    async function fetchProjectSnapshot(project) {
        const params = new URLSearchParams();
        if (project && project.id) params.set('projectId', project.id);
        if (project && project.filename) params.set('filename', project.filename);

        const response = await fetch(`/api/get-project?${params.toString()}`, { cache: 'no-store' });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
            throw new Error(result.error || `HTTP ${response.status}`);
        }
        return result.project;
    }

    function countWords(text) {
        return String(text || '').trim().split(/\s+/).filter(Boolean).length;
    }

    async function deleteProjectRows(db, projectId, sceneIds) {
        const projectTables = ['chapters', 'scenes', 'compendium', 'prompts', 'codex', 'promptHistory', 'workshopSessions'];

        for (const tableName of projectTables) {
            if (!db[tableName]) continue;
            try {
                await db[tableName].where('projectId').equals(projectId).delete();
            } catch (error) {
                console.warn(`Failed to clear ${tableName} for desktop project import:`, error);
            }
        }

        if (db.content) {
            for (const sceneId of sceneIds) {
                try { await db.content.delete(sceneId); } catch (error) { /* ignore individual stale rows */ }
            }
        }

        await db.projects.delete(projectId);
    }

    async function importRows(db, tableName, rows) {
        if (!db[tableName] || !Array.isArray(rows) || rows.length === 0) return;
        await db[tableName].bulkPut(rows);
    }

    async function importSnapshotIntoLegacyDb(snapshot) {
        const writerWindow = getLegacyWindow();
        const db = writerWindow && writerWindow.db;
        const project = snapshot && snapshot.project;
        if (!db || !project || !project.id) {
            throw new Error('Legacy writer database is not ready.');
        }

        const projectId = String(project.id);
        const existingScenes = await db.scenes.where('projectId').equals(projectId).toArray().catch(() => []);
        const snapshotScenes = Array.isArray(snapshot.scenes) ? snapshot.scenes : [];
        const sceneIds = new Set([
            ...existingScenes.map((scene) => scene.id),
            ...snapshotScenes.map((scene) => scene.id)
        ].filter(Boolean));

        await deleteProjectRows(db, projectId, sceneIds);
        await db.projects.put(project);
        await importRows(db, 'chapters', snapshot.chapters || []);
        await importRows(db, 'scenes', snapshotScenes);
        await importRows(db, 'compendium', snapshot.compendium || []);
        await importRows(db, 'prompts', snapshot.prompts || []);
        await importRows(db, 'codex', snapshot.codex || []);
        await importRows(db, 'promptHistory', snapshot.promptHistory || []);
        await importRows(db, 'workshopSessions', snapshot.workshopSessions || []);

        const contentRows = [];
        if (snapshot.sceneContents && typeof snapshot.sceneContents === 'object') {
            Object.entries(snapshot.sceneContents).forEach(([sceneId, text]) => {
                contentRows.push({
                    sceneId,
                    text: text || '',
                    wordCount: countWords(text),
                    updatedAt: Date.now()
                });
            });
        }
        await importRows(db, 'content', contentRows);
    }

    async function openDesktopProject(project) {
        if (project && project.health === 'invalid') {
            setProjectLibraryStatus('这个项目文件暂时无法读取，请先检查磁盘快照。', 'error');
            return;
        }

        setProjectLibraryStatus(`正在打开《${project.name || '未命名项目'}》...`, 'info');
        setView('writer');

        const app = await waitForLegacyAppData();
        const snapshot = await fetchProjectSnapshot(project);
        loadReaderFromProjectSnapshot(snapshot);
        await importSnapshotIntoLegacyDb(snapshot);

        if (typeof app.loadProjects === 'function') await app.loadProjects();
        if (typeof app.openProject === 'function') {
            await app.openProject(snapshot.project.id);
        } else if (typeof app.selectProject === 'function') {
            app.showProjectsView = false;
            await app.selectProject(snapshot.project.id);
        }

        setProjectLibraryStatus('', 'ok');
    }

    async function runLegacyAction(action) {
        setView('writer');

        const app = await waitForLegacyAppData();
        if (action === 'ai-settings') {
            app.showAISettings = true;
            return;
        }

        if (action === 'new-project') {
            app.showProjectsView = true;
            app.showNewProjectModal = true;
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
        bindWindowControls();
        bindProjectLibrary();
        bindProjectCreator();
        bindProjectEditor();
        bindReader();
        bindLegacyProjectUpdates();
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
        setView,
        toggleFullscreen
    };
})();
