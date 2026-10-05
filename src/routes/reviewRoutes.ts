import { Router } from "express";
import { approveSubmission, requestChanges, getReviewHistory } from "../controllers/reviewController";
import { authenticate } from "../middleware/authenticate";

import { validateReview } from "../middleware/validateReview";

const router = Router();

router.post("/:id/approve", authenticate, validateReview, approveSubmission);
router.post("/:id/request-changes", authenticate, validateReview, requestChanges);
router.get("/:id/reviews", authenticate, getReviewHistory);

export default router;
