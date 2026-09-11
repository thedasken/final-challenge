const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../src/app');

async function request(path, options = {}) {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: {
        'content-type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    const body = await response.json();
    return { response, body };
  } finally {
    server.close();
  }
}

test('GET /health returns an OK status', async () => {
  const { response, body } = await request('/health');

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
});

test('GET /tasks returns tasks', async () => {
  const { response, body } = await request('/tasks');

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body));
  assert.ok(body.length > 0);
});

test('GET /tasks/:id returns 404 for an unknown task', async () => {
  const { response, body } = await request('/tasks/999999');

  assert.equal(response.status, 404);
  assert.equal(body.error, 'Task not found');
});

test('POST /tasks creates a valid task', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Write documentation',
      description: 'Update the README',
      status: 'todo'
    })
  });
 
  assert.equal(response.status, 201);
  assert.equal(body.title, 'Write documentation');
  assert.equal(body.description, 'Update the README');
  assert.equal(body.status, 'todo');
  assert.ok(body.id);
});
 
test('POST /tasks rejects a missing title', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      description: 'Task without title',
      status: 'todo'
    })
  });
 
  assert.equal(response.status, 400);
  assert.equal(body.error, 'Title is required');
});
 
test('POST /tasks rejects an invalid status', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Invalid task',
      status: 'invalid-status'
    })
  });
 
  assert.equal(response.status, 400);
  assert.equal(body.error, 'Invalid status');
});
 
test('POST /tasks rejects a title longer than 100 characters', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: 'a'.repeat(101),
      status: 'todo'
    })
  });
 
  assert.equal(response.status, 400);
  assert.equal(body.error, 'Title must be 100 characters or less');
});
 
test('POST /tasks rejects an invalid description type', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Invalid description',
      description: 123,
      status: 'todo'
    })
  });
 
  assert.equal(response.status, 400);
  assert.equal(body.error, 'Description must be a string');
});
