(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory(typeof globalThis !== 'undefined' ? globalThis : global);
    } else {
        root.WritingwayProviderStream = factory(root);
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
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

    async function streamOpenAICompatible(messages, onToken, config = {}) {
        const isDeepSeek = config.provider === 'deepseek';
        const endpoint = config.endpoint || config.aiEndpoint || (isDeepSeek ? 'https://api.deepseek.com/chat/completions' : '');
        if (!endpoint) throw new Error('API endpoint is required.');
        const deepSeekModel = isDeepSeek ? resolveDeepSeekModel(config.model || config.aiModel) : null;
        const body = {
            model: deepSeekModel ? deepSeekModel.realModel : (config.model || config.aiModel || 'gpt-4o-mini'),
            messages,
            stream: deepSeekModel ? !deepSeekModel.enableThinking : true
        };
        if (deepSeekModel) {
            body.thinking = { type: deepSeekModel.enableThinking ? 'enabled' : 'disabled' };
            if (deepSeekModel.enableThinking) body.reasoning_effort = 'high';
        }
        if (!config.useProviderDefaults && !(deepSeekModel && deepSeekModel.enableThinking)) {
            body.temperature = config.temperature || 0.8;
            body.max_tokens = config.maxTokens || 300;
        }
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
            },
            body: JSON.stringify(body),
            signal: config.signal
        });
        if (!response.ok) throw new Error(`API generation returned ${response.status}`);

        if (deepSeekModel && deepSeekModel.enableThinking) {
            const data = await response.json();
            const message = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message : {};
            const text = message.content || message.reasoning_content || '';
            if (text) onToken(text);
            return;
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
                if (!line.startsWith('data: ')) continue;
                const payload = line.slice(6).trim();
                if (!payload || payload === '[DONE]') continue;
                const data = JSON.parse(payload);
                const token = data.choices && data.choices[0] && data.choices[0].delta
                    ? (data.choices[0].delta.content || '')
                    : '';
                if (token) onToken(token);
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
        messagesToChatML,
        streamGeneration
    };
});
