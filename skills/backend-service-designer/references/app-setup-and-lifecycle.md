# Application Setup and Lifecycle

A standardized backend service separates application bootstrapping into clean, modular phases located in `src/setup/` and an entry point `src/app.js`.

---

## Lifecycle Flow

```text
[Start: src/app.js]
       │
       ▼
1. Config.check()                --> Validates environment variables
       │
       ▼
2. connectDB()                   --> Establishes DB / Cache connection with retries
       │
       ▼
3. const app = express()         --> Instantiates Express
       │
       ▼
4. setupApp(app)                 --> Runs src/setup/setup-app.js
       │
       ├─► setupMiddlewares(app) --> CORS, parsers, cookies, request logging
       │
       └─► setupRoutes(app)      --> Swagger UI, versioned routes, error handler
       │
       ▼
5. app.listen(PORT)              --> Starts HTTP listener
       │
       ▼
6. Graceful Shutdown Handlers    --> SIGTERM / SIGINT connection cleanup
```

---

## 1. Application Entry Point (`src/app.js`)

```javascript
// src/app.js
import express from "express";
import { Config } from "./config/env.js";
import { appConfig } from "./config/app-config.js";
import { connectDb } from "./database/connect.js";
import setupApp from "./setup/setup-app.js";

// Phase 1: Validate environment variables before doing anything else
Config.check();

// Phase 2: Connect to infrastructure (DB / Cache / Brokers)
await connectDb();

// Phase 3: Create Express app and configure pipeline
const app = express();
setupApp(app);

// Phase 4: Start HTTP listener
const PORT = appConfig.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`[${appConfig.APP_NAME}] running on port ${PORT} in [${appConfig.NODE_ENV}] mode`);
});

// Phase 5: Graceful termination
const shutdown = async (signal) => {
    console.log(`[Lifecycle] Received ${signal}, closing HTTP server gracefully...`);
    server.close(async () => {
        console.log("[Lifecycle] HTTP server closed.");
        // Close DB connections, message queues, workers here
        process.exit(0);
    });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
```

---

## 2. Setup Orchestrator (`src/setup/setup-app.js`)

Aggregates middleware and route configuration:

```javascript
// src/setup/setup-app.js
import setupMiddlewares from "./setup-middlewares.js";
import setupRoutes from "./setup-routes.js";

const setupApp = (app) => {
    setupMiddlewares(app);
    setupRoutes(app);
};

export default setupApp;
```

---

## 3. Middleware Configuration (`src/setup/setup-middlewares.js`)

Configures CORS, parsers, cookies, and HTTP access logging:

```javascript
// src/setup/setup-middlewares.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { appConfig } from "../config/app-config.js";

const setupMiddlewares = (app) => {
    // Dynamic CORS validation
    const corsOptions = {
        origin: (origin, callback) => {
            const allowedOrigins = [
                appConfig.BASE_URL,
                appConfig.UI_SERVICE_URL,
            ];

            // Allow requests without Origin (curl, server-to-server, health checks)
            if (!origin) {
                return callback(null, true);
            }

            // Allow localhost and local IP ranges during development
            const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

            if (allowedOrigins.includes(origin) || isLocalhost) {
                return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS policy"));
        },
        credentials: true,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        allowedHeaders: "Content-Type,Authorization,X-Requested-With,Accept,Origin",
    };

    app.use(cors(corsOptions));

    // Request body parsers with explicit payload limits
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 100000 }));

    app.use(cookieParser());

    // Logging: skip noisy OPTIONS preflights
    app.use(morgan("tiny", {
        skip: (req) => req.method === "OPTIONS"
    }));
};

export default setupMiddlewares;
```

---

## 4. Route & Error Pipeline (`src/setup/setup-routes.js`)

Wires Swagger docs, API routes, and ensures the global error handler is mounted **last**.

```javascript
// src/setup/setup-routes.js
import router from "../routes/index.routes.js";
import { errorHandler } from "../middleware/error-handler.js";
import { setupSwagger } from "../swagger/index.js";

const setupRoutes = (app) => {
    // 1. Attach OpenAPI / Swagger Documentation
    setupSwagger(app);

    // 2. Mount API Routes with service prefix
    app.use("/api", router);

    // 3. Mount Global Error Handler LAST (must be after all routes)
    app.use(errorHandler);
};

export default setupRoutes;
```

---

## Key Principles

- **Separation of Concerns**: `app.js` only handles process lifecycle and server listen. Middleware configuration and routing live in separate dedicated setup files.
- **Error Handler Placement**: `errorHandler` must always be added after all routes in `setup-routes.js`. Express will ignore 4-argument error middlewares if mounted before routes.
- **Export `app`**: Always export `default app` from `src/app.js` so integration tests (e.g., Supertest) can test without binding to an open socket.
