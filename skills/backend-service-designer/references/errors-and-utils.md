# Errors and Utilities Architecture

Standardized error propagation, error normalization, and response formatting are essential for consistent API contracts across all microservices.

---

## 1. Custom API Error (`src/errors/api-error.js`)

Extends JavaScript's native `Error` class and encapsulates HTTP status codes, structured metadata, and custom operational flags.

```javascript
// src/errors/api-error.js

export class ApiError extends Error {
    /**
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Human-readable error description
     * @param {Object} [meta={}] - Additional contextual metadata (validation errors, entity IDs)
     */
    constructor(statusCode, message, meta = {}) {
        super(message);
        this.statusCode = statusCode;
        this.meta = meta;
        this.success = false;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    // Common Factory Methods
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

    static validationError(message = "Validation error", meta = {}) {
        return new ApiError(400, message, meta);
    }

    static preconditionFailed(message = "Precondition failed", meta = {}) {
        return new ApiError(412, message, meta);
    }

    static internal(message = "Internal server error", meta = {}) {
        return new ApiError(500, message, meta);
    }
}

export default ApiError;
```

---

## 2. Controller Error Catcher (`src/errors/catch-error.js`)

Eliminates repetitive `try/catch` boilerplate in controllers by wrapping async handler functions and automatically piping thrown errors into `next(err)`.

```javascript
// src/errors/catch-error.js

/**
 * Wraps an async controller function to forward errors to the Express error handler
 * @param {Function} controller - Async controller function (req, res, next)
 * @returns {Function} Express middleware function
 */
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
```

---

## 3. Global Error Middleware (`src/middleware/error-handler.js`)

Intercepts all errors emitted via `next(err)` and formats them into a predictable JSON envelope.

```javascript
// src/middleware/error-handler.js
import { ApiError } from "../errors/api-error.js";

export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    // 1. ApiError instances
    if (err instanceof ApiError) {
        if (err.statusCode >= 500) {
            console.error(`[ApiError ${err.statusCode}]`, err.message, err.stack);
        } else {
            console.warn(`[ApiError ${err.statusCode}]`, err.message);
        }

        return res.status(err.statusCode).json({
            status: 0,
            message: err.message,
            ...(err.meta && Object.keys(err.meta).length > 0 && { data: err.meta }),
        });
    }

    // 2. Mongoose / MongoDB Duplicate Key Error
    if (err.code === 11000) {
        return res.status(409).json({
            status: 0,
            message: "Duplicate entry found",
            data: err.keyValue,
        });
    }

    // 3. Mongoose Validation Errors
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors || {}).map((e) => e.message);
        return res.status(400).json({
            status: 0,
            message: messages.join(", ") || "Validation error",
        });
    }

    // 4. JWT Errors
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        return res.status(401).json({
            status: 0,
            message: "Invalid or expired token",
        });
    }

    // 5. Unhandled Generic Errors (500)
    console.error("[Unhandled Error]", err);
    return res.status(500).json({
        status: 0,
        message: "Internal server error",
    });
}

export default errorHandler;
```

---

## 4. Standard API Response Helper (`src/utils/api-response.js`)

Encapsulates the standard `{ status: 1, message, data, meta }` response envelope.

```javascript
// src/utils/api-response.js

export class ApiResponse {
    /**
     * Send a 200 OK success response
     * @param {Object} res - Express response object
     * @param {Object} data - Payload data or { data, meta }
     * @param {string} [message="Success"] - Informative message
     * @param {number} [statusCode=200] - HTTP status code
     */
    static success(res, data = {}, message = "Success", statusCode = 200) {
        const hasMeta = data && typeof data === "object" && "meta" in data;
        const payloadData = hasMeta ? data.data : data;

        return res.status(statusCode).json({
            status: 1,
            message,
            data: payloadData !== undefined ? payloadData : {},
            ...(hasMeta && data.meta && { meta: data.meta }),
        });
    }

    /**
     * Send a 201 Created response
     * @param {Object} res - Express response object
     * @param {Object} data - Payload data
     * @param {string} [message="Resource created successfully"]
     */
    static created(res, data = {}, message = "Resource created successfully") {
        return ApiResponse.success(res, data, message, 201);
    }
}

export default ApiResponse;
```

---

## 5. General Utilities (`src/utils/utils.js`)

Common helpers for URL building, sanitization, regex escaping, and query helpers:

```javascript
// src/utils/utils.js
import crypto from "crypto";

export function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getRandomString(bytes = 8) {
    return crypto.randomBytes(bytes).toString("hex");
}

export function buildDatabaseUrl({ user, pass, host, port, dbName }) {
    if (user && pass) {
        return `mongodb://${user}:${pass}@${host}:${port}/${dbName}?authSource=admin`;
    }
    return `mongodb://${host}:${port}/${dbName}`;
}
```
