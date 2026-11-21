// examples/env.example.js
/**
 * Phase 1 Configuration: Environment variable validation and retrieval
 */

const REQUIRED_VARS = [
    "PORT",
    "NODE_ENV",
    "DATABASE_HOST",
    "DATABASE_PORT",
    "DATABASE_USER",
    "DATABASE_PASS",
    "SERVICE_KEY"
];

export class Config {
    /**
     * Asserts that all mandatory environment variables are present.
     * Throws an error on startup if any are missing.
     */
    static check() {
        for (const varName of REQUIRED_VARS) {
            if (!process.env[varName]) {
                throw new Error(`[Config Error] Missing required environment variable: ${varName}`);
            }
        }
    }

    /**
     * Reads an environment variable with an optional default.
     * @param {string} key
     * @param {any} defaultValue
     * @returns {string|any}
     */
    static get(key, defaultValue = undefined) {
        return process.env[key] !== undefined && process.env[key] !== ""
            ? process.env[key]
            : defaultValue;
    }
}
