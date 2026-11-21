# Authentication and Custom Middlewares

Middlewares handle cross-cutting concerns: request authentication, tenant identification, activity logging, validation, and file handling.

---

## 1. Authentication Middleware (`src/middleware/auth/index.js`)

The authentication layer must be modular and support multiple modes: JWT bearer tokens, service-to-service keys, and internal API keys.

### Core Contract
1. Verifies credentials (JWT signature against public key, or service key equality).
2. Attaches authenticated context to `req`:
   - `req.user`: user details (id, email, roles).
   - `req.orgId` or `req.authenticatedService`: organization/tenant ID, service origin, permissions.
3. Exposes composable guard middlewares:
   - `requireAuth`: Enforces valid user or service credentials.
   - `optionalAuth`: Extracts user/tenant context if token is present, but doesn't block unauthenticated requests.
   - `requireApiKeyAuth`: Validates service-to-service / API key authentication.
   - `requireAdmin` / `requireRole(role)`: Role-based access control.

### Implementation Pattern

```javascript
// src/middleware/auth/index.js
import { ApiError } from "../../errors/api-error.js";
import { appConfig } from "../../config/app-config.js";

/**
 * Validates bearer token or API key and sets tenant/user context
 */
export const requireAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const apiKey = req.headers["x-api-key"];

        // 1. Service-to-service API key auth
        if (apiKey && apiKey === appConfig.SERVICE_KEY) {
            req.authenticatedService = {
                type: "service",
                name: "internal",
                orgId: req.headers["x-org-id"] || "system",
            };
            req.orgId = req.authenticatedService.orgId;
            return next();
        }

        // 2. Bearer token auth
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw ApiError.unauthorized("Authentication token required");
        }

        const token = authHeader.split(" ")[1];

        // Replace with your verification logic (e.g. jwt.verify with public key)
        const decoded = verifyToken(token);

        req.user = decoded;
        req.orgId = decoded.orgId || req.headers["x-org-id"];

        if (!req.orgId) {
            throw ApiError.unauthorized("Tenant/organization context missing in token");
        }

        next();
    } catch (err) {
        if (err instanceof ApiError) return next(err);
        return next(ApiError.unauthorized(err.message || "Invalid or expired token"));
    }
};

/**
 * Helper to generate role-checking middleware
 */
export const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return next(ApiError.forbidden(`Requires ${role} permission`));
        }
        next();
    };
};

/**
 * Service-to-service authentication middleware factory
 */
export const authenticateService = (options = {}) => {
    return (req, res, next) => {
        return requireAuth(req, res, next);
    };
};

export default requireAuth;

function verifyToken(token) {
    // Stub: Integrate with your crypto / JWT library
    if (!token) throw new Error("Empty token");
    return { id: "user_123", orgId: "org_default", role: "member" };
}
```

---

## 2. Activity / Audit Logging Middleware (`src/middleware/activity.middleware.js`)

Captures user actions, modifications, or API calls for security auditing without breaking the request lifecycle.

```javascript
// src/middleware/activity.middleware.js
export const logActivity = (action) => {
    return (req, res, next) => {
        // Intercept response finish event to record outcome
        res.on("finish", async () => {
            if (res.statusCode < 400) {
                const activity = {
                    action,
                    orgId: req.orgId || req.user?.orgId,
                    userId: req.user?.id,
                    method: req.method,
                    path: req.originalUrl,
                    statusCode: res.statusCode,
                    ip: req.ip,
                    timestamp: new Date().toISOString(),
                };
                
                // Publish to message queue or audit log service asynchronously
                try {
                    // await publishAuditLog(activity);
                } catch (err) {
                    console.error("[ActivityLog] Failed to record activity:", err.message);
                }
            }
        });

        next();
    };
};
```

---

## 3. Upload Middleware (`src/middleware/upload.middleware.js`)

Safe file upload handling with multer, restricting file size and destination:

```javascript
// src/middleware/upload.middleware.js
import multer from "multer";
import path from "path";
import fs from "fs";
import { appConfig } from "../config/app-config.js";

const uploadDirectory = appConfig.UPLOAD_DIR || "/tmp/uploads";
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDirectory),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
});

export const uploadMiddleware = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
});
```
