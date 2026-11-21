// examples/app.example.js
/**
 * Application entry point: Lifecycle, DB connection, and HTTP listen
 */
import express from "express";
import { Config } from "./env.example.js";
import { appConfig } from "./app-config.example.js";
import setupApp from "./setup-app.example.js";

// 1. Verify required environment variables
Config.check();

// 2. Initialize database or cache connections
// await connectDB();

// 3. Instantiate Express application
const app = express();

// 4. Mount middlewares and routes
setupApp(app);

// 5. Start HTTP server
const PORT = appConfig.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`[${appConfig.APP_NAME}] running on port ${PORT} [${appConfig.NODE_ENV}]`);
});

// 6. Graceful shutdown
const shutdown = (signal) => {
    console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
        console.log("[Server] Closed HTTP listener.");
        process.exit(0);
    });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default app;
