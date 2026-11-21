// examples/app-config.example.js
/**
 * Phase 2 Configuration: Typed and centralized application configuration
 */
import { Config } from "./env.example.js";

export const appConfig = {
    // Environment
    NODE_ENV: Config.get("NODE_ENV", "development"),
    PORT: parseInt(Config.get("PORT", 8080), 10),
    APP_NAME: Config.get("APP_NAME", "sample-service"),
    APP_VERSION: Config.get("APP_VERSION", "1.0.0"),
    BASE_URL: Config.get("BASE_URL", "http://localhost:8080"),

    // Database & Storage
    DB_NAME: Config.get("DB_NAME", "sample_db"),
    UPLOAD_DIR: Config.get("UPLOAD_DIR", "/data/uploads"),

    // Auth & Security
    SERVICE_KEY: Config.get("SERVICE_KEY"),
    PUBLIC_KEY_PATH: Config.get("PUBLIC_KEY_PATH", "/app/keys/public.pem"),

    // Service URLs
    AUTH_SERVICE_URL: Config.get("AUTH_SERVICE_URL", "http://auth-service"),
    UI_SERVICE_URL: Config.get("UI_SERVICE_URL", "http://localhost:3000"),

    // Telemetry & Flags
    ENABLE_TELEMETRY: Config.get("ENABLE_TELEMETRY", "false") === "true",
};
