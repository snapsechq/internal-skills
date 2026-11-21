---
name: backend-service-designer
description: >-
  Bootstrap, design, structure, or refactor production-ready Node.js / Express backend microservices
  and REST APIs following enterprise architectural standards with strict ES6 modules. Make sure to use
  this skill whenever the user asks to create a new backend service, bootstrap a microservice, refactor
  an existing backend application, design or add controllers, services, routes, Swagger OpenAPI 3.0
  documentation, environment configuration (env.js / app-config.js), modular app setup (setup-app,
  setup-middlewares, setup-routes), authentication middlewares, cron jobs, background workers, or
  standardized ApiError and ApiResponse utilities, even if they simply say "create an API", "build a service",
  or "refactor my backend".
---

# Backend Service Designer

A comprehensive architectural skill for bootstrapping, structuring, and refactoring enterprise-grade Node.js and Express backend microservices using pure ES6 modules.

This skill defines the structural contracts, lifecycle patterns, and layered boundaries without coupling to any single domain's business logic. Domain implementation details are specified by the prompt or the operator.

---

## When to Use This Skill

Activate this skill when:
- **Bootstrapping** a new backend microservice or REST API from scratch.
- **Refactoring** an existing backend service into clean, modular, and maintainable layers.
- **Configuring** environment management with fail-fast validation and typed app config (`src/config`).
- **Designing** controllers, services, and routes following strict 3-tier REST separation (`src/controllers`, `src/services`, `src/routes`).
- **Documenting** APIs with standalone OpenAPI 3.0 Swagger specs (`src/swagger`).
- **Orchestrating** app initialization and middleware pipelines (`src/setup`, `src/app.js`).
- **Implementing** authentication guards, RBAC, and custom request hooks (`src/middleware`).
- **Scheduling** background crons (`src/crons`), async event workers (`src/workers`), error wrappers (`src/errors`), and response helpers (`src/utils`).

---

## Strict ES6 Module Standards

Every service created or refactored with this skill **must strictly adhere to ECMAScript 6 (ES6) modules**:

1. **`"type": "module"` in `package.json`**:
   The root `package.json` must declare `"type": "module"`.
2. **Mandatory `.js` Extensions on Relative Imports**:
   Under Node.js ES modules, all relative imports must explicitly include the file extension:
   - ❌ `import { appConfig } from './config/app-config';`
   - ✅ `import { appConfig } from './config/app-config.js';`
3. **Zero CommonJS Syntax**:
   Never use `require()`, `module.exports`, or `exports` in application source code (`src/*.js`). Use `import` and `export` statements exclusively.
4. **Dynamic Imports**:
   Use `await import(...)` for asynchronous, lazy, or conditional module loading.

See [references/es6-modules-standards.md](./references/es6-modules-standards.md) for full details.

---

## Core Architecture Overview

Services follow a modular 7-layer architecture designed for multi-tenancy, high testability, and clean separation of concerns:

```text
HTTP Request / Queue Event / Scheduled Tick
    │
    ▼
┌────────────────────────────────────────────────────────┐
│ 1. Configuration Layer (src/config/)                   │
│    - env.js: REQUIRED_VARS, Config.check(), Config.get │
│    - app-config.js: Centralized typed configuration    │
└────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────┐
│ 2. Database & Persistence Layer (src/database/)        │
│    - connect.js: Exports connectDb() connection helper │
│    - models/<name>.model.js: Lowercase model files     │
│      exporting named model classes { Entity }          │
└────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────┐
│ 3. App Lifecycle & Pipeline (src/app.js, src/setup/)   │
│    - app.js: Entry point, Config.check(), connectDb()  │
│    - setup-app.js: Calls setupMiddlewares & routes     │
│    - setup-middlewares.js: CORS, body parsers, cookies │
│    - setup-routes.js: Swagger, API routes, errorHandle │
└────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────┐
│ 4. Routing & Versioning (src/routes/)                  │
│    - index.routes.js: Mounts /v1 and /health           │
│    - v1/index.js: Aggregates resource routes           │
│    - v1/<domain>.routes.js: Maps HTTP verbs to handler │
└────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────┐
│ 5. Controllers (src/controllers/)                      │
│    - Static arrow functions wrapped in catchError()    │
│    - Zero try/catch blocks                             │
│    - Extracts params/body/orgId -> Calls Service       │
│    - Formats response via ApiResponse.success()        │
└────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────┐
│ 6. Services & Business Logic (src/services/)           │
│    - Static async methods with named argument objects  │
│    - Multi-tenant query isolation (orgId scoping)      │
│    - Throws ApiError for domain/validation issues      │
│    - Returns { data, meta: { total, page, limit } }    │
└────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────┐
│ 7. OpenAPI Documentation (src/swagger/)                │
│    - index.js: swagger-jsdoc & UI mounting             │
│    - routes/<domain>.swagger.js: Dedicated JSDoc specs │
└────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────┐
│ 8. Asynchronous & Shared Primitives                    │
│    - src/crons/: Overlap-guarded scheduled jobs        │
│    - src/workers/: Queue consumers & message handlers  │
│    - src/middleware/: Auth guards & errorHandler       │
│    - src/errors/: ApiError, catchError                 │
│    - src/utils/: ApiResponse, URL & string helpers     │
└────────────────────────────────────────────────────────┘
```

---

## The 6 Architectural Pillars

### 1. Two-Phase Configuration (`src/config/`)
Configuration is split into raw verification and typed application settings:
- **`src/config/env.js`**: Defines `REQUIRED_VARS` array and the `Config` class. `Config.check()` validates that all mandatory variables exist at startup and throws descriptive errors immediately if missing. `Config.get(key, default)` provides safe access.
- **`src/config/app-config.js`**: Exports a single `appConfig` object with typed numbers, booleans, paths, and downstream service URLs.
- **Golden Rule**: Never read `process.env` directly outside `src/config/`.
- Deep Dive: [references/configuration-pattern.md](./references/configuration-pattern.md) | [examples/env.example.js](./examples/env.example.js)

### 2. Database & Persistence Layer (`src/database/`)
The persistence layer decouples connection management and schema models:
- **`src/database/connect.js`**: Exports a `connectDb()` async function that connects to the database with retry/failover logic. Never scatter connection logic across services.
- **`src/database/models/`**: Stores Mongoose/ORM models using lowercase file names (e.g. `users.model.js`, `products.model.js`).
- **Named Exports**: Every model file must export its model as a named export (e.g., `export const User = ...` or `export { User }`). Services import named models: `import { User } from '../database/models/users.model.js';`.

### 3. Application Setup & Lifecycle (`src/app.js` & `src/setup/`)
Bootstrapping is decoupled into dedicated setup files:
- **`src/app.js`**: The main entry point. Executes `Config.check()`, initializes database connection via `await connectDb()`, instantiates Express, calls `setupApp(app)`, binds to `PORT`, and sets up `SIGTERM`/`SIGINT` graceful shutdown.
- **`src/setup/setup-app.js`**: Orchestrates middleware and route setup in order.
- **`src/setup/setup-middlewares.js`**: Configures CORS (with origin whitelist and localhost regex), JSON body parsers (`limit: '50mb'`), URL encoding, cookie parser, and Morgan logging.
- **`src/setup/setup-routes.js`**: Mounts Swagger UI, mounts API routes under a service prefix, and mounts the global `errorHandler` **last**.
- Deep Dive: [references/app-setup-and-lifecycle.md](./references/app-setup-and-lifecycle.md) | [examples/app.example.js](./examples/app.example.js)

### 3. Controllers, Services, and Routes (`src/controllers/`, `src/services/`, `src/routes/`)
- **Controllers (`src/controllers/<name>.controller.js`)**:
  - Export class with static arrow functions.
  - Every handler MUST be wrapped with `catchError(async (req, res, next) => { ... })`.
  - Zero `try/catch` in controllers.
  - Extracts parameters (`req.params`, `req.query`, `req.body`) and tenant context (`req.authenticatedService?.orgId` or `req.user?.orgId`).
  - Calls Service passing a single options object: `await ItemService.list({ ...args, orgId })`.
  - Returns responses via `ApiResponse.success(res, result, "Message")` or `ApiResponse.created(res, result)`.
- **Services (`src/services/<name>.service.js`)**:
  - Export class with `static async` methods.
  - Always accept a single destructured parameter object: `static async list({ orgId, page, limit })`.
  - Enforce tenant isolation on every query: `{ orgId, ... }`.
  - Throw `ApiError` instances (`ApiError.badRequest`, `ApiError.notFound`, `ApiError.conflict`, `ApiError.unauthorized`).
  - Use `.lean()` for read performance and return `{ data, meta }` for paginated results.
- **Routes (`src/routes/v1/<name>.routes.js`)**:
  - Uses Express `Router()`.
  - Mounts route-level auth: `router.use(requireAuth)`.
  - Standard REST mappings: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`.
  - Default export `export default router;`.
- Deep Dive: [references/controllers-services-routes.md](./references/controllers-services-routes.md) | [examples/controller.example.js](./examples/controller.example.js)

### 4. OpenAPI 3.0 Swagger Documentation (`src/swagger/`)
- **Clean Separation**: Swagger specs are NOT written inside controllers or route files. They live in dedicated files in `src/swagger/routes/<name>.swagger.js`.
- **`src/swagger/index.js`**: Configures `swagger-jsdoc` with OpenAPI 3.0, defines `bearerAuth` and `apiKeyAuth` schemes, and serves the UI at `/swagger` and raw spec at `/swagger.json`.
- **Validation**: Verify specs compile with zero syntax errors before deployment:
  ```bash
  node -e "import('./src/swagger/index.js')"
  ```
- Deep Dive: [references/swagger-documentation.md](./references/swagger-documentation.md) | [examples/swagger.example.js](./examples/swagger.example.js)

### 5. Authentication & Custom Middlewares (`src/middleware/`)
- **`src/middleware/auth/index.js`**: Modular authentication module supporting Bearer JWT tokens and service-to-service API keys (`x-api-key`). Attaches `req.user` and `req.orgId` (or `req.authenticatedService`).
- **`src/middleware/error-handler.js`**: Global 4-argument Express error middleware. Formats `ApiError`, MongoDB duplicates (`11000`), Mongoose validation errors, and JWT expiration into `{ status: 0, message, data }`.
- Deep Dive: [references/middleware-and-auth.md](./references/middleware-and-auth.md) | [examples/error-handler.example.js](./examples/error-handler.example.js)

### 6. Crons, Workers, Errors, and Utils
- **Crons (`src/crons/`)**: Scheduled jobs run as a standalone process via `src/crons/main.cron.js`. Every cron function must implement an `isRunning` lock guard to prevent overlapping ticks, wrapped in `try/catch/finally`.
- **Workers (`src/workers/`)**: Asynchronous message consumers run as a standalone process via `src/workers/main.js`. Implements idempotent processing and structured logging.
- **Errors (`src/errors/`)**:
  - `ApiError`: Extends `Error` with `statusCode`, `meta`, and factory helpers (`badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `internal`).
  - `catchError`: Wraps async controller handlers to forward exceptions to `next(err)`.
- **Utils (`src/utils/`)**:
  - `ApiResponse`: Standard envelope helper `ApiResponse.success(res, data, message, statusCode = 200)` and `ApiResponse.created(res, data, message)`.
- Deep Dive: [references/crons-and-workers.md](./references/crons-and-workers.md) | [references/errors-and-utils.md](./references/errors-and-utils.md)

---

## Bundled Automation Scripts

This skill bundles automated scripts for rapid development and compliance validation:

### 1. Scaffold a New Service
Generate a fully configured microservice directory adhering to this exact architecture in seconds:
```bash
node scripts/scaffold-service.js --target ./services/billing-service --name billing-service --port 8085 --entity invoice
```

### 2. Validate Architecture & ES6 Compliance
Inspect an existing service directory for required layers, `"type": "module"`, explicit `.js` import extensions, and absence of CommonJS:
```bash
node scripts/validate-service.js ./services/billing-service
```

---

## Step-by-Step Guide: Adding a New Resource

When adding a new entity (e.g., `Webhook`) to a service:
1. **Create Model**: `src/database/models/webhooks.model.js` with lowercase naming and named export `export const Webhook = mongoose.models.Webhook || mongoose.model('Webhook', WebhookSchema);`.
2. **Create Service**: `src/services/webhook.service.js` with static async methods, importing `{ Webhook }` from `../database/models/webhooks.model.js`, `orgId` isolation, and `ApiError`.
3. **Create Controller**: `src/controllers/webhook.controller.js` using static arrow methods, `catchError`, and `ApiResponse`.
4. **Create Route**: `src/routes/v1/webhook.routes.js` with REST verbs and `requireAuth`.
5. **Mount Route**: Register the route in `src/routes/v1/index.js` (`router.use('/webhooks', webhookRoutes)`).
6. **Create Swagger**: Document in `src/swagger/routes/webhook.swagger.js` and validate with `node -e "import('./src/swagger/index.js')"`.

---

## Quick Reference Index

| Topic | Reference Document | Example File |
| :--- | :--- | :--- |
| Architecture Topology | [architecture-overview.md](./references/architecture-overview.md) | [app.example.js](./examples/app.example.js) |
| Environment & Config | [configuration-pattern.md](./references/configuration-pattern.md) | [env.example.js](./examples/env.example.js) |
| App Setup & Pipeline | [app-setup-and-lifecycle.md](./references/app-setup-and-lifecycle.md) | [setup-app.example.js](./examples/setup-app.example.js) |
| Controllers, Services, Routes | [controllers-services-routes.md](./references/controllers-services-routes.md) | [controller.example.js](./examples/controller.example.js) |
| OpenAPI 3.0 Swagger | [swagger-documentation.md](./references/swagger-documentation.md) | [swagger.example.js](./examples/swagger.example.js) |
| Auth & Middlewares | [middleware-and-auth.md](./references/middleware-and-auth.md) | [error-handler.example.js](./examples/error-handler.example.js) |
| Crons & Workers | [crons-and-workers.md](./references/crons-and-workers.md) | [cron.example.js](./examples/cron.example.js) |
| Errors & ApiResponse | [errors-and-utils.md](./references/errors-and-utils.md) | [api-response.example.js](./examples/api-response.example.js) |
| ES6 Module Rules | [es6-modules-standards.md](./references/es6-modules-standards.md) | `package.json` |
