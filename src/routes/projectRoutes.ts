import { Router } from "express";
import { createProject, listProjects, addProjectMember, removeProjectMember } from "../controllers/projectController";
import { authenticate } from "../middleware/authenticate";
import { validateProject } from "../middleware/validateProject";
import { validateProjectMember } from "../middleware/validateProjectMember";

const router = Router();

router.post("/", authenticate, validateProject, createProject);
router.get("/", authenticate, listProjects);
router.post("/:id/members", authenticate, validateProjectMember, addProjectMember);
router.delete("/:id/members/:userId", authenticate, removeProjectMember);

export default router;