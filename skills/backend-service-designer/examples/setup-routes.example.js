// examples/setup-routes.example.js
import router from "./routes.example.js";
import { errorHandler } from "./error-handler.example.js";

const setupRoutes = (app) => {
    // 1. Mount Swagger documentation
    // setupSwagger(app);

    // 2. Mount API Routes under service prefix
    app.use("/api", router);

    // 3. Mount Global Error Handler AFTER all routes
    app.use(errorHandler);
};

export default setupRoutes;
