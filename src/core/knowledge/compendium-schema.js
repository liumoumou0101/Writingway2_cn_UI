(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WritingwayCompendiumSchema = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const ENTRY_TYPES = Object.freeze([
        'character',
        'location',
        'organization',
        'item',
        'lore',
        'timeline',
        'note'
    ]);

    function nowIso() {
        return new Date().toISOString();
    }

    function cleanString(value, fallback = '') {
        const text = value === null || value === undefined ? fallback : String(value);
        return text.trim();
    }

    function normalizeTimestamp(value, fallback) {
        if (!value) return fallback;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
    }

    function uniqueStrings(values) {
        const seen = new Set();
        const result = [];
        for (const value of Array.isArray(values) ? values : []) {
            const text = cleanString(value);
            if (!text || seen.has(text)) continue;
            seen.add(text);
            result.push(text);
        }
        return result;
    }

    function typeFromCategory(value) {
        const text = cleanString(value).toLowerCase();
        const aliases = {
            characters: 'character',
            character: 'character',
            people: 'character',
            locations: 'location',
            location: 'location',
            places: 'location',
            organizations: 'organization',
            organization: 'organization',
            factions: 'organization',
            items: 'item',
            item: 'item',
            objects: 'item',
            lore: 'lore',
            worldbuilding: 'lore',
            timeline: 'timeline',
            timelines: 'timeline',
            notes: 'note',
            note: 'note'
        };
        return aliases[text] || (ENTRY_TYPES.includes(text) ? text : 'lore');
    }

    function makeId(prefix = 'entry') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function createCompendiumEntry(input = {}) {
        const now = nowIso();
        const type = ENTRY_TYPES.includes(input.type) ? input.type : typeFromCategory(input.category);
        const id = cleanString(input.id, makeId(type));
        return {
            id,
            projectId: cleanString(input.projectId),
            type,
            category: cleanString(input.category, type),
            title: cleanString(input.title, '未命名资料') || '未命名资料',
            summary: cleanString(input.summary),
            body: input.body === undefined ? cleanString(input.content) : String(input.body || ''),
            tags: uniqueStrings(input.tags).slice(0, 40),
            aliases: uniqueStrings(input.aliases).slice(0, 40),
            relatedSceneIds: uniqueStrings(input.relatedSceneIds || input.sceneIds).slice(0, 80),
            imageUrl: cleanString(input.imageUrl),
            alwaysInContext: !!input.alwaysInContext,
            order: Number.isFinite(Number(input.order)) ? Number(input.order) : 0,
            createdAt: normalizeTimestamp(input.createdAt || input.created, now),
            updatedAt: normalizeTimestamp(input.updatedAt || input.modified, now)
        };
    }

    function normalizeCompendiumEntries(entries = [], projectId = '') {
        const seen = new Set();
        return (Array.isArray(entries) ? entries : [])
            .map((entry, index) => createCompendiumEntry({
                ...entry,
                projectId: cleanString(entry && entry.projectId, projectId),
                order: Number.isFinite(Number(entry && entry.order)) ? Number(entry.order) : index
            }))
            .filter((entry) => {
                if (seen.has(entry.id)) return false;
                seen.add(entry.id);
                return true;
            })
            .sort((a, b) => {
                const typeCompare = a.type.localeCompare(b.type);
                if (typeCompare) return typeCompare;
                return (Number(a.order) || 0) - (Number(b.order) || 0);
            });
    }

    function compendiumEntrySummary(entry) {
        const normalized = createCompendiumEntry(entry);
        return {
            id: normalized.id,
            projectId: normalized.projectId,
            type: normalized.type,
            category: normalized.category,
            title: normalized.title,
            summary: normalized.summary,
            tags: normalized.tags,
            aliases: normalized.aliases,
            alwaysInContext: normalized.alwaysInContext,
            updatedAt: normalized.updatedAt
        };
    }

    return {
        ENTRY_TYPES,
        createCompendiumEntry,
        normalizeCompendiumEntries,
        compendiumEntrySummary,
        typeFromCategory
    };
});
