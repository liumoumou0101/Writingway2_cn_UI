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

    function init() {
        bindNavigation();
        const state = getState();
        setView(state ? state.loadInitialView() : 'bookshelf');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.WritingwayDesktopShell = {
        setView
    };
})();
