// Generation helpers module
// Exposes window.Generation with:
// - buildPrompt(beat, sceneContext, options) => string
// - streamGeneration(prompt, onToken(token)) => Promise<void>
(function () {
    function buildPrompt(beat, sceneContext, options = {}) {
        try {
            console.debug('[buildPrompt] received prosePrompt:', JSON.stringify(options.prosePrompt));
            console.debug('[buildPrompt] received systemPrompt:', JSON.stringify(options.systemPrompt));
        } catch (e) { /* ignore */ }
        const povName = (options.povCharacter && options.povCharacter.trim()) ? options.povCharacter.trim() : 'the protagonist';
        const tenseText = (options.tense === 'present') ? 'present tense' : 'past tense';
        const povText = options.pov || '3rd person limited';
        const povSentence = `You are a co-author helping continue a story from the point of view of ${povName}, in ${tenseText}, using ${povText}.`;

        // Use custom system prompt if provided, otherwise fall back to default
        let systemPrompt;
        if (options.systemPrompt && typeof options.systemPrompt === 'string' && options.systemPrompt.trim()) {
            systemPrompt = options.systemPrompt.trim()
                .replace(/\{povName\}/gi, povName)
                .replace(/\{tense\}/gi, tenseText)
                .replace(/\{pov\}/gi, povText);
        } else {
            systemPrompt = `${povSentence} Use the same language as the author's beat and surrounding scene text unless the author explicitly requests another language. If the author writes in Chinese, write in Chinese. If the author writes in English, write in English. Expand the beat into vivid, natural prose. Match the author's tone and style, use sensory details, and show rather than explain.`;
        }

        let contextText = '';
        if (sceneContext && sceneContext.length > 0) {
            contextText = `\n\nCURRENT SCENE SO FAR:\n${sceneContext}`;
        }

        let proseTemplateText = '';
        if (options.prosePrompt && typeof options.prosePrompt === 'string' && options.prosePrompt.trim()) {
            if (options.preview) {
                proseTemplateText = `\n\n${options.prosePrompt.trim()}`;
            } else {
                proseTemplateText = `\n\n--- PROMPT TEMPLATE START ---\n${options.prosePrompt.trim()}\n--- PROMPT TEMPLATE END ---`;
            }
        }

        let compendiumText = '';
        if (options.compendiumEntries && Array.isArray(options.compendiumEntries) && options.compendiumEntries.length > 0) {
            compendiumText = '\n\nCOMPENDIUM REFERENCES:\n';
            for (const ce of options.compendiumEntries) {
                try {
                    const title = ce.title || ('entry ' + (ce.id || ''));
                    const body = (ce.body || ce.body || ce.description || '') || ce.body || '';
                    compendiumText += `\n-- ${title} --\n${body}\n`;
                } catch (e) { /* ignore */ }
            }
        }

        let sceneSummariesText = '';
        if (options.sceneSummaries && Array.isArray(options.sceneSummaries) && options.sceneSummaries.length > 0) {
            sceneSummariesText = '\n\nPREVIOUS SCENES:\n';
            for (const scene of options.sceneSummaries) {
                try {
                    const title = scene.title || 'Untitled Scene';
                    const summary = scene.summary || '';
                    if (summary) {
                        sceneSummariesText += `\n-- ${title} --\n${summary}\n`;
                    }
                } catch (e) { /* ignore */ }
            }
        }

        let userContent = `${contextText}${proseTemplateText}`;
        if (compendiumText) userContent += compendiumText;
        if (sceneSummariesText) userContent += sceneSummariesText;

        let cleanedBeat = beat;
        cleanedBeat = cleanedBeat.replace(/@\[([^\]]+)\]/g, '');
        cleanedBeat = cleanedBeat.replace(/#\[([^\]]+)\]/g, '');
        cleanedBeat = cleanedBeat.replace(/\s+/g, ' ').trim();

        userContent += `\n\nBEAT TO EXPAND:\n${cleanedBeat}\n\nContinue in the same language as the beat. Write the next 2-3 paragraphs:`;

        const result = {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent }
            ],
            asString: function () {
                return `<|im_start|>system\n${systemPrompt}<|im_end|>\n<|im_start|>user\n${userContent}<|im_end|>\n<|im_start|>assistant\n`;
            }
        };
        return result;
    }

    async function streamGeneration(prompt, onToken, app) {
        const aiMode = app?.aiMode || 'local';
        const aiProvider = app?.aiProvider || 'anthropic';
        const aiApiKey = app?.aiApiKey || '';
        const aiModel = app?.aiModel || '';
        const aiEndpoint = app?.aiEndpoint || 'http://localhost:8080';
        const useProviderDefaults = app?.useProviderDefaults || false;
        const temperature = app?.temperature || 0.8;
        const maxTokens = app?.maxTokens || 300;

        let promptStr = prompt;
        let messages = null;

        if (typeof prompt === 'object' && prompt.messages) {
            messages = prompt.messages;
            if (aiMode === 'local') {
                promptStr = prompt.asString();
            }
        } else if (Array.isArray(prompt)) {
            messages = prompt;
            if (aiMode === 'local') {
                promptStr = messagesToChatML(messages);
            }
        }

        try {
            if (aiMode === 'api') {
                return await streamGenerationAPI(messages || promptStr, onToken, aiProvider, aiApiKey, aiModel, aiEndpoint, temperature, maxTokens, app, useProviderDefaults);
            } else {
                return await streamGenerationLocal(promptStr, onToken, aiEndpoint, temperature, maxTokens, useProviderDefaults, app?.generationAbortController?.signal);
            }
        } finally {
            if (app) app.reasoningInProgress = false;
        }
    }

    function messagesToChatML(messages) {
        if (!Array.isArray(messages)) return '';
        let result = '';
        for (const msg of messages) {
            result += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
        }
        result += '<|im_start|>assistant\n';
        return result;
    }

    function resolveDeepSeekModel(model) {
        const selectedModel = (model || 'deepseek-v4-pro').trim();
        const legacyModels = {
            'deepseek-chat': { realModel: 'deepseek-v4-flash', enableThinking: false },
            'deepseek-reasoner': { realModel: 'deepseek-v4-flash', enableThinking: true }
        };

        if (legacyModels[selectedModel]) {
            return legacyModels[selectedModel];
        }

        if (selectedModel === 'deepseek-v4-pro-thinking') {
            return { realModel: 'deepseek-v4-pro', enableThinking: true };
        }

        if (selectedModel === 'deepseek-v4-flash-thinking') {
            return { realModel: 'deepseek-v4-flash', enableThinking: true };
        }

        return {
            realModel: selectedModel,
            enableThinking: false
        };
    }

    function appendReasoning(app, text) {
        if (!app || !text) return;
        app.lastReasoningText = (app.lastReasoningText || '') + text;
        app.reasoningInProgress = true;
    }

    function createNoContentError(app, provider) {
        if (provider === 'deepseek' && app?.lastReasoningText) {
            return new Error('DeepSeek returned reasoning content but no final prose. Try increasing Max Length, or switch to a non-thinking DeepSeek mode.');
        }
        return new Error('No content received from API.');
    }

    function isAbortError(error) {
        return error && (error.name === 'AbortError' || String(error.message || '').toLowerCase().includes('aborted'));
    }

    function formatAPIError(provider, status, errorText) {
        if (provider !== 'deepseek') {
            return `API returned ${status}: ${errorText}`;
        }

        const lower = String(errorText || '').toLowerCase();
        if (status === 401 || status === 403) {
            return `DeepSeek authentication failed (${status}). Check your API key.`;
        }
        if (status === 402 || lower.includes('insufficient') || lower.includes('balance')) {
            return `DeepSeek account balance or quota is insufficient (${status}). Check your DeepSeek billing/usage page.`;
        }
        if (status === 400 && (lower.includes('model') || lower.includes('thinking') || lower.includes('temperature'))) {
            return `DeepSeek rejected the request (${status}). The selected model or thinking/temperature settings may be incompatible. ${errorText}`;
        }
        if (status === 429) {
            return `DeepSeek rate limit reached (${status}). Wait a moment and try again.`;
        }
        return `DeepSeek API returned ${status}: ${errorText}`;
    }

    async function streamGenerationLocal(prompt, onToken, endpoint, temperature, maxTokens, useProviderDefaults, signal) {
        const requestBody = {
            prompt: prompt,
            top_p: 0.9,
            stop: ['<|im_end|>', '<|endoftext|>', '\n\n\n\n', 'USER:', 'HUMAN:'],
            stream: true
        };

        if (!useProviderDefaults) {
            requestBody.n_predict = maxTokens || 300;
            requestBody.temperature = temperature || 0.8;
        }

        const response = await fetch(endpoint + '/completion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal
        });

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.content) onToken(data.content);
                        if (data.stop) return;
                    } catch (e) { /* ignore */ }
                }
            }
        }
    }

    async function streamGenerationAPI(prompt, onToken, provider, apiKey, model, customEndpoint, temperature, maxTokens, app, useProviderDefaults) {
        let url, headers, body;

        let messages;
        if (Array.isArray(prompt)) {
            messages = prompt;
        } else if (typeof prompt === 'string') {
            messages = [{ role: 'user', content: prompt }];
        } else {
            messages = [{ role: 'user', content: String(prompt) }];
        }

        const temp = temperature || 0.8;
        const maxTok = maxTokens || 300;
        const userForcedNonStreaming = app?.forceNonStreaming || false;

        const modelLower = (model || '').toLowerCase();
        const isThinkingModel = model && (
            /\bo[0-9][-_]/.test(model) ||
            modelLower.includes('reasoning') ||
            modelLower.includes('think') ||
            modelLower.includes('thought') ||
            modelLower.includes('deepseek-reasoner') ||
            modelLower.includes('qwq') ||
            modelLower.includes('deepseek-v4-pro-thinking') ||
            (modelLower.includes('r1') && modelLower.includes('deepseek')) ||
            modelLower.includes('thinking')
        );

        const shouldDisableStreaming = userForcedNonStreaming || isThinkingModel;

        if (shouldDisableStreaming) {
            if (userForcedNonStreaming) console.log('🔧 Non-streaming mode forced by user setting');
            if (isThinkingModel) console.log('🧠 Thinking model detected:', model, '- will use non-streaming mode');
        }

        if (provider === 'openrouter') {
            url = 'https://openrouter.ai/api/v1/chat/completions';
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'Writingway'
            };
            body = {
                model: model || 'google/gemini-2.5-flash',
                messages: messages,
                stream: !shouldDisableStreaming
            };
            if (!useProviderDefaults) {
                body.temperature = temp;
                body.max_tokens = maxTok;
            }
        } else if (provider === 'anthropic') {
            url = 'https://api.anthropic.com/v1/messages';
            headers = {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            };
            body = {
                model: model || 'claude-3-5-sonnet-20241022',
                messages: messages,
                stream: true
            };
            if (!useProviderDefaults) {
                body.temperature = temp;
                body.max_tokens = maxTok;
            } else {
                body.max_tokens = 4096;
            }
        } else if (provider === 'openai') {
            url = 'https://api.openai.com/v1/chat/completions';
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
            body = {
                model: model || 'gpt-4o-mini',
                messages: messages,
                stream: !shouldDisableStreaming
            };
            if (!useProviderDefaults) {
                body.temperature = temp;
                body.max_tokens = maxTok;
            }
        } else if (provider === 'deepseek') {
            url = 'https://api.deepseek.com/chat/completions';
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };

            const deepSeekModel = resolveDeepSeekModel(model);

            body = {
                model: deepSeekModel.realModel,
                messages: messages,
                stream: deepSeekModel.enableThinking ? false : !shouldDisableStreaming,
                thinking: {
                    type: deepSeekModel.enableThinking ? 'enabled' : 'disabled'
                }
            };

            if (deepSeekModel.enableThinking) {
                body.reasoning_effort = 'high';
                if (!useProviderDefaults) {
                    body.max_tokens = maxTok;
                }
            } else if (!useProviderDefaults) {
                body.temperature = temp;
                body.max_tokens = maxTok;
            }
        } else if (provider === 'google') {
            const text = messages.map(m => m.content).join('\n\n');
            url = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:streamGenerateContent?key=${apiKey}`;
            headers = { 'Content-Type': 'application/json' };
            body = {
                contents: [{ parts: [{ text: text }] }]
            };
            if (!useProviderDefaults) {
                body.generationConfig = {
                    temperature: temp,
                    maxOutputTokens: maxTok
                };
            }
        } else if (provider === 'nanogpt') {
            let endpoint = (customEndpoint || 'https://nano-gpt.com/api').replace(/\/+$/, '');
            url = `${endpoint}/chat/completions`;
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
            body = {
                model: model,
                messages: messages,
                stream: !shouldDisableStreaming
            };
            if (!useProviderDefaults) {
                body.temperature = temp;
                body.max_tokens = maxTok;
            }
        } else if (provider === 'lmstudio') {
            let endpoint = (customEndpoint || 'http://localhost:1234').replace(/\/+$/, '');
            endpoint = endpoint.replace(/\/v1(\/.*)?$/, '');
            url = `${endpoint}/v1/chat/completions`;
            headers = { 'Content-Type': 'application/json' };
            body = {
                model: model,
                messages: messages,
                stream: true
            };
            if (!useProviderDefaults) {
                body.temperature = temp;
                body.max_tokens = maxTok;
            }
        } else if (provider === 'custom') {
            url = customEndpoint;
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
            body = {
                model: model,
                messages: messages,
                stream: true
            };
            if (!useProviderDefaults) {
                body.temperature = temp;
                body.max_tokens = maxTok;
            }
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body),
            signal: app?.generationAbortController?.signal
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(formatAPIError(provider, response.status, errorText));
        }

        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json') && !contentType?.includes('text/event-stream')) {
            const data = await response.json();
            let content = null;
            let reasoningContent = null;
            let finishReason = null;

            if (provider === 'openrouter' || provider === 'openai' || provider === 'nanogpt' || provider === 'lmstudio' || provider === 'custom' || provider === 'deepseek') {
                const message = data.choices?.[0]?.message;
                content = message?.content;
                reasoningContent = message?.reasoning_content;
                finishReason = data.choices?.[0]?.finish_reason;
            } else if (provider === 'anthropic') {
                content = data.content?.[0]?.text;
                finishReason = data.stop_reason;
            } else if (provider === 'google') {
                content = data.candidates?.[0]?.content?.parts?.[0]?.text;
                finishReason = data.candidates?.[0]?.finishReason;
            }

            appendReasoning(app, reasoningContent);

            if (content) {
                const words = content.split(/(\s+)/);
                for (const word of words) {
                    onToken(word);
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            } else if (reasoningContent) {
                throw createNoContentError(app, provider);
            }
            return { finishReason };
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let hasReceivedContent = false;
        let finishReason = null;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.trim()) continue;

                try {
                    let jsonStr = line;
                    if (line.startsWith('data: ')) jsonStr = line.slice(6);
                    if (jsonStr === '[DONE]') {
                        if (!hasReceivedContent) {
                            throw createNoContentError(app, provider);
                        }
                        return { finishReason };
                    }

                    const data = JSON.parse(jsonStr);

                    let token = null;
                    if (provider === 'openrouter' || provider === 'openai' || provider === 'nanogpt' || provider === 'lmstudio' || provider === 'custom' || provider === 'deepseek') {
                        if (data.choices?.[0]?.finish_reason) {
                            finishReason = data.choices[0].finish_reason;
                        }
                        const delta = data.choices?.[0]?.delta;
                        if (delta) {
                            appendReasoning(app, delta.reasoning_content);
                            if (delta.content) token = delta.content;
                        }
                        if (!token && data.choices?.[0]?.message?.content) {
                            token = data.choices[0].message.content;
                        }
                    } else if (provider === 'anthropic') {
                        if (data.type === 'content_block_delta') token = data.delta?.text;
                    } else if (provider === 'google') {
                        token = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    }

                    if (token) {
                        hasReceivedContent = true;
                        onToken(token);
                    }
                } catch (e) { /* ignore */ }
            }
        }

        if (!hasReceivedContent) {
            throw createNoContentError(app, provider);
        }

        return { finishReason };
    }

    async function loadPromptHistory(app) {
        if (!app.currentProject) {
            app.promptHistoryList = [];
            return;
        }
        try {
            const history = await db.promptHistory
                .where('projectId')
                .equals(app.currentProject.id)
                .reverse()
                .sortBy('timestamp');
            app.promptHistoryList = history;
        } catch (e) {
            console.error('Failed to load prompt history:', e);
            app.promptHistoryList = [];
        }
    }

    async function generateFromBeat(app) {
        if (!app.beatInput || app.aiStatus !== 'ready') return;
        app.isGenerating = true;
        app.generationAbortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
        try {
            app.lastBeat = app.beatInput;

            const proseInfo = await app.resolveProsePromptInfo();
            const prosePromptText = proseInfo && proseInfo.text ? proseInfo.text : null;
            const systemPromptText = proseInfo && proseInfo.systemText ? proseInfo.systemText : null;

            const panelContext = await app.buildContextFromPanel();

            let beatCompEntries = [];
            let beatSceneSummaries = [];
            try { beatCompEntries = await app.resolveCompendiumEntriesFromBeat(app.beatInput || ''); } catch (e) { beatCompEntries = []; }
            try { beatSceneSummaries = await app.resolveSceneSummariesFromBeat(app.beatInput || ''); } catch (e) { beatSceneSummaries = []; }

            const compMap = new Map();
            panelContext.compendiumEntries.forEach(e => compMap.set(e.id, e));
            beatCompEntries.forEach(e => compMap.set(e.id, e));
            const compEntries = Array.from(compMap.values());

            const sceneMap = new Map();
            panelContext.sceneSummaries.forEach(s => sceneMap.set(s.title, s));
            beatSceneSummaries.forEach(s => sceneMap.set(s.title, s));
            const sceneSummaries = Array.from(sceneMap.values());

            const genOpts = {
                povCharacter: app.povCharacter,
                pov: app.pov,
                tense: app.tense,
                prosePrompt: prosePromptText,
                systemPrompt: systemPromptText,
                compendiumEntries: compEntries,
                sceneSummaries: sceneSummaries
            };

            let prompt = buildPrompt(app.beatInput, app.currentScene?.content || '', genOpts);

            try {
                await db.promptHistory.add({
                    id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 9),
                    projectId: app.currentProject?.id,
                    sceneId: app.currentScene?.id,
                    timestamp: new Date(),
                    beat: app.beatInput,
                    prompt: typeof prompt === 'object' && prompt.asString ? prompt.asString() : String(prompt)
                });
            } catch (e) {
                console.warn('Failed to save prompt history:', e);
            }

            const prevLen = app.currentScene ? (app.currentScene.content ? app.currentScene.content.length : 0) : 0;
            app.lastGenStart = prevLen;
            app.lastGenText = '';
            app.lastReasoningText = '';
            app.reasoningInProgress = false;
            app.showReasoningModal = false;
            app.showGenActions = false;

            await streamGeneration(prompt, (token) => {
                app.currentScene.content += token;
                app.lastGenText += token;
            }, app);

            app.showGenActions = true;
            app.showGeneratedHighlight = true;

            app.$nextTick(() => {
                try {
                    const ta = document.querySelector('.editor-textarea');
                    if (ta) {
                        ta.focus();
                        const start = app.lastGenStart || 0;
                        const end = (app.currentScene && app.currentScene.content) ? app.currentScene.content.length : start;
                        ta.selectionStart = start;
                        ta.selectionEnd = end;
                        const lineHeight = parseInt(window.getComputedStyle(ta).lineHeight) || 20;
                        ta.scrollTop = Math.max(0, Math.floor(start / 80) * lineHeight);
                    }
                } catch (e) { }
                setTimeout(() => {
                    app.showGeneratedHighlight = false;
                }, 5000);
            });

            app.beatInput = '';
            await app.saveScene();
        } catch (error) {
            if (isAbortError(error)) {
                if (app.lastGenText) {
                    app.showGenActions = true;
                    app.showGeneratedHighlight = true;
                    await app.saveScene();
                }
                return;
            }
            console.error('Generation error:', error);
            alert('Failed to generate text. Make sure llama-server is running.\n\nError: ' + (error && error.message ? error.message : error));
        } finally {
            app.isGenerating = false;
            app.reasoningInProgress = false;
            app.generationAbortController = null;
        }
    }

    window.Generation = {
        buildPrompt,
        streamGeneration,
        loadPromptHistory,
        generateFromBeat
    };
})();
