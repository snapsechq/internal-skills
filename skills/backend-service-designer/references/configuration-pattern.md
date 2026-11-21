# Two-Phase Configuration Pattern

Every backend service must implement a deterministic, two-phase configuration architecture located in `src/config/`.

This pattern ensures:
1. Hard failure during startup if any critical environment variable is absent.
2. Centralized fallback defaults, type coercions, and downstream URL normalization.
3. Zero direct `process.env` calls scattered throughout controllers, services, or utils.

---

## Architecture

```text
       process.env
            │
            ▼
┌─────────────────────────┐
│    src/config/env.js    │  Phase 1: Validation & Raw Access
│   - REQUIRED_VARS       │  - Checks all mandatory variables at boot
│   - Config.check()      │  - Throws immediately if missing
│   - Config.get()        │  - Provides safe getter with fallback
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ src/config/app-config.js│  Phase 2: Typed & Structured App Config
│   - export appConfig    │  - Normalizes booleans, numbers, paths
│   - Service URLs        │  - Exports domain configuration constants
└─────────────────────────┘
```

---

## 1. Raw Environment Manager (`src/config/env.js`)

This file defines the mandatory variable contract and exposes the `Config` helper class.

```javascript
// src/config/env.js

const REQUIRED_VARS = [
    "PORT",
    "NODE_ENV",
    // Infrastructure variables (adapt to service dependencies)
    "MONGODB_HOST",
    "MONGODB_PORT",
    "MONGODB_USER",
    "MONGODB_PASS",
    "SERVICE_KEY"
];

export class Config {
    /**
     * Validate that all mandatory environment variables are populated.
     * Must be called at the very top of application bootstrap (src/app.js).
     * @throws {Error} If any required variable is missing or empty.
     */
    static check() {
        for (const varName of REQUIRED_VARS) {
            if (!process.env[varName]) {
                throw new Error(`[Config Error] Missing required environment variable: ${varName}`);
            }
        }
    }

    /**
     * Retrieve an environment variable with an optional fallback default.
     * @param {string} key - Environment variable name.
     * @param {any} defaultValue - Fallback value if variable is unset.
     * @returns {string|any}
     */
    static get(key, defaultValue = undefined) {
        return process.env[key] !== undefined && process.env[key] !== "" 
            ? process.env[key] 
            : defaultValue;
    }
}
```

---

## 2. Centralized Application Config (`src/config/app-config.js`)

This file transforms raw environment strings into typed values (numbers, booleans, arrays) and defines shared application constants.

```javascript
// src/config/app-config.js
import { Config } from "./env.js";

export const appConfig = {
    // Runtime Environment
    NODE_ENV: Config.get("NODE_ENV", "development"),
    PORT: parseInt(Config.get("PORT", 8080), 10),
    APP_NAME: Config.get("APP_NAME", "my-backend-service"),
    APP_VERSION: Config.get("APP_VERSION", "1.0.0"),
    BASE_URL: Config.get("BASE_URL", "http://localhost:8080"),

    // Database / Storage
    DB_NAME: Config.get("DB_NAME", "service_db"),
    UPLOAD_DIR: Config.get("UPLOAD_DIR", "/data/uploads"),

    // Security & Auth Keys
    SERVICE_KEY: Config.get("SERVICE_KEY"),
    PUBLIC_KEY_PATH: Config.get("PUBLIC_KEY_PATH", "/app/keys/public.pem"),

    // Downstream Service URLs
    AUTH_SERVICE_URL: Config.get("AUTH_SERVICE_URL", "http://auth-service"),
    UI_SERVICE_URL: Config.get("UI_SERVICE_URL", "http://localhost:3000"),

    // Feature Flags & Telemetry
    ENABLE_TELEMETRY: Config.get("ENABLE_TELEMETRY", "false") === "true",
    LOG_LEVEL: Config.get("LOG_LEVEL", "info"),
};
```

---

## Usage Rules

1. **Call `Config.check()` First**: Always execute `Config.check()` in `src/app.js` before initializing database connections, middlewares, or starting the server.
2. **Never Read `process.env` Outside `src/config/`**:
   - ❌ `const port = process.env.PORT || 8080;` inside `src/app.js`
   - ✅ `import { appConfig } from './config/app-config.js'; const port = appConfig.PORT;`
3. **Explicit Type Casting**: Always convert strings to numbers (`parseInt`), booleans (`=== "true"`), or lists in `app-config.js`.
