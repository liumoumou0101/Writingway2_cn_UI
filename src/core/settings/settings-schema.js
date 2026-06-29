(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.WritingwaySettingsSchema = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const PROVIDER_MODES = Object.freeze(['local', 'api']);
    const PROVIDERS = Object.freeze([
        'lmstudio',
        'ollama',
        'openai',
        'openrouter',
        'anthropic',
        'google',
        'deepseek',
        'nanogpt',
        'openai-compatible',
        'custom'
    ]);
    const PROVIDER_DEFAULT_ENDPOINTS = Object.freeze({
        deepseek: 'https://api.deepseek.com/chat/completions'
    });

    function cleanString(value, fallback = '') {
        const text = value === null || value === undefined ? fallback : String(value);
        return text.trim();
    }

    function finiteNumber(value, fallback, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return fallback;
        return Math.max(min, Math.min(max, number));
    }

    function normalizeProviderSettings(input = {}) {
        const mode = PROVIDER_MODES.includes(input.mode || input.aiMode) ? (input.mode || input.aiMode) : 'local';
        const provider = PROVIDERS.includes(input.provider || input.aiProvider) ? (input.provider || input.aiProvider) : (mode === 'local' ? 'lmstudio' : 'openai-compatible');
        const defaultEndpoint = mode === 'local' ? 'http://localhost:8080' : (PROVIDER_DEFAULT_ENDPOINTS[provider] || '');
        const endpointInput = cleanString(input.endpoint || input.aiEndpoint || '');
        const shouldUseProviderDefaultEndpoint = mode === 'api'
            && !!PROVIDER_DEFAULT_ENDPOINTS[provider]
            && (!endpointInput || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(endpointInput));
        const defaultModel = provider === 'deepseek' ? 'deepseek-v4-pro' : '';
        return {
            mode,
            provider,
            apiKey: cleanString(input.apiKey || input.aiApiKey),
            model: cleanString(input.model || input.aiModel || defaultModel),
            endpoint: shouldUseProviderDefaultEndpoint ? defaultEndpoint : cleanString(endpointInput || defaultEndpoint),
            baseUrl: cleanString(input.baseUrl),
            organization: cleanString(input.organization),
            hasApiKey: !!input.hasApiKey || !!(input.apiKey || input.aiApiKey),
            updatedAt: input.updatedAt || ''
        };
    }

    function normalizeGenerationDefaults(input = {}) {
        return {
            temperature: finiteNumber(input.temperature, 0.8, 0, 2),
            maxTokens: Math.round(finiteNumber(input.maxTokens, 300, 1, 200000)),
            useProviderDefaults: !!input.useProviderDefaults
        };
    }

    function normalizeLocalModelSettings(input = {}) {
        return {
            endpoint: cleanString(input.endpoint || input.aiEndpoint || 'http://localhost:8080'),
            model: cleanString(input.model || input.aiModel),
            autoStart: !!input.autoStart,
            llamaVariant: cleanString(input.llamaVariant || 'cpu')
        };
    }

    function normalizeDesktopSettings(input = {}) {
        const providerInput = input.providerSettings || input.provider || input.ai || input;
        const generationInput = input.generationDefaults || input.generation || input;
        const localInput = input.localModelSettings || input.localModel || input;
        return {
            version: 1,
            projectSaveLocation: cleanString(input.projectSaveLocation),
            backupLocation: cleanString(input.backupLocation),
            providerSettings: normalizeProviderSettings(providerInput),
            generationDefaults: normalizeGenerationDefaults(generationInput),
            localModelSettings: normalizeLocalModelSettings(localInput),
            updatedAt: input.updatedAt || ''
        };
    }

    function providerRuntimeConfig(settingsInput = {}, extras = {}) {
        const settings = normalizeDesktopSettings(settingsInput);
        const provider = settings.providerSettings;
        const defaults = settings.generationDefaults;
        const local = settings.localModelSettings;
        const mode = provider.mode;
        return {
            mode,
            provider: provider.provider,
            apiKey: provider.apiKey,
            model: provider.model || local.model,
            endpoint: mode === 'local' ? (local.endpoint || provider.endpoint) : provider.endpoint,
            baseUrl: provider.baseUrl,
            organization: provider.organization,
            temperature: defaults.temperature,
            maxTokens: defaults.maxTokens,
            useProviderDefaults: defaults.useProviderDefaults,
            ...extras
        };
    }

    function publicSettings(settingsInput = {}) {
        const settings = normalizeDesktopSettings(settingsInput);
        return {
            ...settings,
            providerSettings: {
                ...settings.providerSettings,
                hasApiKey: !!settings.providerSettings.apiKey,
                apiKey: ''
            }
        };
    }

    return {
        PROVIDER_MODES,
        PROVIDERS,
        normalizeProviderSettings,
        normalizeGenerationDefaults,
        normalizeLocalModelSettings,
        normalizeDesktopSettings,
        providerRuntimeConfig,
        publicSettings
    };
});
