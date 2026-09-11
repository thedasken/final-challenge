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

test('POST /tasks accepts a title with exactly 100 characters', async () => {
  const title = 'a'.repeat(100);
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title })
  });

  assert.equal(response.status, 201);
  assert.equal(body.title, title);
});

test('POST /tasks rejects an empty title', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: '' })
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Title is required');
});

test('POST /tasks rejects a title containing only whitespace', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: '   ' })
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Title is required');
});

test('POST /tasks trims whitespace around a valid title', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: '  Write documentation  ' })
  });

  assert.equal(response.status, 201);
  assert.equal(body.title, 'Write documentation');
});

test('POST /tasks validates the title length after trimming', async () => {
  const title = 'a'.repeat(100);
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: `  ${title}  ` })
  });

  assert.equal(response.status, 201);
  assert.equal(body.title, title);
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

test('POST /tasks rejects a null body', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify(null)
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Invalid request structure');
});

test('POST /tasks rejects an array body', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify([{ title: 'Invalid task' }])
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Invalid request structure');
});

test('POST /tasks rejects an empty body', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST'
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Invalid request structure');
});

test('POST /tasks rejects malformed JSON', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: '{"title":'
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Invalid request structure');
});

test('POST /tasks rejects unknown fields', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Invalid task',
      unexpectedField: 'unexpected value'
    })
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Invalid request structure');
});

test('GET /tasks filters tasks by status', async () => {
  const { response, body } = await request('/tasks?status=todo');

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body));
  assert.ok(body.length > 0);

  for (const task of body) {
    assert.equal(task.status, 'todo');
  }
});

test('GET /tasks returns all tasks when no status filter is provided', async () => {
  const { response, body } = await request('/tasks');

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(body));
  assert.ok(body.length >= 3);
});

test('GET /tasks rejects an invalid status filter', async () => {
  const { response, body } = await request('/tasks?status=invalid');

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Invalid status');
});
test('PATCH /tasks/:id updates an existing task', async () => {
  const { response, body } = await request('/tasks/1', {
    method: 'PATCH',
    body: JSON.stringify({
      title: 'Updated GitHub workshop',
      status: 'done'
    })
  });

  assert.equal(response.status, 200);
  assert.equal(body.id, 1);
  assert.equal(body.title, 'Updated GitHub workshop');
  assert.equal(body.status, 'done');
});

test('PATCH /tasks/:id returns 404 for an unknown task', async () => {
  const { response, body } = await request('/tasks/999999', {
    method: 'PATCH',
    body: JSON.stringify({
      title: 'Unknown task'
    })
  });

  assert.equal(response.status, 404);
  assert.equal(body.error, 'Task not found');
});

test('PATCH /tasks/:id rejects an invalid status', async () => {
  const { response, body } = await request('/tasks/1', {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'invalid-status'
    })
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Invalid status');
});

test('PATCH /tasks/:id rejects an empty title', async () => {
  const { response, body } = await request('/tasks/1', {
    method: 'PATCH',
    body: JSON.stringify({
      title: ''
    })
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Title is required');
});

test('PATCH /tasks/:id rejects a title longer than 100 characters', async () => {
  const { response, body } = await request('/tasks/1', {
    method: 'PATCH',
    body: JSON.stringify({
      title: 'a'.repeat(101)
    })
  });

  assert.equal(response.status, 400);
  assert.equal(body.error, 'Title must be 100 characters or less');
});

test('POST /tasks defaults status to todo', async () => {
  const { response, body } = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Task with default status'
    })
  });

  assert.equal(response.status, 201);
  assert.equal(body.status, 'todo');
});


test('PATCH /tasks/:id preserves fields that are not updated', async () => {
  const { response: getResponse, body: originalTask } = await request('/tasks/2');

  assert.equal(getResponse.status, 200);

  const { response, body } = await request('/tasks/2', {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'done'
    })
  });

  assert.equal(response.status, 200);
  assert.equal(body.status, 'done');
  assert.equal(body.title, originalTask.title);
  assert.equal(body.description, originalTask.description);
});