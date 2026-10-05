CREATE TABLE reviews (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    submission_id INTEGER NOT NULL,
    reviewer_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL
        CHECK (action IN ('approved', 'changes_requested')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (submission_id)
        REFERENCES submissions(id)
        ON DELETE CASCADE,

    FOREIGN KEY (reviewer_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);
