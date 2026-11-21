// examples/controller.example.js
import { catchError } from "./catch-error.example.js";
import { ApiResponse } from "./api-response.example.js";
import { EntityService } from "./service.example.js";

export class EntityController {
    /**
     * List entities with pagination
     */
    static list = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const { search, status, sort, sortOrder } = req.query;

        const result = await EntityService.list({
            orgId,
            page,
            limit,
            search,
            status,
            sort,
            sortOrder,
        });

        return ApiResponse.success(res, result, "Entities fetched successfully");
    });

    /**
     * Get single entity by ID
     */
    static getById = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const { id } = req.params;

        const result = await EntityService.getById({ id, orgId });
        return ApiResponse.success(res, result, "Entity fetched successfully");
    });

    /**
     * Create new entity
     */
    static create = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const result = await EntityService.create({ ...req.body, orgId });
        return ApiResponse.created(res, result, "Entity created successfully");
    });

    /**
     * Update entity
     */
    static update = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const { id } = req.params;
        const result = await EntityService.update({ id, orgId, updates: req.body });
        return ApiResponse.success(res, result, "Entity updated successfully");
    });

    /**
     * Delete entity
     */
    static delete = catchError(async (req, res, next) => {
        const orgId = req.authenticatedService?.orgId || req.user?.orgId;
        const { id } = req.params;
        const result = await EntityService.delete({ id, orgId });
        return ApiResponse.success(res, result, "Entity deleted successfully");
    });
}
