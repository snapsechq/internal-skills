// examples/error-handler.example.js
import { ApiError } from "./api-error.example.js";

export function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

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

    console.error("[Unhandled Error]", err);
    return res.status(500).json({
        status: 0,
        message: "Internal server error",
    });
}

export default errorHandler;
