(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WritingwayPromptTemplateSchema = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const PROMPT_CATEGORIES = Object.freeze(['prose', 'rewrite', 'summary', 'workshop', 'workflow']);
    const DEFAULT_TIMESTAMP = '1970-01-01T00:00:00.000Z';

    const DEFAULT_PROMPT_SPECS = Object.freeze({
        prose: Object.freeze([
            {
                id: 'default-prose',
                title: '默认正文扩写',
                systemContent: 'You are a fiction co-writing assistant. Write from {povName}\'s point of view, in {tense}, using {pov}. Use the same language as the author\'s beat and surrounding scene text unless the author explicitly requests another language. Match the author\'s tone and style.',
                content: 'Expand the beat into vivid, natural prose. Continue directly from the current scene. Write 2-3 paragraphs unless the beat asks for a different length. Use sensory details, concrete actions, and character emotion. Do not explain the beat; turn it into story text.'
            },
            {
                id: 'default-prose-scene-forward',
                title: '默认剧情推进',
                systemContent: 'You are a disciplined fiction drafting assistant. Preserve continuity, character intent, and point of view.',
                content: '根据写作指令继续推进当前场景。优先写清楚角色目标、阻力、行动和结果；保持节奏明确，不跳过关键动作，不提前总结。输出可直接接在正文后的小说文本。'
            },
            {
                id: 'default-prose-atmosphere',
                title: '默认氛围描写',
                systemContent: 'You are a fiction stylist who strengthens atmosphere without losing narrative motion.',
                content: '扩写时加强场景氛围、感官细节和人物细微反应，但不要停在纯描写里。让环境细节服务于情绪、冲突或伏笔，保持与上下文自然衔接。'
            }
        ]),
        rewrite: Object.freeze([
            {
                id: 'default-rewrite-balanced',
                title: '默认均衡润色',
                content: '请重写选中文段，使语言更自然、流畅、有画面感，同时保留原意、事实信息、人物关系和叙事视角。不要扩写过多，长度尽量接近原文。'
            },
            {
                id: 'default-rewrite-tighten',
                title: '默认压缩精炼',
                content: '请压缩并精炼选中文段，删除重复、拖沓、解释过度的句子，让表达更干净有力。保留关键动作、信息和情绪，长度约为原文的 60%-80%。'
            },
            {
                id: 'default-rewrite-expand',
                title: '默认适度扩写',
                content: '请适度扩写选中文段，补足必要的动作衔接、心理反应、环境细节和节奏停顿。不要改变剧情走向和人物意图，长度约为原文的 1.3-1.8 倍。'
            },
            {
                id: 'default-rewrite-show-dont-tell',
                title: '默认少解释多呈现',
                content: '请把选中文段中的直白说明、总结性描述和情绪标签，改写成具体动作、感官细节、人物反应和可观察的场景表现。保留原本要表达的情绪和信息。'
            },
            {
                id: 'default-rewrite-dialogue',
                title: '默认对白自然化',
                content: '请重写选中文段中的对白，让台词更自然、有角色感，减少书面腔和信息直给。保留原本要传达的信息，并加入适量动作或停顿来承载潜台词。'
            },
            {
                id: 'default-rewrite-cinematic',
                title: '默认电影镜头感',
                content: '请重写选中文段，增强电影镜头感。用清晰的画面调度、动作顺序、视线移动和环境反应来呈现场景。避免解释镜头术语，直接写成小说正文。'
            }
        ]),
        summary: Object.freeze([
            {
                id: 'default-summary-scene',
                title: '默认场景摘要',
                systemContent: 'You summarize fiction scenes for continuity tracking. Be compact, concrete, and neutral.',
                content: '请为当前场景生成可用于后续写作检索的摘要。包括：发生了什么、角色目标与关系变化、关键线索、未解决问题。不要评价文风，不要写成宣传语。'
            },
            {
                id: 'default-summary-chapter',
                title: '默认章节摘要',
                systemContent: 'You summarize chapters for long-form fiction planning and continuity.',
                content: '请汇总本章节的主要情节推进、人物变化、冲突结果、伏笔与下一章承接点。保持结构清晰，适合放入章节摘要字段。'
            },
            {
                id: 'default-summary-compendium',
                title: '默认资料提炼',
                systemContent: 'You extract stable story facts for a fiction project bible.',
                content: '请从文本中提炼可沉淀到资料库的信息，包括人物、地点、组织、物品、规则、时间线和关系变化。只记录稳定事实，不把临时猜测写成设定。'
            }
        ]),
        workshop: Object.freeze([
            {
                id: 'default-workshop-coach',
                title: '默认写作顾问',
                systemContent: 'You are a creative writing assistant helping brainstorm and develop fiction. Be concrete, useful, and concise unless the author asks for depth.',
                content: '围绕作者的问题给出具体建议。优先结合项目上下文，指出可执行的下一步；需要提出多个方案时，说明各自适合的写作效果。'
            },
            {
                id: 'default-workshop-plot-doctor',
                title: '默认剧情诊断',
                systemContent: 'You are a fiction plot doctor. Diagnose structure, stakes, causality, and reader momentum.',
                content: '请诊断当前剧情的问题：目标是否清晰、冲突是否足够、因果是否连贯、节奏是否合适、悬念是否有效。给出具体修改建议，不要泛泛鼓励。'
            },
            {
                id: 'default-workshop-character',
                title: '默认角色问答',
                systemContent: 'You help develop fictional characters through motivation, contradiction, voice, and behavior.',
                content: '请从角色动机、恐惧、欲望、矛盾、说话方式和行动习惯出发回答。建议要能直接转化为场景、对白或人物卡资料。'
            }
        ]),
        workflow: Object.freeze([
            {
                id: 'default-workflow-brief',
                title: '默认项目设定整理',
                systemContent: 'You are a semi-automatic fiction workflow assistant. Produce reviewable planning artifacts.',
                content: '请把当前项目整理成可人工确认的项目设定：题材、核心卖点、主角目标、主要冲突、世界规则、重要角色、已知限制和待确认问题。'
            },
            {
                id: 'default-workflow-outline',
                title: '默认章节大纲',
                systemContent: 'You are a fiction outlining assistant. Keep the result structured and editable.',
                content: '请生成可人工确认的章节大纲。每章包含目标、冲突、转折、情绪推进、伏笔和结尾钩子。只写大纲，不写正文。'
            },
            {
                id: 'default-workflow-scene-draft',
                title: '默认场景草稿',
                systemContent: 'You are a fiction drafting assistant. Output reviewable prose that can be accepted or revised.',
                content: '请根据已确认的大纲生成一个场景草稿。只写一个场景，保持明确冲突、行动推进和结尾承接。输出可直接写入项目的正文草稿。'
            }
        ])
    });

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

    function defaultPromptTemplates(category = '', projectId = '') {
        const categories = PROMPT_CATEGORIES.includes(category)
            ? [category]
            : PROMPT_CATEGORIES.filter((item) => DEFAULT_PROMPT_SPECS[item]);
        return categories.flatMap((item) => (DEFAULT_PROMPT_SPECS[item] || []).map((spec) => createPromptTemplate({
            ...spec,
            projectId,
            category: item,
            isDefault: true,
            createdAt: DEFAULT_TIMESTAMP,
            updatedAt: DEFAULT_TIMESTAMP
        })));
    }

    function defaultProsePrompt(projectId = '') {
        return defaultPromptTemplates('prose', projectId)[0];
    }

    function isDefaultPromptId(promptId) {
        const id = cleanString(promptId);
        if (!id) return false;
        return defaultPromptTemplates().some((prompt) => prompt.id === id);
    }

    return {
        PROMPT_CATEGORIES,
        createPromptTemplate,
        normalizePromptTemplates,
        defaultPromptTemplates,
        defaultProsePrompt,
        isDefaultPromptId
    };
});
