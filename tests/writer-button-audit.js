const assert = require('assert');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const { startDesktopServers } = require('../desktop/local-server');
const projectService = require('../desktop/services/project-service');

async function submitNativeName(page, value) {
  await page.waitForFunction(() => {
    const modal = document.querySelector('[data-native-name-modal]');
    return modal && !modal.hidden;
  });
  await page.fill('[data-native-name-input]', value);
  await page.locator('[data-native-name-form] button[type="submit"]').click();
  await page.waitForFunction(() => {
    const modal = document.querySelector('[data-native-name-modal]');
    return modal && modal.hidden;
  });
}

(async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'writingway-writer-audit-'));
  let servers = null;
  let browser = null;

  try {
    await projectService.createProject(dataRoot, {
      id: 'writer-audit-project',
      title: 'Writer Audit Project',
      description: 'Button audit project.',
      chapters: [
        { id: 'chapter-1', title: 'Opening', order: 0 },
        { id: 'chapter-2', title: 'Middle', order: 1 }
      ],
      scenes: [
        {
          id: 'scene-1',
          chapterId: 'chapter-1',
          title: 'First Scene',
          summary: 'Initial summary.',
          content: 'First scene original text.',
          order: 0
        },
        {
          id: 'scene-2',
          chapterId: 'chapter-1',
          title: 'Second Scene',
          content: 'Second scene body.',
          order: 1
        }
      ],
      compendium: [
        {
          id: 'entry-1',
          projectId: 'writer-audit-project',
          title: 'Audit Character',
          type: 'character',
          tags: ['audit-tag'],
          content: 'A test character used by the writer audit.'
        }
      ]
    });

    servers = await startDesktopServers({
      appRoot: path.resolve(__dirname, '..'),
      dataRoot,
      revealPath: async () => ''
    });

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const browserMessages = [];
    page.on('console', (message) => {
      if (['error', 'warning'].includes(message.type())) browserMessages.push(`${message.type()}: ${message.text()}`);
    });
    page.on('pageerror', (error) => browserMessages.push(`pageerror: ${error.message}`));
    await page.goto('http://127.0.0.1:8000/desktop.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.desktop-project-card');
    await page.focus('.desktop-project-card');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('[data-native-project-title]').textContent.includes('Writer Audit Project'));

    await page.dblclick('[data-native-scene-title]');
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Inline Audit Title');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('[data-native-scene-title]').textContent.includes('Inline Audit Title'));
    await page.waitForFunction(() => document.querySelector('[data-native-save-status]').textContent.includes('标题未保存'));
    const statusSpan = await page.locator('[data-native-save-status]');
    assert.strictEqual(await statusSpan.getAttribute('data-tone'), 'warn', 'unsaved title status should use warn tone');

    await page.click('[data-toggle-rail]');
    await page.waitForFunction(() => document.querySelector('#desktop-root').classList.contains('is-rail-collapsed'));
    await page.click('[data-toggle-rail]');
    await page.waitForFunction(() => !document.querySelector('#desktop-root').classList.contains('is-rail-collapsed'));

    await page.click('[data-native-toggle-outline]');
    await page.waitForFunction(() => document.querySelector('[data-native-writer]').classList.contains('is-outline-collapsed'));
    await page.click('[data-native-toggle-outline]');
    await page.waitForFunction(() => !document.querySelector('[data-native-writer]').classList.contains('is-outline-collapsed'));

    await page.click('[data-native-toggle-assistant]');
    await page.waitForFunction(() => document.querySelector('[data-native-writer]').classList.contains('is-assistant-collapsed'));
    await page.click('[data-native-toggle-assistant]');
    await page.waitForFunction(() => !document.querySelector('[data-native-writer]').classList.contains('is-assistant-collapsed'));

    await page.click('[data-native-focus-mode]');
    await page.waitForFunction(() => document.querySelector('[data-native-writer]').classList.contains('is-focus-mode'));
    await page.click('[data-native-focus-mode]');
    await page.waitForFunction(() => !document.querySelector('[data-native-writer]').classList.contains('is-focus-mode'));
    await page.click('[data-native-assistant-placement]');
    await page.waitForFunction(() => document.querySelector('[data-native-writer]').classList.contains('is-assistant-bottom'));
    await page.click('[data-native-assistant-placement]');
    await page.waitForFunction(() => !document.querySelector('[data-native-writer]').classList.contains('is-assistant-bottom'));
    await page.click('[data-native-toggle-typography]');
    await page.waitForFunction(() => !document.querySelector('[data-native-typography]').hidden);
    await page.evaluate(() => {
      const fontSize = document.querySelector('[data-native-editor-font-size]');
      const lineHeight = document.querySelector('[data-native-editor-line-height]');
      const textWidth = document.querySelector('[data-native-editor-text-width]');
      const paragraphSpacing = document.querySelector('[data-native-editor-paragraph-spacing]');
      fontSize.value = '20';
      fontSize.dispatchEvent(new Event('input', { bubbles: true }));
      lineHeight.value = '2';
      lineHeight.dispatchEvent(new Event('input', { bubbles: true }));
      textWidth.value = '900';
      textWidth.dispatchEvent(new Event('input', { bubbles: true }));
      paragraphSpacing.value = '0.5';
      paragraphSpacing.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForFunction(() => {
      const editor = document.querySelector('[data-native-scene-editor]');
      const style = window.getComputedStyle(editor);
      return document.querySelector('[data-native-editor-font-size-value]').textContent === '20'
        && document.querySelector('[data-native-editor-line-height-value]').textContent === '2.00'
        && document.querySelector('[data-native-editor-text-width-value]').textContent === '900'
        && document.querySelector('[data-native-editor-paragraph-spacing-value]').textContent === '0.5'
        && style.fontSize === '20px'
        && style.paddingTop === '44px';
    });
    await page.selectOption('[data-native-editor-font-family]', 'serif');
    await page.waitForFunction(() => {
      const editor = document.querySelector('[data-native-scene-editor]');
      const style = window.getComputedStyle(editor);
      return style.fontFamily && style.fontFamily.includes('SimSun');
    });
    await page.selectOption('[data-native-editor-font-family]', 'system');
    await page.waitForFunction(() => {
      const editor = document.querySelector('[data-native-scene-editor]');
      const style = window.getComputedStyle(editor);
      return style.fontFamily && style.fontFamily.includes('Microsoft YaHei');
    });
    const wordGoalInput = page.locator('[data-native-editor-word-goal]');
    await wordGoalInput.fill('800');
    await wordGoalInput.evaluate((field) => field.dispatchEvent(new Event('input', { bubbles: true })));
    await page.waitForFunction(() => {
      const stats = document.querySelector('[data-native-editor-stats]');
      return stats && /\d+\s*\/\s*800\s*字/.test(stats.textContent);
    });
    await wordGoalInput.fill('0');
    await wordGoalInput.evaluate((field) => field.dispatchEvent(new Event('input', { bubbles: true })));
    await page.waitForFunction(() => {
      const stats = document.querySelector('[data-native-editor-stats]');
      return stats && !/\//.test(stats.textContent) && stats.textContent.includes('字');
    });
    await page.click('[data-native-toggle-typography]');
    await page.waitForFunction(() => document.querySelector('[data-native-typography]').hidden);

    await page.click('[data-native-add-scene]');
    await submitNativeName(page, 'Audit Added Scene');
    await page.waitForFunction(() => document.querySelector('[data-native-scene-title]').textContent.includes('Audit Added Scene'));

    await page.click('[data-native-panel-tab="structure"]');
    await page.click('[data-native-move-scene-up]');
    await page.waitForFunction(() => document.querySelector('[data-native-save-status]').textContent.includes('未保存'));
    const unsavedStatus = await page.locator('[data-native-save-status]');
    assert.strictEqual(await unsavedStatus.getAttribute('data-tone'), 'warn', 'unsaved status should use warn tone');
    await page.click('[data-native-move-scene-down]');
    await page.waitForFunction(() => document.querySelector('[data-native-save-status]').textContent.includes('未保存'));

    await page.click('[data-native-add-chapter]');
    await submitNativeName(page, 'Audit Chapter');
    await page.waitForFunction(() => document.querySelector('[data-native-chapter-title]').textContent.includes('Audit Chapter'));

    await page.click('[data-native-panel-tab="metadata"]');
    await page.fill('[data-native-scene-summary]', 'Audit summary.');
    await page.fill('[data-native-scene-tags]', 'audit, ui');
    await page.fill('[data-native-scene-pov]', 'Mira');
    await page.selectOption('[data-native-scene-tense]', 'present');
    await page.waitForFunction(() => document.querySelector('[data-native-save-status]').textContent.includes('未保存'));
    await page.fill('[data-native-scene-editor]', 'Summary source text for the audit scene.');
    await page.evaluate(() => {
      window.__writingwayNativeGenerationStub = async (prompt, onToken) => {
        for (const token of ['Generated', ' scene', ' summary.']) {
          await new Promise((resolve) => setTimeout(resolve, 2));
          onToken(token);
        }
      };
    });
    await page.click('[data-native-generate-scene-summary]');
    await page.waitForFunction(() => document.querySelector('[data-native-scene-summary]').value.includes('Generated scene summary.'));

    await page.click('[data-native-panel-tab="structure"]');
    await page.click('[data-native-rename-scene]');
    await submitNativeName(page, 'Renamed Audit Scene');
    await page.waitForFunction(() => document.querySelector('[data-native-scene-title]').textContent.includes('Renamed Audit Scene'));

    await page.click('[data-native-rename-chapter]');
    await submitNativeName(page, 'Renamed Audit Chapter');
    await page.waitForFunction(() => document.querySelector('[data-native-chapter-title]').textContent.includes('Renamed Audit Chapter'));
    await page.click('[data-native-save-scene]');
    await page.waitForFunction(() => document.querySelector('[data-native-save-status]').textContent.includes('已保存'));

    const includeSceneTitlesCheckbox = await page.$('[data-native-export-include-scene-titles]');
    assert.ok(includeSceneTitlesCheckbox, 'include-scene-titles checkbox should be present');
    const isDefaultChecked = await includeSceneTitlesCheckbox.isChecked();
    assert.strictEqual(isDefaultChecked, true, 'include-scene-titles checkbox should be checked by default');

    await page.evaluate(() => {
      window.__nativeExportHrefs = [];
      const originalClick = HTMLAnchorElement.prototype.click;
      window.__restoreNativeExportClick = () => {
        HTMLAnchorElement.prototype.click = originalClick;
      };
      HTMLAnchorElement.prototype.click = function auditAnchorClick() {
        window.__nativeExportHrefs.push(this.href);
      };
    });
    await page.waitForSelector('[data-native-export-md]:not([disabled])');
    await page.click('[data-native-export-md]');
    await page.waitForFunction(() => window.__nativeExportHrefs.length >= 1);
    let capturedExportUrl = await page.evaluate(() => window.__nativeExportHrefs[window.__nativeExportHrefs.length - 1]);
    assert.ok(capturedExportUrl.includes('includeSceneTitles=true'), 'default export should include scene titles');

    await includeSceneTitlesCheckbox.uncheck();
    await page.click('[data-native-export-md]');
    await page.waitForFunction(() => window.__nativeExportHrefs.length >= 2);
    capturedExportUrl = await page.evaluate(() => window.__nativeExportHrefs[window.__nativeExportHrefs.length - 1]);
    assert.ok(capturedExportUrl.includes('includeSceneTitles=false'), 'unchecked export should exclude scene titles');
    await includeSceneTitlesCheckbox.check();

    await page.click('[data-native-export-md]');
    await page.waitForFunction(() => window.__nativeExportHrefs.length >= 3);
    capturedExportUrl = await page.evaluate(() => window.__nativeExportHrefs[window.__nativeExportHrefs.length - 1]);
    assert.ok(capturedExportUrl.includes('includeSceneTitles=true'), 're-checked export should include scene titles');
    await page.evaluate(() => window.__restoreNativeExportClick());

    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-native-export-md]');
    const download = await downloadPromise;
    assert.ok(download.suggestedFilename().endsWith('.md'), 'Markdown export should download');
    const htmlDownloadPromise = page.waitForEvent('download');
    await page.click('[data-native-export-html]');
    const htmlDownload = await htmlDownloadPromise;
    assert.ok(htmlDownload.suggestedFilename().endsWith('.html'), 'HTML export should download');
    const epubDownloadPromise = page.waitForEvent('download');
    await page.click('[data-native-export-epub]');
    const epubDownload = await epubDownloadPromise;
    assert.ok(epubDownload.suggestedFilename().endsWith('.epub'), 'EPUB export should download');
    const packageDownloadPromise = page.waitForEvent('download');
    await page.click('[data-native-export-package]');
    const packageDownload = await packageDownloadPromise;
    assert.ok(packageDownload.suggestedFilename().endsWith('.writingway-project.zip'), 'project package export should download');

    await page.click('[data-native-panel-tab="search"]');
    await page.fill('[data-native-scene-editor]', 'Audit one. Audit two. Audit three.');
    await page.evaluate(() => {
      window.__writingwayLastUtterance = null;
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
        speaking: false,
        getVoices: () => [{ name: 'Audit Voice', lang: 'zh-CN' }, { name: 'Second Voice', lang: 'en-US' }],
        speak: (utterance) => { window.speechSynthesis.speaking = true; window.__writingwayLastUtterance = utterance; },
        cancel: () => { window.speechSynthesis.speaking = false; },
        addEventListener: () => {},
        removeEventListener: () => {}
      } });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: function SpeechSynthesisUtterance(text) {
        this.text = text;
      } });
    });
    await page.click('[data-native-read-aloud]');
    await page.waitForFunction(() => document.querySelector('[data-native-read-aloud]').hidden);
    await page.click('[data-native-stop-reading]');
    await page.waitForFunction(() => !document.querySelector('[data-native-read-aloud]').hidden);

    await page.click('[data-view-target="settings"]');
    await page.waitForSelector('[data-settings-tts-voice]');
    await page.evaluate(() => {
      var voices = [{ name: 'Audit Voice', lang: 'zh-CN' }, { name: 'Second Voice', lang: 'en-US' }];
      var select = document.querySelector('[data-settings-tts-voice]');
      select.replaceChildren();
      voices.forEach(function (voice) {
        var option = document.createElement('option');
        option.value = voice.name;
        option.textContent = voice.name + ' (' + voice.lang + ')';
        select.appendChild(option);
      });
      select.value = 'Second Voice';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      var rateInput = document.querySelector('[data-settings-tts-rate]');
      rateInput.value = '1.5';
      rateInput.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForFunction(() => document.querySelector('[data-settings-tts-rate-value]').textContent === '1.5');

    await page.click('[data-view-target="writer"]');
    await page.waitForSelector('[data-native-read-aloud]:not([disabled])');
    await page.waitForFunction(() => !document.querySelector('[data-native-read-aloud]').hidden);
    await page.evaluate(() => {
      window.__writingwayLastUtterance = null;
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
        speaking: false,
        getVoices: () => [{ name: 'Audit Voice', lang: 'zh-CN' }, { name: 'Second Voice', lang: 'en-US' }],
        speak: (utterance) => { window.speechSynthesis.speaking = true; window.__writingwayLastUtterance = utterance; },
        cancel: () => { window.speechSynthesis.speaking = false; },
        addEventListener: () => {},
        removeEventListener: () => {}
      } });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: function SpeechSynthesisUtterance(text) {
        this.text = text;
      } });
    });
    await page.click('[data-native-read-aloud]');
    await page.waitForFunction(() => document.querySelector('[data-native-read-aloud]').hidden);
    const ttsUtterance = await page.evaluate(() => {
      var utterance = window.__writingwayLastUtterance;
      if (!utterance) return null;
      return { text: utterance.text, rate: utterance.rate, voiceName: utterance.voice ? utterance.voice.name : null };
    });
    assert.ok(ttsUtterance, 'TTS utterance should be created on second read-aloud');
    assert.strictEqual(ttsUtterance.rate, 1.5, 'TTS utterance rate should match settings value 1.5');
    assert.strictEqual(ttsUtterance.voiceName, 'Second Voice', 'TTS utterance voice should match settings selection');
    await page.click('[data-native-stop-reading]');
    await page.waitForFunction(() => !document.querySelector('[data-native-read-aloud]').hidden);
    await page.fill('[data-native-search]', 'Audit');
    await page.waitForFunction(() => document.querySelectorAll('[data-native-scene-id]').length >= 1);
    // Verify match count status displays
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-native-search-status]');
      return status && /\u7b2c \d+\/\d+ \u4e2a\u5339\u914d/.test(status.textContent);
    });
    // Navigate to next match
    await page.click('[data-native-search-next]');
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-native-search-status]');
      return status && status.textContent.includes('\u7b2c 2/');
    });
    // Wrap to first via next
    await page.click('[data-native-search-next]');
    await page.click('[data-native-search-next]');
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-native-search-status]');
      return status && status.textContent.includes('\u7b2c 1/');
    });
    // Prev wraps to last
    await page.click('[data-native-search-prev]');
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-native-search-status]');
      return status && status.textContent.includes('\u7b2c 3/');
    });
    // Go to match 2 and replace it
    await page.click('[data-native-search-prev]');
    await page.fill('[data-native-replace]', 'Checked');
    await page.click('[data-native-replace-current]');
    await page.waitForFunction(() => document.querySelector('[data-native-scene-editor]').value.includes('Checked'));
    // After replacing one, remaining matches should be 2
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-native-search-status]');
      return status && /\u7b2c \d+\/2 \u4e2a\u5339\u914d/.test(status.textContent);
    });
    // Search for non-existent term shows no matches
    await page.fill('[data-native-search]', 'XYZNOTFOUND');
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-native-search-status]');
      return status && status.textContent === '\u6ca1\u6709\u5339\u914d\u9879';
    });
    // Nav buttons disabled when no matches
    await page.waitForFunction(() => {
      const prev = document.querySelector('[data-native-search-prev]');
      const next = document.querySelector('[data-native-search-next]');
      return prev && prev.disabled && next && next.disabled;
    });
    await page.fill('[data-native-search]', '');
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-native-search-status]');
      return status && status.textContent === '';
    });
    await page.click('[data-native-toggle-specials]');
    await page.locator('[data-native-special-char]').nth(2).click();
    await page.waitForFunction(() => document.querySelector('[data-native-scene-editor]').value.includes('\u2026'));
    await page.fill('[data-native-scene-editor]', 'Auto -- replace.');
    await page.waitForFunction(() => document.querySelector('[data-native-scene-editor]').value.includes('Auto \u2014 replace.'));

    await page.click('[data-native-panel-tab="generate"]');

    // Configure provider to DeepSeek via settings so model control is enabled
    await page.click('[data-view-target="settings"]');
    await page.waitForSelector('[data-settings-mode]');
    await page.selectOption('[data-settings-mode]', 'api');
    await page.selectOption('[data-settings-provider]', 'deepseek');
    await page.fill('[data-settings-endpoint]', 'https://api.deepseek.com/chat/completions');
    await page.fill('[data-settings-model]', 'deepseek-v4-pro');
    await page.fill('[data-settings-api-key]', 'writer-audit-test-key');
    await page.click('[data-settings-form] button[type="submit"]');
    await page.waitForFunction(() => {
      const status = document.querySelector('[data-settings-status]');
      return status && status.dataset.tone === 'ok';
    });
    await page.click('[data-view-target="writer"]');
    // Programmatically set model select value to trigger change event; that calls
    // renderWriterModelControl which reads the updated runtimeProvider and enables the control.
    await page.evaluate(() => {
      var select = document.querySelector('[data-native-model-select]');
      if (select) {
        select.value = 'deepseek-v4-pro';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await page.waitForSelector('[data-native-model-select]:not([disabled])');
    await page.waitForSelector('[data-native-thinking-toggle]:not([disabled])');

    // Verify model options
    var auditOptionCount = await page.evaluate(() => {
      var select = document.querySelector('[data-native-model-select]');
      return select ? select.options.length : 0;
    });
    assert.ok(auditOptionCount >= 3, 'model select should have at least 3 options, got ' + auditOptionCount);
    var auditOptions = await page.evaluate(() => {
      var select = document.querySelector('[data-native-model-select]');
      return Array.from(select.options).map(function (o) { return { value: o.value, text: o.textContent }; });
    });
    assert.ok(auditOptions.some(function (o) { return o.text.includes('DeepSeek V4 Pro'); }), 'model select should include DeepSeek V4 Pro');
    assert.ok(auditOptions.some(function (o) { return o.text.includes('DeepSeek V4 Flash'); }), 'model select should include DeepSeek V4 Flash');
    assert.ok(auditOptions.some(function (o) { return o.text.includes('继承全局'); }), 'model select should include inherit option');

    // Restore to inherit so we can select specific model again naturally
    await page.selectOption('[data-native-model-select]', 'inherit');
    await page.waitForFunction(() => {
      var select = document.querySelector('[data-native-model-select]');
      return select && select.value === 'inherit';
    });

    // Select specific model + thinking
    await page.selectOption('[data-native-model-select]', 'deepseek-v4-pro');
    await page.waitForFunction(() => {
      var select = document.querySelector('[data-native-model-select]');
      return select && select.value === 'deepseek-v4-pro';
    });
    await page.locator('[data-native-thinking-toggle]').check();
    await page.waitForFunction(() => {
      var toggle = document.querySelector('[data-native-thinking-toggle]');
      return toggle && toggle.checked === true;
    });

    // Generate with specific model + thinking
    await page.fill('[data-native-beat-input]', 'A concise audit continuation.');
    await page.evaluate(() => {
      window.__lastNativeGenerationConfig = null;
      window.__writingwayNativeGenerationStub = async (prompt, onToken, config) => {
        window.__lastNativeGenerationConfig = config && typeof config === 'object' ? Object.assign({}, config) : config;
        for (const token of [' Audit', ' generated', ' text.']) {
          await new Promise((resolve) => setTimeout(resolve, 2));
          onToken(token);
        }
      };
    });
    await page.click('[data-native-gen-task="beat"]');
    await page.waitForFunction(() => document.querySelector('[data-native-gen-task="beat"]').classList.contains('is-active'));
    await page.click('[data-native-gen-task="continue"]');
    await page.waitForFunction(() => document.querySelector('[data-native-gen-task="continue"]').classList.contains('is-active'));
    await page.click('[data-native-preview-prompt]');
    await page.waitForFunction(() => document.querySelector('[data-native-prompt-dialog]').open);
    await page.click('[data-native-close-prompt]');
    await page.waitForFunction(() => !document.querySelector('[data-native-prompt-dialog]').open);

    await page.click('[data-native-generate]');
    await page.waitForFunction(() => document.querySelector('[data-native-generation-result]').textContent.includes('Audit generated text.'));
    var lastGenConfig = await page.evaluate(() => window.__lastNativeGenerationConfig);
    assert.ok(lastGenConfig, 'generation stub should receive a config object');
    assert.strictEqual(lastGenConfig.model, 'deepseek-v4-pro', 'generation config should use deepseek-v4-pro model');
    assert.strictEqual(lastGenConfig.enableThinking, true, 'generation config should have enableThinking true');
    await page.waitForFunction(() => document.querySelector('[data-native-scene-editor]').value.includes('Audit generated text.'));
    await page.selectOption('[data-native-generation-insert-mode]', 'cursor');
    await page.click('[data-native-accept-generation]');
    await page.waitForFunction(() => document.querySelector('[data-native-scene-editor]').value.includes('Audit generated text.'));

    // Test inherit + thinking: should pass enableThinking for DeepSeek
    await page.selectOption('[data-native-model-select]', 'inherit');
    await page.waitForFunction(() => {
      var select = document.querySelector('[data-native-model-select]');
      return select && select.value === 'inherit';
    });
    await page.locator('[data-native-thinking-toggle]').check();
    await page.waitForFunction(() => {
      var toggle = document.querySelector('[data-native-thinking-toggle]');
      return toggle && toggle.checked === true;
    });

    await page.fill('[data-native-beat-input]', 'Inherit model with thinking.');
    await page.evaluate(() => {
      window.__lastNativeGenerationConfig = null;
      window.__writingwayNativeGenerationStub = async (prompt, onToken, config) => {
        window.__lastNativeGenerationConfig = config && typeof config === 'object' ? Object.assign({}, config) : config;
        for (const token of [' Inherit', ' think', ' audit.']) {
          await new Promise((resolve) => setTimeout(resolve, 2));
          onToken(token);
        }
      };
    });
    await page.click('[data-native-generate]');
    await page.waitForFunction(() => document.querySelector('[data-native-generation-result]').textContent.includes('Inherit think audit.'));
    var inheritConfig = await page.evaluate(() => window.__lastNativeGenerationConfig);
    assert.ok(inheritConfig, 'inherit generation stub should receive a config object');
    assert.strictEqual(inheritConfig.model, 'deepseek-v4-pro', 'inherit config should keep global DeepSeek model');
    assert.strictEqual(inheritConfig.enableThinking, true, 'inherit + thinking should pass enableThinking true');
    await page.click('[data-native-discard-generation]');
    await page.waitForFunction(() => document.querySelector('[data-native-generation-output]').hidden);

    // Restore specific model for remaining tests
    await page.selectOption('[data-native-model-select]', 'deepseek-v4-pro');
    await page.waitForFunction(() => {
      var select = document.querySelector('[data-native-model-select]');
      return select && select.value === 'deepseek-v4-pro';
    });

    await page.fill('[data-native-beat-input]', 'Retry and discard audit.');
    await page.evaluate(() => {
      window.__writingwayNativeGenerationStub = async (prompt, onToken, config) => {
        window.__lastNativeGenerationConfig = config && typeof config === 'object' ? Object.assign({}, config) : config;
        for (const token of [' Audit', ' generated', ' text.']) {
          await new Promise((resolve) => setTimeout(resolve, 2));
          onToken(token);
        }
      };
    });
    await page.click('[data-native-generate]');
    await page.waitForFunction(() => document.querySelector('[data-native-generation-result]').textContent.includes('Audit generated text.'));
    await page.click('[data-native-retry-generation]');
    await page.waitForFunction(() => document.querySelector('[data-native-generation-result]').textContent.includes('Audit generated text.'));
    await page.click('[data-native-discard-generation]');
    await page.waitForFunction(() => document.querySelector('[data-native-generation-output]').hidden);

    await page.fill('[data-native-beat-input]', '');
    await page.evaluate(() => {
      window.__writingwayNativeGenerationStub = async (prompt, onToken) => {
        for (const token of ['Generated', ' scene', ' summary', ' for audit.']) {
          await new Promise((resolve) => setTimeout(resolve, 2));
          onToken(token);
        }
      };
    });
    await page.click('[data-native-gen-task="summary"]');
    await page.waitForFunction(() => document.querySelector('[data-native-gen-task="summary"]').classList.contains('is-active'));
    const summaryTaskGenerate = await page.locator('[data-native-generate]');
    assert.strictEqual(await summaryTaskGenerate.isDisabled(), false, 'summary generate should be enabled without beat text');
    const summaryBeatPlaceholder = await page.locator('[data-native-beat-input]').getAttribute('placeholder');
    assert.ok(summaryBeatPlaceholder.includes('无需输入'), 'summary placeholder should indicate no input needed');
    await page.click('[data-native-generate]');
    await page.waitForFunction(() => document.querySelector('[data-native-scene-summary]').value.includes('Generated scene summary for audit.'));
    await page.click('[data-native-gen-task="continue"]');
    await page.waitForFunction(() => document.querySelector('[data-native-gen-task="continue"]').classList.contains('is-active'));

    await page.click('[data-native-manage-prompts]');
    await page.waitForFunction(() => document.querySelector('[data-prompt-manager-dialog]').open);
    await page.fill('[data-prompt-manager-title]', 'Audit Rewrite Prompt');
    await page.selectOption('[data-prompt-manager-category]', 'rewrite');
    await page.fill('[data-prompt-manager-content]', '请把选中文本改得更冷峻克制。');
    await page.locator('[data-prompt-manager-form] button[type="submit"]').click();
    await page.waitForFunction(() => {
      const select = document.querySelector('[data-native-rewrite-saved-prompt]');
      return select && Array.from(select.options).some((option) => option.textContent.includes('Audit Rewrite Prompt'));
    });
    await page.click('[data-prompt-manager-close]');
    await page.waitForFunction(() => !document.querySelector('[data-prompt-manager-dialog]').open);
    await page.click('[data-native-panel-tab="rewrite"]');
    await page.selectOption('[data-native-rewrite-saved-prompt]', { label: 'Audit Rewrite Prompt' });
    await page.waitForFunction(() => document.querySelector('[data-native-rewrite-instruction]').value.includes('冷峻克制'));
    await page.selectOption('[data-native-rewrite-preset]', 'tension');
    await page.waitForFunction(() => {
      return document.querySelector('[data-native-rewrite-saved-prompt]').value === ''
        && document.querySelector('[data-native-rewrite-instruction]').value.includes('紧张感')
        && document.querySelector('[data-native-rewrite-preset-description]').textContent.includes('紧张感');
    });
    await page.fill('[data-native-scene-editor]', 'Rewrite this audit sentence.');
    await page.evaluate(() => {
      const editor = document.querySelector('[data-native-scene-editor]');
      editor.focus();
      editor.setSelectionRange(0, 12);
      editor.dispatchEvent(new Event('select', { bubbles: true }));
      editor.dispatchEvent(new Event('mouseup', { bubbles: true }));
      window.__writingwayNativeGenerationStub = async (prompt, onToken) => {
        for (const token of ['Rewritten', ' audit']) {
          await new Promise((resolve) => setTimeout(resolve, 2));
          onToken(token);
        }
      };
    });
    await page.click('[data-native-preview-rewrite]');
    await page.waitForFunction(() => document.querySelector('[data-native-prompt-dialog]').open);
    await page.click('[data-native-close-prompt]');
    await page.click('[data-native-start-rewrite]');
    await page.waitForFunction(() => {
      const result = document.querySelector('[data-native-generation-result]');
      return result && result.textContent.includes('Rewritten audit');
    });
    await page.waitForFunction(() => document.querySelector('[data-native-scene-editor]').value === 'Rewrite this audit sentence.');
    await page.waitForFunction(() => !document.querySelector('[data-native-generation-output]').hidden);
    await page.click('[data-native-accept-generation]');
    await page.waitForFunction(() => document.querySelector('[data-native-scene-editor]').value.includes('Rewritten audit'), null, { timeout: 5000 }).catch(async (error) => {
      const value = await page.locator('[data-native-scene-editor]').inputValue();
      throw new Error(`${error.message}\nEditor value after rewrite accept: ${value}\nBrowser messages:\n${browserMessages.join('\n')}`);
    });
    await page.fill('[data-native-scene-editor]', 'Replace this passage with context.');
    await page.evaluate(() => {
      const editor = document.querySelector('[data-native-scene-editor]');
      editor.focus();
      editor.setSelectionRange(0, 12);
      editor.dispatchEvent(new Event('select', { bubbles: true }));
      editor.dispatchEvent(new Event('mouseup', { bubbles: true }));
      window.__writingwayNativeGenerationStub = async (prompt, onToken) => {
        window.__lastNativeGenerationPrompt = prompt && typeof prompt.asString === 'function'
          ? prompt.asString()
          : JSON.stringify(prompt);
        for (const token of ['Regenerated', ' passage']) {
          await new Promise((resolve) => setTimeout(resolve, 2));
          onToken(token);
        }
      };
    });
    await page.locator('[data-native-regenerate-use-context]').uncheck();
    await page.click('[data-native-regenerate-selection]');
    await page.waitForFunction(() => {
      const result = document.querySelector('[data-native-generation-result]');
      return result && result.textContent.includes('Regenerated passage');
    }, null, { timeout: 5000 }).catch(async (error) => {
      const outputText = await page.locator('[data-native-generation-result]').textContent();
      throw new Error(`${error.message}\nOutput text after regeneration click: ${outputText}\nBrowser messages:\n${browserMessages.join('\n')}`);
    });
    await page.waitForFunction(() => window.__lastNativeGenerationPrompt && window.__lastNativeGenerationPrompt.includes('用户选择不发送上下文'));
    await page.click('[data-native-accept-generation]');
    await page.waitForFunction(() => document.querySelector('[data-native-scene-editor]').value.includes('Regenerated passage'), null, { timeout: 5000 }).catch(async (error) => {
      const value = await page.locator('[data-native-scene-editor]').inputValue();
      throw new Error(`${error.message}\nEditor value after regenerate accept: ${value}\nBrowser messages:\n${browserMessages.join('\n')}`);
    });

    await page.fill('[data-native-scene-editor]', 'Task button rewrite test text here.');
    await page.evaluate(() => {
      const editor = document.querySelector('[data-native-scene-editor]');
      editor.focus();
      editor.setSelectionRange(0, 10);
      editor.dispatchEvent(new Event('select', { bubbles: true }));
    });
    await page.click('[data-native-panel-tab="rewrite"]');
    await page.click('[data-native-rewrite-task="expand"]');
    await page.waitForFunction(() => document.querySelector('[data-native-rewrite-task="expand"]').classList.contains('is-active'));
    await page.waitForFunction(() => document.querySelector('[data-native-rewrite-preset]').value === 'expand');
    await page.click('[data-native-rewrite-task="polish"]');
    await page.waitForFunction(() => document.querySelector('[data-native-rewrite-task="polish"]').classList.contains('is-active'));
    await page.waitForFunction(() => document.querySelector('[data-native-rewrite-preset]').value === 'balanced-polish');

    await page.click('[data-native-panel-tab="characters"]');
    await page.click('[data-native-new-character]');
    await page.waitForFunction(() => document.querySelector('[data-native-character-list]').textContent.includes('新人物'));
    await page.click('[data-native-panel-tab="context"]');
    await page.waitForFunction(() => document.querySelector('[data-native-context-compendium]').textContent.includes('新人物'));
    await page.locator('[data-native-context-compendium] input[type="checkbox"]').first().check();
    await page.waitForSelector('[data-native-context-compendium-tags]');
    await page.locator('[data-native-context-chapters] select').first().selectOption('summary');
    await page.locator('[data-native-context-scenes] select').first().selectOption('summary');

    await page.waitForSelector('[data-native-context-summary]');
    await page.waitForFunction(() => {
      const summary = document.querySelector('[data-native-context-summary]');
      return summary && summary.textContent && summary.textContent.length > 0 && !summary.textContent.includes('未选择');
    });
    const summaryText = await page.locator('[data-native-context-summary]').textContent();
    assert.ok(summaryText.includes('资料'), 'context summary should show compendium section');
    assert.ok(summaryText.includes('章节引用'), 'context summary should show chapter section');
    assert.ok(summaryText.includes('场景引用'), 'context summary should show scene section');
    assert.ok(summaryText.includes('直接引用'), 'context summary should show direct selection count');
    assert.ok(summaryText.includes('摘要'), 'context summary should show mode labels');

    await page.click('[data-native-panel-tab="generate"]');
    await page.click('[data-native-manage-prompts]');
    await page.waitForFunction(() => document.querySelector('[data-prompt-manager-dialog]').open);
    await page.fill('[data-prompt-manager-title]', 'Audit Prompt');
    await page.fill('[data-prompt-manager-system]', 'Audit system.');
    await page.fill('[data-prompt-manager-content]', 'Audit prose.');
    await page.locator('[data-prompt-manager-form] button[type="submit"]').click();
    await page.waitForFunction(() => document.querySelector('[data-native-save-status]').textContent.includes('提示词已保存'));
    await page.click('[data-prompt-manager-new]');
    await page.waitForFunction(() => document.querySelector('[data-prompt-manager-title]').value.includes('新正文提示词'));
    await page.click('[data-prompt-manager-close]');
    await page.waitForFunction(() => !document.querySelector('[data-prompt-manager-dialog]').open);

    await page.click('[data-native-panel-tab="history"]');
    await page.waitForFunction(() => document.querySelector('[data-native-generation-history]').textContent.includes('Retry and discard audit'));
    const proseHistoryItem = page.locator('.desktop-native-history-item').filter({ hasText: 'Retry and discard audit' }).first();
    await proseHistoryItem.locator('[data-native-history-reuse]').click();
    await page.waitForFunction(() => document.querySelector('[data-native-generation-result]').textContent.length > 0);

    await proseHistoryItem.locator('[data-native-history-copy]').click();
    await page.waitForFunction(() => {
      return window.__writingwayAuditClipboard && window.__writingwayAuditClipboard.includes('Audit generated text.');
    });
    const clipboardBeforeFilter = await page.evaluate(() => window.__writingwayAuditClipboard);
    assert.ok(clipboardBeforeFilter.includes('Audit generated text.'), 'copy should capture the generated text in audit clipboard');

    const retryHistoryItem = page.locator('.desktop-native-history-item').filter({ hasText: 'Retry and discard audit' }).first();
    const editorBeforeHistoryRetry = await page.locator('[data-native-scene-editor]').inputValue();
    const oldHistoryTextCountBefore = (editorBeforeHistoryRetry.match(/Audit generated text\./g) || []).length;
    await page.evaluate(() => {
      window.__historyRetryGenerationCalls = 0;
      window.__writingwayNativeGenerationStub = async (prompt, onToken) => {
        window.__historyRetryGenerationCalls += 1;
        window.__lastHistoryRetryPrompt = prompt && prompt.asString ? prompt.asString() : String(prompt);
        for (const token of [' History', ' retry', ' fresh', ' text.']) {
          await new Promise((resolve) => setTimeout(resolve, 2));
          onToken(token);
        }
      };
    });
    await retryHistoryItem.locator('[data-native-history-retry]').click();
    await page.waitForFunction(() => {
      const input = document.querySelector('[data-native-beat-input]');
      return input && input.value === 'Retry and discard audit.';
    });
    await page.waitForFunction(() => {
      const panel = document.querySelector('[data-native-panel="generate"]');
      return panel && !panel.hidden;
    });
    await page.waitForFunction(() => {
      const result = document.querySelector('[data-native-generation-result]');
      return result && result.textContent.includes('History retry fresh text.');
    });
    assert.strictEqual(await page.evaluate(() => window.__historyRetryGenerationCalls), 1, 'history retry should start one fresh generation');
    const retryPrompt = await page.evaluate(() => window.__lastHistoryRetryPrompt || '');
    assert.ok(retryPrompt.includes('Retry and discard audit.'), 'history retry prompt should reuse the record beat');
    const editorAfterRetry = await page.locator('[data-native-scene-editor]').inputValue();
    const oldHistoryTextCountAfter = (editorAfterRetry.match(/Audit generated text\./g) || []).length;
    assert.strictEqual(oldHistoryTextCountAfter, oldHistoryTextCountBefore, 'history retry should not insert the old stored result again');
    assert.ok(editorAfterRetry.includes('History retry fresh text.'), 'history retry should stream the fresh result through the normal generation path');
    await page.click('[data-native-panel-tab="history"]');
    await page.waitForFunction(() => document.querySelector('[data-native-generation-history]').textContent.includes('History retry fresh text.'));
    const freshHistoryItem = page.locator('.desktop-native-history-item').filter({ hasText: 'History retry fresh text.' }).first();
    assert.ok(await freshHistoryItem.locator('[data-native-history-task]').count() > 0, 'history card should have task label');
    const taskText = await freshHistoryItem.locator('[data-native-history-task]').textContent();
    assert.ok(taskText.includes('正文扩写'), 'task label should show Chinese task name');
    const metaEl = freshHistoryItem.locator('[data-native-history-meta]');
    assert.ok(await metaEl.count() > 0, 'history card should have meta span');
    const metaText = await metaEl.textContent();
    assert.ok(metaText.includes('字'), 'meta should include word count unit');

    await page.click('[data-native-history-filter]');
    await page.waitForFunction(() => document.querySelector('[data-native-history-filter]').getAttribute('aria-pressed') === 'true');
    await page.click('[data-native-history-filter]');
    await page.waitForFunction(() => document.querySelector('[data-native-history-filter]').getAttribute('aria-pressed') === 'false');

    await freshHistoryItem.locator('[data-native-history-insert]').click();
    await page.waitForFunction(() => document.querySelector('[data-native-scene-editor]').value.includes('History retry fresh text.'));
    await freshHistoryItem.locator('[data-native-history-delete]').click();
    await page.waitForFunction(() => document.querySelector('[data-native-save-status]').textContent.includes('未保存'));

    await page.click('[data-native-save-scene]');
    await page.waitForFunction(() => document.querySelector('[data-native-save-status]').textContent.includes('已保存'));
    const savedStatus = await page.locator('[data-native-save-status]');
    assert.strictEqual(await savedStatus.getAttribute('data-tone'), 'ok', 'saved status should use ok tone');

    page.once('dialog', async (dialog) => {
      assert.strictEqual(dialog.type(), 'confirm');
      await dialog.accept();
    });
    await page.click('[data-native-panel-tab="structure"]');
    await page.click('[data-native-delete-scene]');
    await page.waitForFunction(() => !document.querySelector('[data-native-scene-title]').textContent.includes('Renamed Audit Scene'));

    console.log('Writer button audit passed.');
  } finally {
    if (browser) await browser.close();
    if (servers) servers.close();
    await fs.rm(dataRoot, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error('Writer button audit failed:', error && error.stack ? error.stack : error);
  process.exit(1);
});
