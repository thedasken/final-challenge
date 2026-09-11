# Task Management API — Final Challenge

Starter project for the GitHub + Actions + Docker final challenge.

## Requirements

- Node.js 20+
- npm
- Docker
- Docker Compose

## Install

```bash
npm install
```

## Run locally

```bash
npm start
```

The API listens on port `3000` by default.

## Test

```bash
npm test
```

## Lint

```bash
npm run lint
```

## API

Starter endpoints:

- `GET /tasks`
- `GET /tasks/:id`
- `POST /tasks`

Students must implement additional functionality from `CHALLENGE.md`.

### Creating a task

`POST /tasks` accepts a JSON object with the following fields:

- `title` (required string, 1 to 100 characters after trimming)
- `description` (optional string)
- `status` (optional: `todo`, `in-progress` or `done`; defaults to `todo`)

Unknown fields and non-object or malformed JSON bodies are rejected with a `400`
response.

## Docker

Students must create a production-ready Docker image.

Expected commands:

```bash
docker build -t task-api .
docker run -p 3000:3000 task-api
```

## Docker Compose

Students must create:

```bash
docker compose up
```

## GitHub Actions

The final repository must contain workflows for:

- tests and lint;
- matrix testing;
- Docker build;
- container security scanning;
- publishing the image to GitHub Container Registry.

See `CHALLENGE.md` for the complete requirements.

## Environment Variables
 
The application can be configured using environment variables.
 
| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Port used by the HTTP server | `3000` |
| `NODE_ENV` | Application runtime environment | `development` |
 
Example:
 
```bash
PORT=3000 NODE_ENV=development npm start
