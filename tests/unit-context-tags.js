const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');

const entries = [
    {
        id: 'entry-fog-city',
        projectId: 'project-1',
        category: 'locations',
        title: 'Fog City',
        body: 'Fog City is a port where every bell sounds underwater.',
        tags: ['雾城', 'fog-city']
    },
    {
        id: 'entry-noise',
        projectId: 'project-1',
        category: 'lore',
        title: 'Cartography Guild',
        body: 'This should not be included by an unrelated partial tag match.',
        tags: ['art']
    }
];

function makeDb(rows) {
    return {
        compendium: {
            where() {
                return {
                    equals(projectId) {
                        return {
                            async toArray() {
                                return rows.filter(row => row.projectId === projectId);
                            }
                        };
                    }
                };
            },
            async get(id) {
                return rows.find(row => row.id === id) || null;
            }
        }
    };
}

(async () => {
    const context = {
        window: {},
        db: makeDb(entries),
        console
    };
    context.window.__test = {};
    vm.createContext(context);

    vm.runInContext(
        fs.readFileSync(path.join(projectRoot, 'src/modules/beat-mentions.js'), 'utf8'),
        context
    );
    vm.runInContext(
        fs.readFileSync(path.join(projectRoot, 'src/generation.js'), 'utf8'),
        context
    );

    const app = {
        currentProject: { id: 'project-1' },
        currentScene: { content: '主角抵达雾城，街灯在水汽里发暗。' },
        beatCompendiumMap: {}
    };

    const resolved = await context.window.__test.BeatMentions.resolveCompendiumEntriesFromBeat(app, '继续写下一段。');
    const ids = resolved.map(entry => entry.id);

    if (!ids.includes('entry-fog-city')) {
        throw new Error('Expected scene text tag mention to resolve Fog City compendium entry.');
    }
    if (ids.includes('entry-noise')) {
        throw new Error('Partial ASCII tag match should not include unrelated compendium entry.');
    }

    const prompt = context.window.Generation.buildPrompt('继续写下一段。', app.currentScene.content, {
        compendiumEntries: resolved
    });
    const userContent = prompt.messages.find(message => message.role === 'user').content;

    if (!userContent.includes('Fog City is a port where every bell sounds underwater.')) {
        throw new Error('Expected resolved compendium body to be included in generated prompt context.');
    }

    const titleResolved = await context.window.__test.BeatMentions.resolveCompendiumEntriesFromBeat(
        { ...app, currentScene: { content: '' }, beatCompendiumMap: {} },
        'Use @[Fog City] in this beat.'
    );

    if (!titleResolved.some(entry => entry.id === 'entry-fog-city')) {
        throw new Error('Expected @[Title] mention to resolve by title even without runtime map.');
    }

    console.log('Context tag mention test passed.');
})().catch(error => {
    console.error(error && error.message ? error.message : error);
    process.exit(1);
});
