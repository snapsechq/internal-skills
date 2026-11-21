# Controllers, Services, and Routes Architecture

Every feature module follows a strict 3-tier separation of concerns:

```text
HTTP Request
     │
     ▼
[ src/routes/v1/<domain>.routes.js ]
  - HTTP Verb & Path definitions
  - Route-level middleware (auth, rate limits, validators)
  - Maps endpoint to Controller method
     │
     ▼
[ src/controllers/<domain>.controller.js ]
  - Static arrow functions wrapped with catchError()
  - Zero try/catch blocks
  - Extracts params, query, body, and tenant/auth context
  - Calls Service method passing a single options object
  - Formats HTTP response using ApiResponse helper
     │
     ▼
[ src/services/<domain>.service.js ]
  - Static async business logic methods
  - Destructured named parameter objects
  - Tenant isolation enforcement (orgId / userId scoping)
  - Throws ApiError for domain/validation failures
  - Read optimizations (.lean(), pagination metadata)
```

---

## 1. Controllers (`src/controllers/<name>.controller.js`)

### Rules
1. **Export Class**: Use `export class <Name>Controller`.
2. **Static Arrow Functions**: Define every handler as a static property initialized with `catchError(async (req, res, next) => { ... })`.
3. **No Try/Catch**: Let `catchError` delegate unhandled exceptions to `next(err)`.
4. **Parameter Extraction**: Extract `req.params`, `req.query`, `req.body`, and authenticated context (`req.user`, `req.authenticatedService?.orgId`).
5. **Delegation**: Pass extracted data to the service method as a single named argument object.
6. **Standard Responses**: Use `ApiResponse.success` or `ApiResponse.created`.

### Code Pattern
```javascript
// src/controllers/item.controller.js
import { catchError } from "../errors/catch-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { ItemService } from "../services/item.service.js";

export class ItemController {
    /**
     * List items with pagination and filters
     */
    static list = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const { search, status, sort, sortOrder } = req.query;

        const result = await ItemService.list({
            orgId,
            page,
            limit,
            search,
            status,
            sort,
            sortOrder,
        });

        return ApiResponse.success(res, result, "Items fetched successfully");
    });

    /**
     * Get single item by ID
     */
    static getById = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const { id } = req.params;

        const result = await ItemService.getById({ id, orgId });
        return ApiResponse.success(res, result, "Item fetched successfully");
    });

    /**
     * Create new item
     */
    static create = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const payload = req.body;

        const result = await ItemService.create({ ...payload, orgId });
        return ApiResponse.created(res, result, "Item created successfully");
    });

    /**
     * Update existing item
     */
    static update = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const { id } = req.params;
        const updates = req.body;

        const result = await ItemService.update({ id, orgId, updates });
        return ApiResponse.success(res, result, "Item updated successfully");
    });

    /**
     * Delete item
     */
    static delete = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const { id } = req.params;

        const result = await ItemService.delete({ id, orgId });
        return ApiResponse.success(res, result, "Item deleted successfully");
    });
}
```

---

## 2. Services (`src/services/<name>.service.js`)

### Rules
1. **Export Class**: Use `export class <Name>Service`.
2. **Single Parameter Object**: Always destructure named properties from a single parameter: `static async methodName({ prop1, prop2, orgId })`.
3. **Tenant / Identity Isolation**: All queries and mutations must filter by `orgId` (or user/tenant boundary).
4. **Throw ApiError**: Throw appropriate `ApiError` instances (`ApiError.badRequest`, `ApiError.notFound`, `ApiError.conflict`, `ApiError.forbidden`).
5. **Standard Pagination**: Return `{ data, meta: { total, page, limit, totalPages } }`.
6. **Read Performance**: Use `.lean()` for read-only database queries.

### Code Pattern
```javascript
// src/services/item.service.js
import { ApiError } from "../errors/api-error.js";
import { Item } from "../database/models/items.model.js";

export class ItemService {
    /**
     * List items with pagination
     */
    static async list({ orgId, page = 1, limit = 20, search, status, sort = "createdAt", sortOrder = "desc" }) {
        if (!orgId) {
            throw ApiError.unauthorized("Organization context is required");
        }

        const query = { orgId };

        if (status) {
            query.status = status;
        }

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const sortDirection = ["desc", "-1", -1].includes(sortOrder) ? -1 : 1;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            Item.find(query)
                .sort({ [sort]: sortDirection })
                .skip(skip)
                .limit(limit)
                .lean(),
            Item.countDocuments(query),
        ]);

        return {
            data: items,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }

    /**
     * Get single item by ID with tenant isolation
     */
    static async getById({ id, orgId }) {
        if (!id) throw ApiError.badRequest("Item ID is required");
        if (!orgId) throw ApiError.unauthorized("Organization context is required");

        const item = await Item.findOne({ _id: id, orgId }).lean();
        if (!item) {
            throw ApiError.notFound(`Item with ID ${id} not found`);
        }

        return { data: item };
    }

    /**
     * Create a new item
     */
    static async create({ orgId, name, description, ...rest }) {
        if (!orgId) throw ApiError.unauthorized("Organization context is required");
        if (!name) throw ApiError.badRequest("Name is required");

        const existing = await Item.findOne({ orgId, name }).lean();
        if (existing) {
            throw ApiError.conflict(`An item with name '${name}' already exists`);
        }

        const newItem = await Item.create({
            orgId,
            name,
            description,
            ...rest,
        });

        return { data: newItem.toObject() };
    }

    /**
     * Update an item
     */
    static async update({ id, orgId, updates }) {
        if (!id) throw ApiError.badRequest("Item ID is required");
        if (!orgId) throw ApiError.unauthorized("Organization context is required");

        // Prevent updating tenant boundary
        delete updates.orgId;
        delete updates._id;

        const updated = await Item.findOneAndUpdate(
            { _id: id, orgId },
            { $set: updates },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) {
            throw ApiError.notFound(`Item with ID ${id} not found`);
        }

        return { data: updated };
    }

    /**
     * Delete an item
     */
    static async delete({ id, orgId }) {
        if (!id) throw ApiError.badRequest("Item ID is required");
        if (!orgId) throw ApiError.unauthorized("Organization context is required");

        const deleted = await Item.findOneAndDelete({ _id: id, orgId }).lean();
        if (!deleted) {
            throw ApiError.notFound(`Item with ID ${id} not found`);
        }

        return { data: { deleted: true, id } };
    }
}
```

---

## 3. Routes (`src/routes/v1/<name>.routes.js`)

### Rules
1. Use Express `Router()`.
2. Apply route-level auth middleware using `router.use(requireAuth)`.
3. Adhere to REST naming:
   - `GET /` -> `list`
   - `GET /:id` -> `getById`
   - `POST /` -> `create`
   - `PATCH /:id` / `PUT /:id` -> `update`
   - `DELETE /:id` -> `delete`
4. Default export `export default router;`.

### Code Pattern
```javascript
// src/routes/v1/item.routes.js
import { Router } from "express";
import { ItemController } from "../../controllers/item.controller.js";
import { requireAuth } from "../../middleware/auth/index.js";

const router = Router();

// Apply auth to all routes in this resource
router.use(requireAuth);

router.get("/", ItemController.list);
router.get("/:id", ItemController.getById);
router.post("/", ItemController.create);
router.patch("/:id", ItemController.update);
router.put("/:id", ItemController.update);
router.delete("/:id", ItemController.delete);

export default router;
```

---

## 4. Route Aggregation (`src/routes/v1/index.js` & `src/routes/index.routes.js`)

Mount all resource routers into a versioned router, then export to `index.routes.js`:

```javascript
// src/routes/v1/index.js
import express from "express";
import itemRoutes from "./item.routes.js";
import { authenticateService } from "../../middleware/auth/index.js";

const router = express.Router();
const requireAuth = authenticateService();

router.use("/items", requireAuth, itemRoutes);

export default router;
```

```javascript
// src/routes/index.routes.js
import express from "express";
import v1Routes from "./v1/index.js";

const router = express.Router();

// Mount versioned API routes
router.use("/v1", v1Routes);
router.use(v1Routes); // Support unversioned fallback if applicable

// Health check endpoint
router.get("/v1/health", (req, res) => {
    res.status(200).json({ status: "success", message: "OK" });
});

export default router;
```
