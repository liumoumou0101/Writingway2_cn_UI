(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WritingwayPromptTemplateSchema = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const PROMPT_CATEGORIES = Object.freeze(['prose', 'rewrite', 'summary', 'workshop', 'workflow']);

    function cleanString(value, fallback = '') {
        const text = value === null || value === undefined ? fallback : String(value);
        return text.trim();
    }

    function timestamp(value) {
        if (value) {
            const date = new Date(value);
            if (!Number.isNaN(date.getTime())) return date.toISOString();
        }
        return new Date().toISOString();
    }

    function makeId(category = 'prompt') {
        return `${category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function createPromptTemplate(input = {}) {
        const category = PROMPT_CATEGORIES.includes(input.category) ? input.category : 'prose';
        const now = timestamp(input.createdAt || input.created);
        return {
            id: cleanString(input.id, makeId(category)),
            projectId: cleanString(input.projectId),
            category,
            title: cleanString(input.title, '新提示词') || '新提示词',
            systemContent: input.systemContent === undefined ? cleanString(input.systemPrompt) : String(input.systemContent || ''),
            content: input.content === undefined ? cleanString(input.prosePrompt || input.userContent) : String(input.content || ''),
            tags: Array.isArray(input.tags) ? input.tags.map(cleanString).filter(Boolean) : [],
            isDefault: !!input.isDefault,
            createdAt: timestamp(input.createdAt || input.created || now),
            updatedAt: timestamp(input.updatedAt || input.modified || now)
        };
    }

    function normalizePromptTemplates(prompts = [], projectId = '') {
        const seen = new Set();
        return (Array.isArray(prompts) ? prompts : [])
            .map((prompt) => createPromptTemplate({
                ...prompt,
                projectId: cleanString(prompt && prompt.projectId, projectId)
            }))
            .filter((prompt) => {
                if (seen.has(prompt.id)) return false;
                seen.add(prompt.id);
                return true;
            })
            .sort((a, b) => {
                const categoryCompare = a.category.localeCompare(b.category);
                if (categoryCompare) return categoryCompare;
                return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
            });
    }

    function defaultProsePrompt(projectId = '') {
        return createPromptTemplate({
            id: 'default-prose',
            projectId,
            category: 'prose',
            title: '默认正文扩写',
            isDefault: true,
            systemContent: '',
            content: ''
        });
    }

    return {
        PROMPT_CATEGORIES,
        createPromptTemplate,
        normalizePromptTemplates,
        defaultProsePrompt
    };
});
