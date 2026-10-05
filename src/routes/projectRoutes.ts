import { Router } from "express";
import { createProject, listProjects, addProjectMember, removeProjectMember } from "../controllers/projectController";
import { listSubmissionsByProject } from "../controllers/submissionController";
import { authenticate } from "../middleware/authenticate";
import { validateProject } from "../middleware/validateProject";
import { validateProjectMember } from "../middleware/validateProjectMember";

import { getProjectStats } from "../controllers/statsController";

const router = Router();

router.post("/", authenticate, validateProject, createProject);
router.get("/", authenticate, listProjects);
router.post("/:id/members", authenticate, validateProjectMember, addProjectMember);
router.delete("/:id/members/:userId", authenticate, removeProjectMember);
router.get("/:id/submissions", authenticate, listSubmissionsByProject);

router.get("/:id/stats", authenticate, getProjectStats);

export default router;