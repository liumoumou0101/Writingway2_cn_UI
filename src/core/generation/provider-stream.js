(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(typeof globalThis !== 'undefined' ? globalThis : global);
    } else {
        root.WritingwayProviderStream = factory(root);
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
    var MODEL_CAPABILITIES = {
        'deepseek-v4-flash': {
            label: 'DeepSeek V4 Flash',
            thinkingSupported: true,
            contextNote: '1M 上下文，快速响应',
            thinkingDisabledParams: ['temperature', 'top_p', 'presence_penalty', 'frequency_penalty']
        },
        'deepseek-v4-pro': {
            label: 'DeepSeek V4 Pro',
            thinkingSupported: true,
            contextNote: '1M 上下文，深度推理',
            thinkingDisabledParams: ['temperature', 'top_p', 'presence_penalty', 'frequency_penalty']
        }
    };

    function getModelCapability(model) {
        return MODEL_CAPABILITIES[model] || null;
    }

    function messagesToChatML(messages) {
        if (!Array.isArray(messages)) return '';
        let result = '';
        for (const message of messages) {
            result += `<|im_start|>${message.role}\n${message.content}<|im_end|>\n`;
        }
        return `${result}<|im_start|>assistant\n`;
    }

    async function streamLocal(prompt, onToken, config = {}) {
        const endpoint = config.endpoint || config.aiEndpoint || 'http://localhost:8080';
        const body = {
            prompt,
            top_p: 0.9,
            stop: ['<|im_end|>', '<|endoftext|>', '\n\n\n\n', 'USER:', 'HUMAN:'],
            stream: true
        };
        if (!config.useProviderDefaults) {
            body.n_predict = config.maxTokens || 300;
            body.temperature = config.temperature || 0.8;
        }

        const response = await fetch(`${endpoint}/completion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: config.signal
        });
        if (!response.ok) throw new Error(`Local generation server returned ${response.status}`);

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
                if (!line.startsWith('data: ')) continue;
                const payload = line.slice(6).trim();
                if (!payload || payload === '[DONE]') continue;
                try {
                    const data = JSON.parse(payload);
                    if (data.content) onToken(data.content);
                    if (data.stop) return;
                } catch (error) {
                    // Ignore malformed streaming chunks.
                }
            }
        }
    }

    function resolveDeepSeekModel(model) {
        const selectedModel = String(model || 'deepseek-v4-pro').trim();
        const legacyModels = {
            'deepseek-chat': { realModel: 'deepseek-v4-flash', enableThinking: false },
            'deepseek-reasoner': { realModel: 'deepseek-v4-flash', enableThinking: true }
        };
        if (legacyModels[selectedModel]) return legacyModels[selectedModel];
        if (selectedModel === 'deepseek-v4-pro-thinking') return { realModel: 'deepseek-v4-pro', enableThinking: true };
        if (selectedModel === 'deepseek-v4-flash-thinking') return { realModel: 'deepseek-v4-flash', enableThinking: true };
        return { realModel: selectedModel, enableThinking: false };
    }

    function isThinkingParamDisabled(realModel, paramName) {
        var cap = getModelCapability(realModel);
        if (!cap) return false;
        return cap.thinkingDisabledParams.indexOf(paramName) !== -1;
    }

    function sanitizeStreamBody(body, realModel, enableThinking) {
        if (!enableThinking) return body;
        var sanitized = {};
        for (var key in body) {
            if (!body.hasOwnProperty(key)) continue;
            if (isThinkingParamDisabled(realModel, key)) continue;
            sanitized[key] = body[key];
        }
        return sanitized;
    }

    async function streamOpenAICompatible(messages, onToken, config = {}) {
        const isDeepSeek = config.provider === 'deepseek';
        const endpoint = config.endpoint || config.aiEndpoint || (isDeepSeek ? 'https://api.deepseek.com/chat/completions' : '');
        if (!endpoint) throw new Error('API endpoint is required.');

        var enableThinking = false;
        var realModel = null;

        if (isDeepSeek) {
            if (config.enableThinking !== undefined) {
                enableThinking = !!config.enableThinking;
                realModel = config.model || config.aiModel || 'deepseek-v4-pro';
            } else {
                var resolved = resolveDeepSeekModel(config.model || config.aiModel);
                realModel = resolved.realModel;
                enableThinking = resolved.enableThinking;
            }
        }

        var body = {
            model: realModel || (config.model || config.aiModel || 'gpt-4o-mini'),
            messages: messages,
            stream: true
        };

        if (isDeepSeek) {
            if (enableThinking) {
                body.thinking = { type: 'enabled' };
            } else {
                body.thinking = { type: 'disabled' };
            }
        }

        if (!config.useProviderDefaults) {
            body.temperature = config.temperature || 0.8;
            body.max_tokens = config.maxTokens || 300;
        }

        if (isDeepSeek) {
            body = sanitizeStreamBody(body, realModel, enableThinking);
        }

        var response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
            },
            body: JSON.stringify(body),
            signal: config.signal
        });
        if (!response.ok) throw new Error(`API generation returned ${response.status}`);

        var isThinking = isDeepSeek && enableThinking;

        if (!response.body || !response.body.getReader) {
            var data = await response.json();
            var message = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message : {};
            var reasoning = message.reasoning_content || '';
            var text = message.content || '';
            if (reasoning) onToken(reasoning, { type: 'reasoning' });
            if (text) onToken(text, { type: 'content' });
            return;
        }

        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';
        var hadReasoning = false;
        var hadContent = false;
        while (true) {
            var readResult = await reader.read();
            if (readResult.done) break;
            buffer += decoder.decode(readResult.value, { stream: true });
            var lines = buffer.split('\n');
            buffer = lines.pop();
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (!line.startsWith('data: ')) continue;
                var payload = line.slice(6).trim();
                if (!payload || payload === '[DONE]') continue;
                var chunk = JSON.parse(payload);
                var delta = chunk.choices && chunk.choices[0] && chunk.choices[0].delta ? chunk.choices[0].delta : {};

                if (isThinking && delta.reasoning_content) {
                    hadReasoning = true;
                    onToken(delta.reasoning_content, { type: 'reasoning' });
                }

                var content = delta.content || '';
                if (content) {
                    hadContent = true;
                    onToken(content, isThinking ? { type: 'content' } : undefined);
                }
            }
        }
    }

    async function streamGeneration(prompt, onToken, config = {}) {
        if (typeof root.__writingwayNativeGenerationStub === 'function') {
            return root.__writingwayNativeGenerationStub(prompt, onToken, config);
        }

        const messages = prompt && Array.isArray(prompt.messages) ? prompt.messages : null;
        const mode = config.mode || config.aiMode || 'local';
        if (mode === 'api') {
            return streamOpenAICompatible(messages || [{ role: 'user', content: String(prompt) }], onToken, config);
        }
        return streamLocal(messages ? messagesToChatML(messages) : String(prompt && prompt.asString ? prompt.asString() : prompt), onToken, config);
    }

    return {
        MODEL_CAPABILITIES: MODEL_CAPABILITIES,
        getModelCapability: getModelCapability,
        messagesToChatML: messagesToChatML,
        streamGeneration: streamGeneration
    };
});
