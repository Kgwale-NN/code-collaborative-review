import { Router } from "express";
import { createProject, listProjects, addProjectMember } from "../controllers/projectController";
import { authenticate } from "../middleware/authenticate";
import { validateProject } from "../middleware/validateProject";
import { validateProjectMember } from "../middleware/validateProjectMember";

const router = Router();

router.post("/", authenticate, validateProject, createProject);
router.get("/", authenticate, listProjects);
router.post("/:id/members", authenticate, validateProjectMember, addProjectMember);

export default router;