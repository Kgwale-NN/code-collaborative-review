CREATE TABLE submissions (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER NOT NULL,
    submitter_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    code TEXT NOT NULL CHECK (length(trim(code)) > 0),
    language VARCHAR(50),
    filename VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'in_review',
                'approved',
                'changes_requested'
            )
        ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE RESTRICT,

    FOREIGN KEY (submitter_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);