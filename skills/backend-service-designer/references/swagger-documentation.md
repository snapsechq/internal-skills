# OpenAPI 3.0 Swagger Documentation

To keep codebase clean and prevent cluttering controllers and route files, all API documentation lives in dedicated swagger files inside `src/swagger/routes/`.

---

## Architecture

```text
src/swagger/
├── index.js                      --> Configures swagger-jsdoc & swagger-ui-express
└── routes/
    ├── item.swagger.js           --> OpenAPI 3.0 JSDoc for Item resource
    └── user.swagger.js           --> OpenAPI 3.0 JSDoc for User resource
```

---

## 1. Swagger Bootstrapper (`src/swagger/index.js`)

Configures OpenAPI specification, security schemes, server URLs, and mounts the Swagger UI.

```javascript
// src/swagger/index.js
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { appConfig } from "../config/app-config.js";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: `${appConfig.APP_NAME || "Microservice"} API`,
            version: appConfig.APP_VERSION || "1.0.0",
            description: "API documentation generated via OpenAPI 3.0 and Swagger UI",
        },
        servers: [
            {
                url: "/api/v1",
                description: "V1 API endpoint prefix",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Enter your Bearer token in the format: Bearer <token>",
                },
                apiKeyAuth: {
                    type: "apiKey",
                    in: "header",
                    name: "x-api-key",
                    description: "Internal service-to-service API key",
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Pattern targeting all separate swagger documentation files
    apis: ["./src/swagger/routes/*.swagger.js", "./src/swagger/routes/*.js"],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app) => {
    // Mount Swagger UI
    app.use("/swagger", swaggerUi.serve, swaggerUi.setup(specs));

    // Expose raw OpenAPI JSON spec for external consumers or client generators
    app.get("/swagger.json", (req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.send(specs);
    });
};
```

---

## 2. Route Documentation (`src/swagger/routes/<name>.swagger.js`)

Each resource has a dedicated file defining:
1. `@swagger tags`
2. Component Schemas (`components/schemas/<Entity>`)
3. Endpoints (`/resource`, `/resource/{id}`)
4. Request bodies, query/path parameters, and HTTP response codes (`200`, `201`, `400`, `401`, `403`, `404`, `500`).
5. Ends with `export default {};`.

```javascript
// src/swagger/routes/item.swagger.js

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: Item management and operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *         orgId:
 *           type: string
 *           example: "org_12345"
 *         name:
 *           type: string
 *           example: "Production Database Scan"
 *         status:
 *           type: string
 *           enum: [active, pending, archived]
 *           example: "active"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-01-01T00:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-01-01T00:00:00.000Z"
 *
 *     CreateItemInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "Production Database Scan"
 *         status:
 *           type: string
 *           enum: [active, pending, archived]
 *           default: "active"
 *
 *     StandardResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 1
 *         message:
 *           type: string
 *           example: "Operation completed successfully"
 */

/**
 * @swagger
 * /items:
 *   get:
 *     summary: List items with pagination
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search keyword for name
 *     responses:
 *       200:
 *         description: List of items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: "Items fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Item'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 42
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Unauthorized - missing or invalid token
 *
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateItemInput'
 *     responses:
 *       201:
 *         description: Item created successfully
 *       400:
 *         description: Validation error or missing required fields
 *       409:
 *         description: Item with this name already exists
 */

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Get an item by ID
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique item identifier
 *     responses:
 *       200:
 *         description: Item details
 *       404:
 *         description: Item not found
 *
 *   patch:
 *     summary: Update an item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       404:
 *         description: Item not found
 *
 *   delete:
 *     summary: Delete an item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       404:
 *         description: Item not found
 */

export default {};
```

---

## 3. Validation Check

Always verify that Swagger definitions compile cleanly with zero YAML syntax errors using:

```bash
node -e "import('./src/swagger/index.js')"
```
If this command exits with code 0, all JSDoc YAML definitions parsed successfully.
