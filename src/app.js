const express = require('express');

const app = express();
app.use(express.json());
const VALID_STATUSES = ['todo', 'in-progress', 'done'];
const MAX_TITLE_LENGTH = 100;
const ALLOWED_TASK_FIELDS = ['title', 'description', 'status'];

function validateTaskInput(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Invalid request structure' };
  }

  const fields = Object.keys(body);

  if (fields.length === 0) {
    return { error: 'Invalid request structure' };
  }

  const hasUnknownField = fields.some(
    (field) => !ALLOWED_TASK_FIELDS.includes(field)
  );

  if (hasUnknownField) {
    return { error: 'Invalid request structure' };
  }

  const { title, description, status = 'todo' } = body;

  if (typeof title !== 'string' || title.trim() === '') {
    return { error: 'Title is required' };
  }

  const normalizedTitle = title.trim();

  if (normalizedTitle.length > MAX_TITLE_LENGTH) {
    return { error: 'Title must be 100 characters or less' };
  }

  if (!VALID_STATUSES.includes(status)) {
    return { error: 'Invalid status' };
  }

  if (description !== undefined && typeof description !== 'string') {
    return { error: 'Description must be a string' };
  }

  return {
    value: {
      title: normalizedTitle,
      description,
      status
    }
  };
}

let tasks = [
  {
    id: 1,
    title: 'Prepare GitHub workshop',
    description: 'Finish the slides',
    status: 'todo'
  },
  {
    id: 2,
    title: 'Write CI workflow',
    description: 'Configure GitHub Actions',
    status: 'in-progress'
  },
  {
    id: 3,
    title: 'Review Pull Request',
    description: 'Review teammate changes',
    status: 'done'
  }
];

app.get('/health', (req, res) => {
  res.json({
    status: 'ok'
  });
});

app.get('/tasks', (req, res) => {
  const { status } = req.query;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status'
    });
  }

  if (status) {
    const filteredTasks = tasks.filter((task) => task.status === status);
    return res.json(filteredTasks);
  }

  return res.json(tasks);
});

app.get('/tasks/:id', (req, res) => {
  const task = tasks.find((item) => item.id === Number(req.params.id));

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  return res.json(task);
});

app.patch('/tasks/:id', (req, res) => {
  const task = tasks.find((item) => item.id === Number(req.params.id));

  if (!task) {
    return res.status(404).json({
      error: 'Task not found'
    });
  }

  const { title, description, status } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        error: 'Title is required'
      });
    }

    if (title.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({
        error: 'Title must be 100 characters or less'
      });
    }
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: 'Invalid status'
    });
  }

  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({
      error: 'Description must be a string'
    });
  }

  if (title !== undefined) {
    task.title = title.trim();
  }

  if (description !== undefined) {
    task.description = description;
  }

  if (status !== undefined) {
    task.status = status;
  }

  return res.json(task);
});

app.post('/tasks', (req, res) => {
  const validation = validateTaskInput(req.body);

  if (validation.error) {
    return res.status(400).json({ error: validation.error });
  }

  const task = {
    id: tasks.length ? Math.max(...tasks.map((item) => item.id)) + 1 : 1,
    ...validation.value
  };

  tasks.push(task);

  return res.status(201).json(task);
});

app.use((error, req, res, next) => {
  void req;

  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    error.type === 'entity.parse.failed'
  ) {
    return res.status(400).json({ error: 'Invalid request structure' });
  }

  return next(error);
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  const nodeEnv = process.env.NODE_ENV || 'development';

  app.listen(port, () => {
    console.log(`Task API listening on port ${port}`);
    console.log(`Environment : ${nodeEnv}`);
  });
}

module.exports = { app };
