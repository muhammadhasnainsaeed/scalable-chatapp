# Scalable Chat App

This repository contains a horizontally-scalable, real-time chat system built as a Turborepo monorepo. It includes a TypeScript-based Web client (`web`), a Node/TypeScript real-time server (`server`), and shared UI/config packages.

This README explains how the system works, how to run it locally, scaling considerations, and next steps for production.

## Table of Contents

- [What this project is](#what-this-project-is)
- [Architecture & components](#architecture--components)
- [How it works (request flow)](#how-it-works-request-flow)
- [Features](#features)
- [Run & develop locally](#run--develop-locally)
- [Production & scaling guidance](#production--scaling-guidance)
- [Environment & configuration notes](#environment--configuration-notes)
- [Troubleshooting](#troubleshooting)
- [Next steps and improvements](#next-steps-and-improvements)

## What this project is

A real-time chat system designed to be scalable and simple to extend. The server uses Socket.IO for WebSocket communication and Redis (via `ioredis`) as a pub/sub backbone so multiple server instances can broadcast messages to all connected clients.

Key goals:

- Simple developer experience for local development (single-command dev).
- Horizontal scalability using Redis pub/sub (can be adapted to Socket.IO Redis adapter or Kafka for higher throughput).
- Clear separation between web client and server.

## Architecture & components

Repository layout (high-level):

- `apps/server` — Node + TypeScript Socket.IO server that accepts websocket connections and publishes/receives messages via Redis pub/sub.
- `apps/web` — Next.js/React client that connects to the server via sockets (client implementation found in `app` / `context/SocketProvider.tsx`).
- `packages/ui` — shared UI components used by the frontend.

The server currently uses `ioredis` to publish messages to a `MESSAGES` channel and subscribes to the same channel to broadcast incoming messages to connected sockets.

## How it works (request flow)

1. Client opens a WebSocket connection to the server (Socket.IO).
2. When a client sends a chat message (for example `event:message`), the server receives it and publishes it to Redis on the `MESSAGES` channel.
3. Every server instance subscribes to the Redis `MESSAGES` channel. When a message is published, each instance receives the Redis event and emits the message to its locally connected sockets.
4. The client(s) listening for `message` events display the new chat message.

This approach decouples message receipt from message broadcast and allows multiple server instances to stay in sync using Redis as a simple message bus.

## Features

- Real-time messaging via Socket.IO
- Redis-backed pub/sub so multiple server instances can coordinate
- Monorepo structure (web, server, shared UI)
- TypeScript throughout

## Run & develop locally

Prerequisites

- Node.js >= 18 (the monorepo `engines` requires Node >=18)
- npm (this repo uses npm workspaces by default)
- Redis server running locally (default config in `apps/server/src/services/socket.ts` points to `127.0.0.1:6379`)

Install dependencies (from repository root):

```bash
npm install
```

Run the entire monorepo in development (uses Turborepo tasks):

```bash
npm run dev
```

Run the server only (helpful during development):

```bash
cd apps/server
npm install
npm run dev
```

Run the web app only:

```bash
cd apps/web
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

Start the compiled server (after building):

```bash
cd apps/server
npm run start
```

## Production & scaling guidance

The current code already uses Redis pub/sub which lets multiple server instances broadcast messages to all connected clients. For production, consider these improvements:

- Use the official Socket.IO Redis adapter (socket.io-redis) instead of a custom pub/sub for better integration and performance.
- Configure server instances behind a load balancer. If using WebSockets (Socket.IO), either:
  - Enable sticky sessions on the load balancer so a client stays attached to the same instance, or
  - Use the Redis adapter (recommended), which avoids the need for sticky sessions.
- Use a managed Redis (or Redis cluster) for high availability and throughput.
- Persist chat history in a database (e.g., PostgreSQL, MongoDB, or Cassandra) for long-term storage and retrieval.
- For higher throughput / ordering guarantees, consider replacing Redis pub/sub with a durable streaming system (e.g., Kafka, Pulsar).
- Add authentication/authorization (JWT or session-based auth) to validate users and control access to rooms.
- Add rate-limiting (per-IP or per-user) and input validation to mitigate abuse.

## Environment & configuration notes

- The server's current Redis configuration is set in `apps/server/src/services/socket.ts` (host `127.0.0.1`, port `6379`). For production, move these values to environment variables.
- Default server port is `8000` (see `apps/server/src/index.ts`). Set `PORT` when starting the server to override.

Example environment variables to add (suggested):

```
PORT=8000
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Troubleshooting

- If the server does not start, check the console for errors and ensure Redis is reachable at the configured address.
- If messages are not broadcast between instances, ensure each instance can connect to Redis and that they subscribe/publish to the same channel.
- For CORS/socket connection errors, verify the allowed origins on the server Socket.IO configuration.

## Next steps and improvements

- Move Redis config to environment variables and securely manage secrets (Vault/managed secrets).
- Add authentication (user identity), rooms, typing indicators, presence tracking, and message persistence.
- Add tests: unit tests for server logic and integration tests for end-to-end socket flows.
- Add monitoring and metrics (Prometheus, Grafana) and centralized logs (ELK/Datadog).
- Add CI/CD pipeline that builds, tests, and deploys the server and web apps.

---

If you'd like, I can:

- update the server to read Redis config from environment variables,
- wire up the Socket.IO Redis adapter,
- add a minimal message persistence layer (e.g., SQLite or PostgreSQL) and simple tests,
- or create a short deployment guide for Kubernetes or a cloud provider.

Tell me which of the above you'd like me to implement next and I'll create a plan and apply changes.
