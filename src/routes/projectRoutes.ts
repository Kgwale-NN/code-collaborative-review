import { Router } from "express";
import { createProject, listProjects } from "../controllers/projectController";
import { authenticate } from "../middleware/authenticate";
import { validateProject } from "../middleware/validateProject";

const router = Router();

router.post("/", authenticate, validateProject, createProject);
router.get("/", authenticate, listProjects);

export default router;