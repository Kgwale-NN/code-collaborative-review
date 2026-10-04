import { Router } from "express";
import { createSubmission, getSubmissionById } from "../controllers/submissionController";
import { authenticate } from "../middleware/authenticate";
import { validateSubmission } from "../middleware/validateSubmission";

const router = Router();

router.post("/", authenticate, validateSubmission, createSubmission);
router.get("/:id", authenticate, getSubmissionById);

export default router;