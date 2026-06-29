const assert = require('assert');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const { startDesktopServers } = require('../desktop/local-server');
const projectService = require('../desktop/services/project-service');
const promptService = require('../desktop/services/prompt-service');

(async () => {
  const dataRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'writingway-prompt-test-'));
  let servers = null;
  try {
    await projectService.createProject(dataRoot, {
      id: 'prompt-project',
      title: 'Prompt Project'
    });

    const saved = await promptService.savePrompt(dataRoot, 'prompt-project', {
      category: 'prose',
      title: 'Quiet Style',
      systemContent: 'Write softly.',
      content: 'Use small details.'
    });
    assert.strictEqual(saved.ok, true);
    assert.strictEqual(saved.prompt.category, 'prose');

    const listed = await promptService.listPrompts(dataRoot, 'prompt-project', { category: 'prose' });
    assert.strictEqual(listed.prompts.length, 1);
    assert.strictEqual(listed.prompts[0].title, 'Quiet Style');

    servers = await startDesktopServers({
      appRoot: path.resolve(__dirname, '..'),
      dataRoot
    });

    const apiList = await fetch('http://127.0.0.1:8000/api/prompts?projectId=prompt-project&category=prose');
    const apiListBody = await apiList.json();
    assert.ok(apiList.ok && apiListBody.ok, 'prompt list API should return ok');
    assert.strictEqual(apiListBody.prompts[0].title, 'Quiet Style');

    const apiSave = await fetch('http://127.0.0.1:8000/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: 'prompt-project',
        prompt: {
          category: 'workflow',
          title: 'Workflow Step',
          content: 'Do one step.'
        }
      })
    });
    const apiSaveBody = await apiSave.json();
    assert.ok(apiSave.ok && apiSaveBody.ok, 'prompt save API should return ok');
    assert.strictEqual(apiSaveBody.prompt.category, 'workflow');

    const apiDelete = await fetch('http://127.0.0.1:8000/api/delete-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: 'prompt-project', promptId: apiSaveBody.prompt.id })
    });
    const apiDeleteBody = await apiDelete.json();
    assert.ok(apiDelete.ok && apiDeleteBody.ok, 'prompt delete API should return ok');
    assert.strictEqual(apiDeleteBody.deleted, 1);

    console.log('Prompt service test passed.');
  } finally {
    if (servers) servers.close();
    await fs.rm(dataRoot, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error('Prompt service test failed:', error && error.stack ? error.stack : error);
  process.exit(1);
});
