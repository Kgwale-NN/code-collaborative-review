import { Router } from "express";
import { createSubmission } from "../controllers/submissionController";
import { authenticate } from "../middleware/authenticate";
import { validateSubmission } from "../middleware/validateSubmission";

const router = Router();

router.post("/", authenticate, validateSubmission, createSubmission);

export default router;