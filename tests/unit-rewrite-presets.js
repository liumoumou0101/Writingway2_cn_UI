const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');

const context = {
    window: {},
    document: {},
    console
};
vm.createContext(context);

vm.runInContext(
    fs.readFileSync(path.join(projectRoot, 'src/modules/editor.js'), 'utf8'),
    context
);

const presets = context.window.Editor.getRewritePresets();
if (!Array.isArray(presets) || presets.length < 15) {
    throw new Error('Expected a broad set of built-in rewrite presets.');
}

for (const preset of presets) {
    if (!preset.id || !preset.title || !preset.description || !preset.prompt) {
        throw new Error('Each rewrite preset needs id, title, description, and prompt.');
    }
}

const app = {
    selectedRewritePresetId: 'tension',
    selectedRewritePromptId: 'saved-1',
    rewriteInstruction: '',
    rewritePromptPreview: '',
    rewriteOriginalText: '她推开门，房间里很安静。',
    prompts: [
        {
            id: 'saved-1',
            category: 'rewrite',
            title: 'Saved Tone',
            content: '请把这一段改得更冷峻克制。'
        }
    ]
};

context.window.Editor.applyRewritePreset(app);
if (!app.rewriteInstruction.includes('紧张感')) {
    throw new Error('Applying a preset should populate the editable rewrite instruction.');
}
if (app.selectedRewritePromptId !== null) {
    throw new Error('Applying a preset should clear the saved prompt selection.');
}

app.selectedRewritePromptId = 'saved-1';
context.window.Editor.applySavedRewritePrompt(app);
if (!app.rewriteInstruction.includes('冷峻克制')) {
    throw new Error('Applying a saved rewrite prompt should populate the editable instruction.');
}
if (app.selectedRewritePresetId !== '') {
    throw new Error('Applying a saved prompt should clear the built-in preset selection.');
}

app.rewriteInstruction = '请改得更有电影镜头感。';
const finalPrompt = context.window.Editor.buildRewritePrompt(app);
if (!finalPrompt.includes('请改得更有电影镜头感。')) {
    throw new Error('Final rewrite prompt should use the edited instruction.');
}
if (!finalPrompt.includes(app.rewriteOriginalText)) {
    throw new Error('Final rewrite prompt should include the original selected text.');
}
if (!finalPrompt.includes('只输出重写后的正文')) {
    throw new Error('Final rewrite prompt should constrain the model to output rewritten prose only.');
}

console.log('Rewrite preset test passed.');
