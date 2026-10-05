import { Router } from "express";
import { approveSubmission, requestChanges, getReviewHistory } from "../controllers/reviewController";
import { authenticate } from "../middleware/authenticate";

const router = Router();

router.post("/:id/approve", authenticate, approveSubmission);
router.post("/:id/request-changes", authenticate, requestChanges);
router.get("/:id/reviews", authenticate, getReviewHistory);

export default router;
