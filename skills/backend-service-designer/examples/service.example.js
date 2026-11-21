// examples/service.example.js
import { ApiError } from "./api-error.example.js";

// Mock database store for example purposes
const db = new Map();

export class EntityService {
    /**
     * List entities scoped to tenant
     */
    static async list({ orgId, page = 1, limit = 20, search, status }) {
        if (!orgId) throw ApiError.unauthorized("Organization context required");

        let items = Array.from(db.values()).filter((item) => item.orgId === orgId);

        if (status) items = items.filter((item) => item.status === status);
        if (search) items = items.filter((item) => item.name.includes(search));

        const total = items.length;
        const paginated = items.slice((page - 1) * limit, page * limit);

        return {
            data: paginated,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }

    /**
     * Fetch entity by ID
     */
    static async getById({ id, orgId }) {
        if (!id) throw ApiError.badRequest("ID is required");
        if (!orgId) throw ApiError.unauthorized("Organization context required");

        const item = db.get(id);
        if (!item || item.orgId !== orgId) {
            throw ApiError.notFound(`Entity '${id}' not found`);
        }

        return { data: item };
    }

    /**
     * Create new entity
     */
    static async create({ orgId, name, ...rest }) {
        if (!orgId) throw ApiError.unauthorized("Organization context required");
        if (!name) throw ApiError.badRequest("Name is required");

        const id = `item_${Date.now()}`;
        const record = { id, orgId, name, ...rest, createdAt: new Date().toISOString() };
        db.set(id, record);

        return { data: record };
    }

    /**
     * Update existing entity
     */
    static async update({ id, orgId, updates }) {
        if (!id) throw ApiError.badRequest("ID is required");
        if (!orgId) throw ApiError.unauthorized("Organization context required");

        const existing = db.get(id);
        if (!existing || existing.orgId !== orgId) {
            throw ApiError.notFound(`Entity '${id}' not found`);
        }

        delete updates.id;
        delete updates.orgId;

        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
        db.set(id, updated);

        return { data: updated };
    }

    /**
     * Delete entity
     */
    static async delete({ id, orgId }) {
        if (!id) throw ApiError.badRequest("ID is required");
        if (!orgId) throw ApiError.unauthorized("Organization context required");

        const existing = db.get(id);
        if (!existing || existing.orgId !== orgId) {
            throw ApiError.notFound(`Entity '${id}' not found`);
        }

        db.delete(id);
        return { data: { deleted: true, id } };
    }
}
