(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WritingwayContextResolver = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function cleanString(value) {
        return String(value || '').trim();
    }

    function uniquePush(list, item, key) {
        if (!item) return;
        const id = key(item);
        if (!id || list.some((existing) => key(existing) === id)) return;
        list.push(item);
    }

    function mentionNames(text, marker) {
        const pattern = marker === '@' ? /@\[([^\]]+)\]/g : /#\[([^\]]+)\]/g;
        const names = [];
        let match;
        while ((match = pattern.exec(String(text || '')))) {
            const name = cleanString(match[1]).toLowerCase();
            if (name) names.push(name);
        }
        return names;
    }

    function textLength(value) {
        return String(value || '').length;
    }

    function entryMatchesMention(entry, names) {
        const title = cleanString(entry.title).toLowerCase();
        const aliases = Array.isArray(entry.aliases) ? entry.aliases.map((alias) => cleanString(alias).toLowerCase()) : [];
        return names.includes(title) || aliases.some((alias) => names.includes(alias));
    }

    function sceneMatchesMention(scene, names) {
        return names.includes(cleanString(scene.title).toLowerCase());
    }

    function sceneSummary(scene, content = '') {
        return {
            id: scene.id,
            title: scene.title || '未命名场景',
            summary: scene.summary || String(content || '').slice(0, 500)
        };
    }

    function applyBudget(context, maxChars) {
        if (!Number.isFinite(Number(maxChars)) || Number(maxChars) <= 0) return context;
        let remaining = Number(maxChars);
        const compendiumEntries = [];
        for (const entry of context.compendiumEntries) {
            const cost = textLength(entry.title) + textLength(entry.summary) + textLength(entry.body);
            if (cost > remaining && compendiumEntries.length) continue;
            compendiumEntries.push(entry);
            remaining -= cost;
            if (remaining <= 0) break;
        }
        const sceneSummaries = [];
        for (const scene of context.sceneSummaries) {
            const cost = textLength(scene.title) + textLength(scene.summary);
            if (cost > remaining && sceneSummaries.length) continue;
            sceneSummaries.push(scene);
            remaining -= cost;
            if (remaining <= 0) break;
        }
        return {
            ...context,
            compendiumEntries,
            sceneSummaries,
            budget: {
                maxChars: Number(maxChars),
                remaining: Math.max(0, remaining)
            }
        };
    }

    function resolveContext(input = {}) {
        const project = input.project || {};
        const selection = input.selection || {};
        const beat = input.beat || '';
        const currentSceneId = cleanString(selection.currentSceneId || input.currentSceneId || project.currentSceneId);
        const maxChars = selection.maxChars || input.maxChars || 5000;
        const compendium = Array.isArray(project.compendium) ? project.compendium : [];
        const scenes = Array.isArray(project.scenes) ? project.scenes : [];
        const sceneContents = project.sceneContents && typeof project.sceneContents === 'object' ? project.sceneContents : {};
        const context = {
            compendiumEntries: [],
            sceneSummaries: [],
            manualText: cleanString(selection.manualText),
            selected: {
                compendiumIds: Array.isArray(selection.compendiumIds) ? selection.compendiumIds : [],
                compendiumTags: Array.isArray(selection.compendiumTags) ? selection.compendiumTags : [],
                sceneIds: Array.isArray(selection.sceneIds) ? selection.sceneIds : [],
                chapterIds: Array.isArray(selection.chapterIds) ? selection.chapterIds : []
            }
        };

        const entryMentionNames = mentionNames(beat, '@');
        for (const entry of compendium) {
            const selectedById = context.selected.compendiumIds.includes(entry.id);
            const selectedByTag = (entry.tags || []).some((tag) => context.selected.compendiumTags.includes(tag));
            const selectedByMention = entryMatchesMention(entry, entryMentionNames);
            if (entry.alwaysInContext || selectedById || selectedByTag || selectedByMention) {
                uniquePush(context.compendiumEntries, entry, (item) => item.id);
            }
        }

        const sceneMentionNames = mentionNames(beat, '#');
        const currentIndex = scenes.findIndex((scene) => scene.id === currentSceneId);
        const previousScenes = scenes
            .filter((scene, index) => index < currentIndex && scene.summary)
            .slice(-Number(selection.recentSceneLimit || 6));
        for (const scene of previousScenes) {
            uniquePush(context.sceneSummaries, sceneSummary(scene, sceneContents[scene.id] || scene.content), (item) => item.id || item.title);
        }
        for (const scene of scenes) {
            const selectedById = context.selected.sceneIds.includes(scene.id);
            const selectedByChapter = context.selected.chapterIds.includes(scene.chapterId);
            const selectedByMention = sceneMatchesMention(scene, sceneMentionNames);
            if (selectedById || selectedByChapter || selectedByMention) {
                uniquePush(context.sceneSummaries, sceneSummary(scene, sceneContents[scene.id] || scene.content), (item) => item.id || item.title);
            }
        }

        return applyBudget(context, maxChars);
    }

    return {
        resolveContext,
        mentionNames,
        applyBudget
    };
});
