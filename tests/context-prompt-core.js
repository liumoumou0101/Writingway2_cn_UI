const assert = require('assert');
const ContextResolver = require('../src/core/context/context-resolver');
const PromptTemplateSchema = require('../src/core/prompt/prompt-template-schema');
const PromptBuilder = require('../src/core/generation/prompt-builder');

const project = {
  id: 'ctx-project',
  currentSceneId: 's2',
  compendium: [
    { id: 'ada', title: 'Ada', aliases: ['Navigator'], type: 'character', body: 'Ada maps storms.', tags: ['pilot'], alwaysInContext: false },
    { id: 'city', title: 'Brass City', type: 'location', body: 'A city of bells.', tags: ['city'], alwaysInContext: true },
    { id: 'sailor', title: 'Old Sailor', type: 'character', body: 'Knows every tide.', tags: ['crew'], alwaysInContext: false },
    { id: 'guild', title: 'Cartography Guild', type: 'lore', body: 'Masters of maps.', tags: ['art'], alwaysInContext: false }
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

// Test 2: Plain tag in beat text includes matching compendium entry
const context2 = ContextResolver.resolveContext({
  project,
  beat: 'The pilot must navigate the storm.',
  selection: { currentSceneId: 's2', maxChars: 2000 }
});
assert.ok(context2.compendiumEntries.some((entry) => entry.id === 'ada'), 'plain tag in beat text should include matching compendium entry');

// Test 3: Plain tag in current scene content includes matching compendium entry
const projectWithSceneContent = {
  ...project,
  sceneContents: { ...project.sceneContents, s2: 'The crew prepares for departure.' }
};
const context3 = ContextResolver.resolveContext({
  project: projectWithSceneContent,
  beat: 'Write the next part.',
  selection: { currentSceneId: 's2', maxChars: 2000 }
});
assert.ok(context3.compendiumEntries.some((entry) => entry.id === 'sailor'), 'plain tag in current scene content should include matching compendium entry');

// Test 4: ASCII boundary - short tag should not match partial in longer word
const context4 = ContextResolver.resolveContext({
  project,
  beat: 'The Cartography Guild is famous.',
  selection: { currentSceneId: 's2', maxChars: 2000 }
});
assert.ok(!context4.compendiumEntries.some((entry) => entry.id === 'guild'), 'partial ASCII tag match (art in Cartography) should not include unrelated entry');

// Test 5: @[Title] mention still resolves when there is no plain tag match
const context5 = ContextResolver.resolveContext({
  project,
  beat: 'Use @[Ada] knowledge.',
  selection: { currentSceneId: 's2', maxChars: 2000 }
});
assert.ok(context5.compendiumEntries.some((entry) => entry.id === 'ada'), '@[Title] mention should resolve by title');

console.log('Context and prompt core test passed.');
