// examples/setup-middlewares.example.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { appConfig } from "./app-config.example.js";

const setupMiddlewares = (app) => {
    // Dynamic CORS validator
    const corsOptions = {
        origin: (origin, callback) => {
            const allowedOrigins = [
                appConfig.BASE_URL,
                appConfig.UI_SERVICE_URL,
            ];

            // Allow requests with no Origin (internal CLI / server-to-server)
            if (!origin) return callback(null, true);

            const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
            if (allowedOrigins.includes(origin) || isLocalhost) {
                return callback(null, true);
            }

            return callback(new Error("CORS policy violation"));
        },
        credentials: true,
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        allowedHeaders: "Content-Type,Authorization,X-Requested-With,Accept,Origin",
    };

    app.use(cors(corsOptions));
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true, parameterLimit: 100000 }));
    app.use(cookieParser());
    app.use(morgan("tiny", { skip: (req) => req.method === "OPTIONS" }));
};

export default setupMiddlewares;
