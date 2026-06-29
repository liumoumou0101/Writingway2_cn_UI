const assert = require('assert');
const ContextResolver = require('../src/core/context/context-resolver');
const PromptTemplateSchema = require('../src/core/prompt/prompt-template-schema');
const PromptBuilder = require('../src/core/generation/prompt-builder');

const project = {
  id: 'ctx-project',
  currentSceneId: 's2',
  compendium: [
    { id: 'ada', title: 'Ada', aliases: ['Navigator'], type: 'character', body: 'Ada maps storms.', tags: ['pilot'], alwaysInContext: false },
    { id: 'city', title: 'Brass City', type: 'location', body: 'A city of bells.', tags: ['city'], alwaysInContext: true }
  ],
  scenes: [
    { id: 's1', chapterId: 'c1', title: 'Harbor', summary: 'Ada found the first map.' },
    { id: 's2', chapterId: 'c1', title: 'Bridge', summary: 'Current scene.' },
    { id: 's3', chapterId: 'c1', title: 'Storm Gate', summary: 'The gate opens during storms.' }
  ],
  sceneContents: {
    s3: 'The gate opens during storms.'
  }
};

const context = ContextResolver.resolveContext({
  project,
  beat: '让 @[Navigator] 前往 #[Storm Gate]。',
  selection: {
    currentSceneId: 's2',
    maxChars: 1000
  }
});

assert.ok(context.compendiumEntries.some((entry) => entry.id === 'ada'), 'mention alias should include compendium entry');
assert.ok(context.compendiumEntries.some((entry) => entry.id === 'city'), 'alwaysInContext should include compendium entry');
assert.ok(context.sceneSummaries.some((scene) => scene.id === 's1'), 'previous scene summary should be included');
assert.ok(context.sceneSummaries.some((scene) => scene.id === 's3'), 'scene mention should include referenced scene');

const template = PromptTemplateSchema.createPromptTemplate({
  category: 'prose',
  title: 'Atmospheric prose',
  systemContent: 'Write with quiet precision.',
  content: 'Use concrete sensory detail.'
});
assert.strictEqual(template.category, 'prose');

const prompt = PromptBuilder.buildFictionPrompt({
  beat: '继续写。',
  sceneContext: 'Existing scene.',
  options: {
    systemPrompt: template.systemContent,
    prosePrompt: template.content,
    compendiumEntries: context.compendiumEntries,
    sceneSummaries: context.sceneSummaries
  }
});

const rendered = prompt.asString();
assert.ok(rendered.includes('Write with quiet precision.'), 'system template should be used');
assert.ok(rendered.includes('Use concrete sensory detail.'), 'user template should be used');
assert.ok(rendered.includes('Ada maps storms.'), 'resolved compendium should be included');
assert.ok(rendered.includes('Storm Gate'), 'resolved scene should be included');

console.log('Context and prompt core test passed.');
