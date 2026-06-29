async function getLegacyApp(page) {
    return page.evaluateHandle(() => {
        const root = document.querySelector('[x-data="app"]');
        if (!root) return null;
        if (window.Alpine && typeof window.Alpine.$data === 'function') {
            return window.Alpine.$data(root);
        }
        return root.__x && root.__x.$data ? root.__x.$data : null;
    });
}

async function openLatestLegacyProject(page) {
    await page.waitForFunction(() => window.db && window.Alpine && document.querySelector('[x-data="app"]'), null, {
        timeout: 10000
    });
    await page.evaluate(async () => {
        const projects = await db.projects.orderBy('created').reverse().toArray();
        const project = projects[0];
        if (!project) return;
        try { localStorage.setItem('writingway:lastProject', project.id); } catch (e) { }

        const root = document.querySelector('[x-data="app"]');
        const app = window.Alpine && typeof window.Alpine.$data === 'function'
            ? window.Alpine.$data(root)
            : (root && root.__x && root.__x.$data ? root.__x.$data : null);

        if (app && typeof app.openProject === 'function') {
            await app.openProject(project.id);
        } else if (app && typeof app.selectProject === 'function') {
            app.showProjectsView = false;
            await app.selectProject(project.id);
        }
    });
}

module.exports = {
    getLegacyApp,
    openLatestLegacyProject
};
