#!/usr/bin/env node
/**
 * Scaffold a new backend microservice conforming to the enterprise architecture.
 * Usage:
 *   node scripts/scaffold-service.js --target /path/to/target-service --name my-service --port 8080 --entity item
 */

import fs from "fs";
import path from "path";

// Parse CLI flags
const args = process.argv.slice(2);
const options = {
    target: ".",
    name: "my-service",
    port: "8080",
    entity: "item",
};

for (let i = 0; i < args.length; i++) {
    if (args[i] === "--target" && args[i + 1]) options.target = args[++i];
    if (args[i] === "--name" && args[i + 1]) options.name = args[++i];
    if (args[i] === "--port" && args[i + 1]) options.port = args[++i];
    if (args[i] === "--entity" && args[i + 1]) options.entity = args[++i].toLowerCase();
}

const targetDir = path.resolve(process.cwd(), options.target);
const entityCap = options.entity.charAt(0).toUpperCase() + options.entity.slice(1);
const entityLower = options.entity.toLowerCase();
const entityPlural = entityLower.endsWith("s") ? entityLower : entityLower + "s";

console.log(`\n🚀 Scaffolding new backend service '${options.name}' at: ${targetDir}`);
console.log(`- Port: ${options.port}`);
console.log(`- Sample Entity: ${entityCap} (${entityPlural})`);
console.log(`- Architecture: Enterprise ES6 Modular REST API\n`);

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function writeFile(filePath, content) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content.trim() + "\n", "utf8");
    const rel = path.relative(targetDir, filePath);
    console.log(`  [+] Created: ${rel}`);
}

// 1. package.json
writeFile(path.join(targetDir, "package.json"), JSON.stringify({
    name: options.name,
    version: "1.0.0",
    type: "module",
    main: "src/app.js",
    scripts: {
        start: "node src/app.js",
        dev: "node --watch src/app.js",
        workers: "node src/workers/main.js",
        crons: "node src/crons/main.cron.js",
        validate: "node -e \"import('./src/swagger/index.js')\""
    },
    dependencies: {
        "express": "^5.0.0",
        "cors": "^2.8.5",
        "morgan": "^1.10.0",
        "cookie-parser": "^1.4.6",
        "swagger-jsdoc": "^6.2.8",
        "swagger-ui-express": "^5.0.0",
        "node-cron": "^3.0.3"
    }
}, null, 2));

// 2. ecosystem.config.cjs
writeFile(path.join(targetDir, "ecosystem.config.cjs"), `
module.exports = {
    apps: [
        {
            name: "${options.name}-server",
            script: "src/app.js",
            instances: 1,
            exec_mode: "cluster",
            autorestart: true,
            max_memory_restart: "2G"
        },
        {
            name: "${options.name}-workers",
            script: "src/workers/main.js",
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            max_memory_restart: "2G"
        },
        {
            name: "${options.name}-cron",
            script: "src/crons/main.cron.js",
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            max_memory_restart: "2G"
        }
    ]
};
`);

// 3. src/config/env.js
writeFile(path.join(targetDir, "src/config/env.js"), `
const REQUIRED_VARS = [
    "PORT",
    "NODE_ENV",
    "SERVICE_KEY"
];

export class Config {
    static check() {
        for (const varName of REQUIRED_VARS) {
            if (!process.env[varName]) {
                throw new Error(\`[Config Error] Missing required environment variable: \${varName}\`);
            }
        }
    }

    static get(key, defaultValue = undefined) {
        return process.env[key] !== undefined && process.env[key] !== "" 
            ? process.env[key] 
            : defaultValue;
    }
}
`);

// 4. src/config/app-config.js
writeFile(path.join(targetDir, "src/config/app-config.js"), `
import { Config } from "./env.js";

export const appConfig = {
    NODE_ENV: Config.get("NODE_ENV", "development"),
    PORT: parseInt(Config.get("PORT", ${options.port}), 10),
    APP_NAME: Config.get("APP_NAME", "${options.name}"),
    APP_VERSION: Config.get("APP_VERSION", "1.0.0"),
    BASE_URL: Config.get("BASE_URL", "http://localhost:${options.port}"),
    SERVICE_KEY: Config.get("SERVICE_KEY", "default-service-key"),
    AUTH_SERVICE_URL: Config.get("AUTH_SERVICE_URL", "http://auth-service"),
    UI_SERVICE_URL: Config.get("UI_SERVICE_URL", "http://localhost:3000")
};
`);

// 4b. src/database/connect.js
writeFile(path.join(targetDir, "src/database/connect.js"), `
import mongoose from "mongoose";
import { appConfig } from "../config/app-config.js";

let isConnected = false;

export const connectDb = async () => {
    if (isConnected) return true;
    try {
        const uri = appConfig.MONGODB_URI || "mongodb://localhost:27017/service_db";
        await mongoose.connect(uri);
        isConnected = true;
        console.log("[MongoDB] Connected successfully");
        return true;
    } catch (err) {
        console.warn("[MongoDB] Connection fallback:", err.message);
        isConnected = false;
        return false;
    }
};

export const getDBStatus = () => ({ connected: isConnected });
export default connectDb;
`);

// 4c. src/database/models/${entityPlural}.model.js
writeFile(path.join(targetDir, `src/database/models/${entityPlural}.model.js`), `
import mongoose, { Schema } from "mongoose";

const ${entityCap}Schema = new Schema({
    orgId: { type: String, required: true },
    name: { type: String, required: true },
    status: { type: String, default: "active" },
}, { timestamps: true });

export const ${entityCap} = mongoose.models.${entityCap} || mongoose.model("${entityCap}", ${entityCap}Schema);
export default ${entityCap};
`);

// 5. src/errors/api-error.js
writeFile(path.join(targetDir, "src/errors/api-error.js"), `
export class ApiError extends Error {
    constructor(statusCode, message, meta = {}) {
        super(message);
        this.statusCode = statusCode;
        this.meta = meta;
        this.success = false;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    static badRequest(message = "Bad request", meta = {}) {
        return new ApiError(400, message, meta);
    }

    static unauthorized(message = "Unauthorized", meta = {}) {
        return new ApiError(401, message, meta);
    }

    static forbidden(message = "Forbidden", meta = {}) {
        return new ApiError(403, message, meta);
    }

    static notFound(message = "Resource not found", meta = {}) {
        return new ApiError(404, message, meta);
    }

    static conflict(message = "Conflict", meta = {}) {
        return new ApiError(409, message, meta);
    }

    static internal(message = "Internal server error", meta = {}) {
        return new ApiError(500, message, meta);
    }
}

export default ApiError;
`);

// 6. src/errors/catch-error.js
writeFile(path.join(targetDir, "src/errors/catch-error.js"), `
export function catchError(controller) {
    return async (req, res, next) => {
        try {
            await controller(req, res, next);
        } catch (err) {
            next(err);
        }
    };
}

export default catchError;
`);

// 7. src/errors/index.js
writeFile(path.join(targetDir, "src/errors/index.js"), `
import { ApiError } from "./api-error.js";
import { catchError } from "./catch-error.js";

export { ApiError, catchError };
export default { ApiError, catchError };
`);

// 8. src/utils/api-response.js
writeFile(path.join(targetDir, "src/utils/api-response.js"), `
export class ApiResponse {
    static success(res, data = {}, message = "Success", statusCode = 200) {
        const hasMeta = data && typeof data === "object" && "meta" in data;
        const payloadData = hasMeta ? data.data : data;

        return res.status(statusCode).json({
            status: 1,
            message,
            data: payloadData !== undefined ? payloadData : {},
            ...(hasMeta && data.meta && { meta: data.meta })
        });
    }

    static created(res, data = {}, message = "Resource created successfully") {
        return ApiResponse.success(res, data, message, 201);
    }
}

export default ApiResponse;
`);

// 9. src/utils/utils.js
writeFile(path.join(targetDir, "src/utils/utils.js"), `
import crypto from "crypto";

export function escapeRegex(string) {
    return string.replace(/[.*+?^$\\{}()|[\\]\\\\]/g, "\\\\$&");
}

export function getRandomId(bytes = 8) {
    return crypto.randomBytes(bytes).toString("hex");
}
`);

// 10. src/middleware/error-handler.js
writeFile(path.join(targetDir, "src/middleware/error-handler.js"), `
import { ApiError } from "../errors/api-error.js";

export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof ApiError) {
        if (err.statusCode >= 500) {
            console.error(\`[ApiError \${err.statusCode}]\`, err.message, err.stack);
        } else {
            console.warn(\`[ApiError \${err.statusCode}]\`, err.message);
        }

        return res.status(err.statusCode).json({
            status: 0,
            message: err.message,
            ...(err.meta && Object.keys(err.meta).length > 0 && { data: err.meta })
        });
    }

    console.error("[Unhandled Error]", err);
    return res.status(500).json({
        status: 0,
        message: "Internal server error"
    });
}

export default errorHandler;
`);

// 11. src/middleware/auth/index.js
writeFile(path.join(targetDir, "src/middleware/auth/index.js"), `
import { ApiError } from "../../errors/api-error.js";
import { appConfig } from "../../config/app-config.js";

export const requireAuth = (req, res, next) => {
    try {
        const apiKey = req.headers["x-api-key"];
        if (apiKey && apiKey === appConfig.SERVICE_KEY) {
            req.authenticatedService = {
                type: "service",
                orgId: req.headers["x-org-id"] || "default-org"
            };
            req.orgId = req.authenticatedService.orgId;
            return next();
        }

        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw ApiError.unauthorized("Authentication token required");
        }

        // Mock token decoding (substitute with JWT verifier)
        req.user = { id: "usr_mock", orgId: req.headers["x-org-id"] || "default-org" };
        req.orgId = req.user.orgId;

        next();
    } catch (err) {
        next(err instanceof ApiError ? err : ApiError.unauthorized(err.message));
    }
};

export const authenticateService = () => requireAuth;
export default requireAuth;
`);

// 14. Sample Service
writeFile(path.join(targetDir, `src/services/${entityLower}.service.js`), `
import { ApiError } from "../errors/api-error.js";
import { ${entityCap} } from "../database/models/${entityPlural}.model.js";

const inMemoryStore = new Map();

export class ${entityCap}Service {
    static async list({ orgId, page = 1, limit = 20, search }) {
        if (!orgId) throw ApiError.unauthorized("Organization context required");

        let items = Array.from(inMemoryStore.values()).filter(i => i.orgId === orgId);
        if (search) items = items.filter(i => i.name?.includes(search));

        const total = items.length;
        const data = items.slice((page - 1) * limit, page * limit);

        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 }
        };
    }

    static async getById({ id, orgId }) {
        if (!id) throw ApiError.badRequest("${entityCap} ID required");
        if (!orgId) throw ApiError.unauthorized("Organization context required");

        const item = inMemoryStore.get(id);
        if (!item || item.orgId !== orgId) {
            throw ApiError.notFound("${entityCap} not found");
        }
        return { data: item };
    }

    static async create({ orgId, name, ...rest }) {
        if (!orgId) throw ApiError.unauthorized("Organization context required");
        if (!name) throw ApiError.badRequest("Name is required");

        const id = \`${entityLower}_\${Date.now()}\`;
        const item = { id, orgId, name, ...rest, createdAt: new Date().toISOString() };
        inMemoryStore.set(id, item);

        return { data: item };
    }

    static async update({ id, orgId, updates }) {
        const { data: existing } = await ${entityCap}Service.getById({ id, orgId });
        delete updates.id;
        delete updates.orgId;

        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        inMemoryStore.set(id, updated);
        return { data: updated };
    }

    static async delete({ id, orgId }) {
        await ${entityCap}Service.getById({ id, orgId });
        inMemoryStore.delete(id);
        return { data: { deleted: true, id } };
    }
}
`);

// 13. Sample Controller
writeFile(path.join(targetDir, `src/controllers/${entityLower}.controller.js`), `
import { catchError } from "../errors/catch-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { ${entityCap}Service } from "../services/${entityLower}.service.js";

export class ${entityCap}Controller {
    static list = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const { search } = req.query;

        const result = await ${entityCap}Service.list({ orgId, page, limit, search });
        return ApiResponse.success(res, result, "${entityCap} items fetched successfully");
    });

    static getById = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const { id } = req.params;

        const result = await ${entityCap}Service.getById({ id, orgId });
        return ApiResponse.success(res, result, "${entityCap} fetched successfully");
    });

    static create = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const result = await ${entityCap}Service.create({ ...req.body, orgId });
        return ApiResponse.created(res, result, "${entityCap} created successfully");
    });

    static update = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const { id } = req.params;

        const result = await ${entityCap}Service.update({ id, orgId, updates: req.body });
        return ApiResponse.success(res, result, "${entityCap} updated successfully");
    });

    static delete = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const { id } = req.params;

        const result = await ${entityCap}Service.delete({ id, orgId });
        return ApiResponse.success(res, result, "${entityCap} deleted successfully");
    });
}
`);

// 14. Sample Route
writeFile(path.join(targetDir, `src/routes/v1/${entityLower}.routes.js`), `
import { Router } from "express";
import { ${entityCap}Controller } from "../../controllers/${entityLower}.controller.js";
import { requireAuth } from "../../middleware/auth/index.js";

const router = Router();

router.use(requireAuth);

router.get("/", ${entityCap}Controller.list);
router.get("/:id", ${entityCap}Controller.getById);
router.post("/", ${entityCap}Controller.create);
router.patch("/:id", ${entityCap}Controller.update);
router.put("/:id", ${entityCap}Controller.update);
router.delete("/:id", ${entityCap}Controller.delete);

export default router;
`);

// 15. src/routes/v1/index.js
writeFile(path.join(targetDir, "src/routes/v1/index.js"), `
import express from "express";
import ${entityLower}Routes from "./${entityLower}.routes.js";

const router = express.Router();

router.use("/${entityPlural}", ${entityLower}Routes);

export default router;
`);

// 16. src/routes/index.routes.js
writeFile(path.join(targetDir, "src/routes/index.routes.js"), `
import express from "express";
import v1Routes from "./v1/index.js";

const router = express.Router();

router.use("/v1", v1Routes);
router.use(v1Routes);

router.get("/v1/health", (req, res) => {
    res.status(200).json({ status: "success", message: "OK" });
});

export default router;
`);

// 17. src/swagger/routes/<entity>.swagger.js
writeFile(path.join(targetDir, `src/swagger/routes/${entityLower}.swagger.js`), `
/**
 * @swagger
 * tags:
 *   name: ${entityCap}
 *   description: ${entityCap} APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ${entityCap}:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         orgId:
 *           type: string
 *         name:
 *           type: string
 *         createdAt:
 *           type: string
 */

/**
 * @swagger
 * /${entityPlural}:
 *   get:
 *     summary: List ${entityPlural}
 *     tags: [${entityCap}]
 *     responses:
 *       200:
 *         description: Success
 *   post:
 *     summary: Create ${entityLower}
 *     tags: [${entityCap}]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */

export default {};
`);

// 18. src/swagger/index.js
writeFile(path.join(targetDir, "src/swagger/index.js"), `
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { appConfig } from "../config/app-config.js";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: \`\${appConfig.APP_NAME} API\`,
            version: appConfig.APP_VERSION,
            description: "API Documentation"
        },
        servers: [
            {
                url: "/api/v1",
                description: "V1 API"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ["./src/swagger/routes/*.swagger.js", "./src/swagger/routes/*.js"]
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app) => {
    app.use("/swagger", swaggerUi.serve, swaggerUi.setup(specs));
    app.get("/swagger.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(specs);
    });
};
`);

// 19. src/setup/setup-middlewares.js
writeFile(path.join(targetDir, "src/setup/setup-middlewares.js"), `
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { appConfig } from "../config/app-config.js";

const setupMiddlewares = (app) => {
    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const isLocalhost = /^https?:\\/\\/(localhost|127\\.0\\.0\\.1)(:\\d+)?$/.test(origin);
            if (isLocalhost || origin === appConfig.BASE_URL || origin === appConfig.UI_SERVICE_URL) {
                return callback(null, true);
            }
            return callback(new Error("CORS not allowed"));
        },
        credentials: true,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        allowedHeaders: "Content-Type,Authorization,X-Requested-With,Accept,Origin"
    };

    app.use(cors(corsOptions));
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 100000 }));
    app.use(cookieParser());
    app.use(morgan("tiny", { skip: (req) => req.method === "OPTIONS" }));
};

export default setupMiddlewares;
`);

// 20. src/setup/setup-routes.js
writeFile(path.join(targetDir, "src/setup/setup-routes.js"), `
import router from "../routes/index.routes.js";
import { errorHandler } from "../middleware/error-handler.js";
import { setupSwagger } from "../swagger/index.js";

const setupRoutes = (app) => {
    setupSwagger(app);
    app.use("/api", router);
    app.use(errorHandler);
};

export default setupRoutes;
`);

// 21. src/setup/setup-app.js
writeFile(path.join(targetDir, "src/setup/setup-app.js"), `
import setupMiddlewares from "./setup-middlewares.js";
import setupRoutes from "./setup-routes.js";

const setupApp = (app) => {
    setupMiddlewares(app);
    setupRoutes(app);
};

export default setupApp;
`);

// 22. src/crons/main.cron.js & sample cron
writeFile(path.join(targetDir, "src/crons/main.cron.js"), `
import { syncCron } from "./sync.cron.js";

syncCron();
console.log("[CRON] Crons started.");
`);

writeFile(path.join(targetDir, "src/crons/sync.cron.js"), `
import cron from "node-cron";

export const syncCron = () => {
    let isRunning = false;
    cron.schedule("*/5 * * * *", async () => {
        if (isRunning) return;
        isRunning = true;
        try {
            console.log("[CRON:Sync] Running periodic tick...");
        } catch (err) {
            console.error("[CRON:Sync] Error:", err.message);
        } finally {
            isRunning = false;
        }
    });
};
`);

// 23. src/workers/main.js & sample worker
writeFile(path.join(targetDir, "src/workers/main.js"), `
import { startExampleWorker } from "./example.worker.js";

console.log("[WORKERS] Initializing workers...");
await startExampleWorker();
console.log("[WORKERS] Running.");
`);

writeFile(path.join(targetDir, "src/workers/example.worker.js"), `
export const startExampleWorker = async () => {
    console.log("[Worker:Example] Listening for events...");
};
`);

// 24. src/app.js
writeFile(path.join(targetDir, "src/app.js"), `
import express from "express";
import { Config } from "./config/env.js";
import { appConfig } from "./config/app-config.js";
import { connectDb } from "./database/connect.js";
import setupApp from "./setup/setup-app.js";

Config.check();
await connectDb();

const app = express();
setupApp(app);

const PORT = appConfig.PORT || 8080;
app.listen(PORT, () => {
    console.log(\`[\${appConfig.APP_NAME}] running on port \${PORT}\`);
});

export default app;
`);

console.log(`\n✅ Microservice '${options.name}' successfully scaffolded!\n`);
