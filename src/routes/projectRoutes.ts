import { Router } from "express";
import { createProject } from "../controllers/projectController";
import { authenticate } from "../middleware/authenticate";
import { validateProject } from "../middleware/validateProject";

const router = Router();

router.post("/", authenticate, validateProject, createProject);

export default router;