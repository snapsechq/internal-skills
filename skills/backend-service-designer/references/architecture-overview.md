# Enterprise Backend Service Architecture

This document details the complete architectural taxonomy, folder structure, and interaction design of standardized backend microservices.

---

## Directory Hierarchy

```text
my-service/
├── package.json                   # "type": "module" strictly enforced
├── ecosystem.config.cjs           # PM2 process manager for HTTP, Workers, Crons
├── src/
│   ├── app.js                     # HTTP server entry point & lifecycle
│   │
│   ├── config/                    # Configuration Layer (Phase 1 & Phase 2)
│   │   ├── env.js                 # REQUIRED_VARS, Config.check(), Config.get()
│   │   └── app-config.js          # Typed, centralized app configuration
│   │
│   ├── setup/                     # Application Pipeline Orchestration
│   │   ├── setup-app.js           # Invokes setupMiddlewares & setupRoutes
│   │   ├── setup-middlewares.js   # CORS, body-parser, cookie, logging
│   │   └── setup-routes.js        # Mounts Swagger, API routes, error-handler
│   │
│   ├── routes/                    # Route Definitions
│   │   ├── index.routes.js        # Root router (versioning + health check)
│   │   └── v1/
│   │       ├── index.js           # Aggregates resource routes
│   │       └── <resource>.routes.js # REST verb & controller mapping
│   │
│   ├── controllers/               # HTTP Request Handlers
│   │   └── <resource>.controller.js # catchError, param parsing, ApiResponse
│   │
│   ├── services/                  # Business Logic Layer
│   │   └── <resource>.service.js  # Static async methods, DB queries, ApiError
│   │
│   ├── database/                  # Persistence Layer
│   │   ├── connect.js             # DB connection helper (connectDb)
│   │   └── models/
│   │       └── <resource>s.model.js # Schema with named export { Resource }
│   │
│   ├── swagger/                   # OpenAPI 3.0 Documentation
│   │   ├── index.js               # swagger-jsdoc & swagger-ui-express setup
│   │   └── routes/
│   │       └── <resource>.swagger.js # JSDoc YAML definitions per resource
│   │
│   ├── middleware/                # Custom Middlewares
│   │   ├── auth/
│   │   │   └── index.js           # requireAuth, requireApiKey, RBAC
│   │   ├── error-handler.js       # Centralized error formatting middleware
│   │   └── activity.middleware.js # Audit / event hooks
│   │
│   ├── crons/                     # Scheduled Jobs (Standalone Process)
│   │   ├── main.cron.js           # Cron process runner & DB connect
│   │   └── <job>.cron.js          # Overlap-safe scheduled job
│   │
│   ├── workers/                   # Async Message Workers (Standalone Process)
│   │   ├── main.js                # Worker process runner & DB connect
│   │   └── <task>.worker.js       # Queue / event consumer
│   │
│   ├── errors/                    # Error Handling Primitives
│   │   ├── index.js               # Barrel export for errors
│   │   ├── api-error.js           # ApiError class with status factories
│   │   └── catch-error.js         # Async controller wrapper
│   │
│   └── utils/                     # Shared Utilities
│       ├── api-response.js        # ApiResponse formatting class
│       └── utils.js               # String, crypto, connection helpers
```

---

## Request Execution Flow

```text
HTTP Client
    │
    ▼
[ src/app.js ]
    │
    ▼
[ src/setup/setup-middlewares.js ] ──► CORS, JSON Body Parser, Morgan Logger
    │
    ▼
[ src/routes/index.routes.js ]     ──► /api/v1/health Check
    │
    ▼
[ src/routes/v1/index.js ]         ──► Route versioning
    │
    ▼
[ src/middleware/auth/index.js ]   ──► Validates JWT/API Key, attaches orgId
    │
    ▼
[ src/routes/v1/<res>.routes.js ]  ──► Maps HTTP Verb & Path to Controller
    │
    ▼
[ src/controllers/<res>.controller.js ]
    ├─► Wrapped by catchError()
    ├─► Extracts params & orgId
    └─► Calls Service.<method>({ ...args, orgId })
            │
            ▼
        [ src/services/<res>.service.js ]
            ├─► Executes business rules
            ├─► Multi-tenant DB query (scoped to orgId)
            ├─► Throws ApiError if validation / resource missing
            └─► Returns raw data & pagination meta
            │
            ▼
    ┌───────┴───────┐
    │ Success       │ Failure (thrown ApiError or native Error)
    ▼               ▼
[ ApiResponse ]  [ src/errors/catch-error.js ]
    │               │ passes to next(err)
    ▼               ▼
HTTP Response    [ src/middleware/error-handler.js ]
                    │
                    ▼
                 Standardized JSON Error { status: 0, message, data }
```
