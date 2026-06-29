const assert = require('assert');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { startDesktopServers } = require('../desktop/local-server');
const settingsService = require('../desktop/services/settings-service');
const SettingsSchema = require('../src/core/settings/settings-schema');

(async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'writingway-settings-test-'));
  let servers = null;

  try {
    const normalized = SettingsSchema.normalizeDesktopSettings({
      providerSettings: {
        mode: 'api',
        provider: 'openai-compatible',
        endpoint: 'https://example.test/v1/chat/completions',
        apiKey: 'secret',
        model: 'test-model'
      },
      generationDefaults: {
        temperature: 1.1,
        maxTokens: 1234
      }
    });
    assert.strictEqual(normalized.providerSettings.mode, 'api');
    assert.strictEqual(normalized.providerSettings.hasApiKey, true);
    assert.strictEqual(normalized.generationDefaults.maxTokens, 1234);

    const saved = await settingsService.writeSettings(dataRoot, normalized);
    assert.strictEqual(saved.providerSettings.model, 'test-model');

    const updated = await settingsService.updateSettings(dataRoot, {
      providerSettings: { model: 'second-model', apiKey: '' },
      generationDefaults: { maxTokens: 777 }
    });
    assert.strictEqual(updated.providerSettings.model, 'second-model');
    assert.strictEqual(updated.providerSettings.apiKey, 'secret', 'blank apiKey should preserve existing secret');
    assert.strictEqual(updated.generationDefaults.maxTokens, 777);

    const publicSettings = settingsService.publicSettings(updated);
    assert.strictEqual(publicSettings.providerSettings.apiKey, '');
    assert.strictEqual(publicSettings.providerSettings.hasApiKey, true);

    const check = await settingsService.testProvider(updated, { live: false });
    assert.strictEqual(check.ok, true);
    assert.strictEqual(check.checked, 'configuration');

    servers = await startDesktopServers({
      appRoot: path.resolve(__dirname, '..'),
      dataRoot
    });

    const getResponse = await fetch('http://127.0.0.1:8000/api/settings');
    const getBody = await getResponse.json();
    assert.ok(getResponse.ok && getBody.ok, 'GET /api/settings should return ok');
    assert.strictEqual(getBody.settings.providerSettings.apiKey, '', 'settings API should not expose raw API key');
    assert.strictEqual(getBody.settings.providerSettings.hasApiKey, true);

    const postResponse = await fetch('http://127.0.0.1:8000/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          providerSettings: {
            mode: 'local',
            provider: 'lmstudio',
            endpoint: 'http://localhost:8080',
            model: 'local-test'
          },
          generationDefaults: {
            temperature: 0.65,
            maxTokens: 512,
            useProviderDefaults: false
          }
        }
      })
    });
    const postBody = await postResponse.json();
    assert.ok(postResponse.ok && postBody.ok, 'POST /api/settings should return ok');
    assert.strictEqual(postBody.runtimeProvider.mode, 'local');
    assert.strictEqual(postBody.runtimeProvider.endpoint, 'http://localhost:8080');
    assert.strictEqual(postBody.runtimeProvider.maxTokens, 512);

    const testResponse = await fetch('http://127.0.0.1:8000/api/settings/test-provider', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ live: false })
    });
    const testBody = await testResponse.json();
    assert.ok(testResponse.ok && testBody.ok, 'provider configuration test should pass for local defaults');

    console.log('Settings service test passed.');
  } finally {
    if (servers) servers.close();
    await fs.rm(dataRoot, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error('Settings service test failed:', error && error.stack ? error.stack : error);
  process.exit(1);
});
