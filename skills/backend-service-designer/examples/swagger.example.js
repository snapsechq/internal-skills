// examples/swagger.example.js
/**
 * @swagger
 * tags:
 *   name: Entities
 *   description: Entity management and operations
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Entity:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           example: "item_1700000000"
 *         orgId:
 *           type: string
 *           example: "org_123"
 *         name:
 *           type: string
 *           example: "Sample Resource"
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /entities:
 *   get:
 *     summary: List entities
 *     tags: [Entities]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of entities
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create entity
 *     tags: [Entities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created successfully
 *       400:
 *         description: Validation error
 */

export default {};
