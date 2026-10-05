# Project statistics

GET /api/projects/:id/stats requires a Bearer token and current project ownership or membership.
Invalid IDs return 400, missing projects return 404, and users without project access receive 403.

## Metric definitions

- Submission counts use each submission's current status.
- Average review time is the mean hours from submission creation to its first recorded approval or change request. Submissions without a review are excluded; the result is null if none have been reviewed.
- Approval and changes-requested percentages use only submissions currently in one of those two statuses as their denominator. Pending and in-review submissions are excluded. Both percentages are null when there are no decided submissions. The assignment's rejected category is represented by changes_requested, not a separate status.
- Reviewer activity counts review-history records and currently stored comments separately, then adds them for total_activity. Repeated review actions count separately. Current reviewers with no activity appear with zero counts; past contributors also remain visible while their records exist.
- Most-commented submissions includes every tie for the highest positive comment count. It is an empty array when the project has no comments.
- All metrics are lifetime metrics for the project's remaining records. Deleted submissions and comments no longer contribute.

The endpoint returns project_id, summary, reviewer_activity, and most_commented_submissions.
The three metric queries run independently; concurrent writes can cause small differences between their snapshots.
