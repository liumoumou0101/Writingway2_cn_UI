const path = require('path');
const http = require('http');
const https = require('https');
const settingsStore = require('../storage/settings-store');
const SettingsSchema = require('../../src/core/settings/settings-schema');

function projectSaveRoot(dataRoot, settings) {
  return (settings && settings.projectSaveLocation) || path.join(dataRoot, 'projects');
}

function backupRoot(dataRoot, settings) {
  return (settings && settings.backupLocation) || path.join(projectSaveRoot(dataRoot, settings), 'backups');
}

async function readSettings(dataRoot) {
  return settingsStore.readSettings(dataRoot);
}

async function writeSettings(dataRoot, settingsInput) {
  return settingsStore.writeSettings(dataRoot, settingsInput);
}

async function updateSettings(dataRoot, patch = {}) {
  const current = await readSettings(dataRoot);
  const providerPatch = { ...(patch.providerSettings || {}) };
  if (Object.prototype.hasOwnProperty.call(providerPatch, 'apiKey') && !String(providerPatch.apiKey || '').trim() && current.providerSettings.apiKey) {
    providerPatch.apiKey = current.providerSettings.apiKey;
  }
  return writeSettings(dataRoot, {
    ...current,
    ...patch,
    providerSettings: {
      ...current.providerSettings,
      ...providerPatch
    },
    generationDefaults: {
      ...current.generationDefaults,
      ...(patch.generationDefaults || {})
    },
    localModelSettings: {
      ...current.localModelSettings,
      ...(patch.localModelSettings || {})
    }
  });
}

function publicSettings(settingsInput) {
  return SettingsSchema.publicSettings(settingsInput);
}

function runtimeProviderConfig(settingsInput, extras = {}) {
  return SettingsSchema.providerRuntimeConfig(settingsInput, extras);
}

function requestUrl(url, { method = 'GET', headers = {}, body = '', timeoutMs = 2500 } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const request = client.request(parsed, { method, headers, timeout: timeoutMs }, (response) => {
      response.resume();
      response.on('end', () => resolve({ statusCode: response.statusCode || 0 }));
    });
    request.on('timeout', () => {
      request.destroy(new Error('Connection timed out'));
    });
    request.on('error', reject);
    if (body) request.write(body);
    request.end();
  });
}

async function testProvider(settingsInput, options = {}) {
  const settings = SettingsSchema.normalizeDesktopSettings(settingsInput);
  const config = runtimeProviderConfig(settings);
  const live = !!options.live;

  if (config.mode === 'local') {
    if (!config.endpoint) {
      return { ok: false, mode: 'local', error: 'Local endpoint is required.' };
    }
    if (!live) {
      return { ok: true, mode: 'local', checked: 'configuration', endpoint: config.endpoint };
    }
    try {
      const result = await requestUrl(config.endpoint.replace(/\/+$/, '/health'));
      return { ok: result.statusCode < 500, mode: 'local', endpoint: config.endpoint, statusCode: result.statusCode };
    } catch (error) {
      return { ok: false, mode: 'local', endpoint: config.endpoint, error: error.message };
    }
  }

  if (!config.endpoint) {
    return { ok: false, mode: 'api', provider: config.provider, error: 'API endpoint is required.' };
  }
  if (!config.apiKey) {
    return { ok: false, mode: 'api', provider: config.provider, error: 'API key is required.' };
  }
  if (!live) {
    return { ok: true, mode: 'api', provider: config.provider, checked: 'configuration', endpoint: config.endpoint };
  }

  try {
    const body = JSON.stringify({
      model: config.model || 'model-check',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
      stream: false
    });
    const result = await requestUrl(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body
    });
    return { ok: result.statusCode >= 200 && result.statusCode < 300, mode: 'api', provider: config.provider, statusCode: result.statusCode };
  } catch (error) {
    return { ok: false, mode: 'api', provider: config.provider, error: error.message };
  }
}

module.exports = {
  readSettings,
  writeSettings,
  updateSettings,
  publicSettings,
  runtimeProviderConfig,
  projectSaveRoot,
  backupRoot,
  testProvider
};
