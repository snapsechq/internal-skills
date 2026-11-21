// examples/setup-app.example.js
/**
 * Master setup orchestrator
 */
import setupMiddlewares from "./setup-middlewares.example.js";
import setupRoutes from "./setup-routes.example.js";

const setupApp = (app) => {
    setupMiddlewares(app);
    setupRoutes(app);
};

export default setupApp;
