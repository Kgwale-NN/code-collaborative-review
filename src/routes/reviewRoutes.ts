import { Router } from "express";
import { approveSubmission, requestChanges } from "../controllers/reviewController";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.post("/:id/approve", authenticate, approveSubmission);
router.post("/:id/request-changes", authenticate, requestChanges);

export default router;
