import { validateIdParam } from "../middleware/validateId";
import { Router } from "express";
import { createSubmission, getSubmissionById, updateSubmissionStatus, deleteSubmission } from "../controllers/submissionController";
import { authenticate } from "../middleware/authenticate";
import { validateSubmission } from "../middleware/validateSubmission";

const router = Router();

router.param("id", validateIdParam);

router.post("/", authenticate, validateSubmission, createSubmission);
router.get("/:id", authenticate, getSubmissionById);
router.put("/:id/status", authenticate, updateSubmissionStatus);
router.delete("/:id", authenticate, deleteSubmission);

export default router;