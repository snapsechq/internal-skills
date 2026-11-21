// examples/routes.example.js
import { Router } from "express";
import { EntityController } from "./controller.example.js";

const router = Router();

// REST Conventions
router.get("/", EntityController.list);
router.get("/:id", EntityController.getById);
router.post("/", EntityController.create);
router.patch("/:id", EntityController.update);
router.put("/:id", EntityController.update);
router.delete("/:id", EntityController.delete);

export default router;
