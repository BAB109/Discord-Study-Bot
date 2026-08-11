CREATE TABLE IF NOT EXISTS tasks (
    id BIGSERIAL PRIMARY KEY,

    task_name VARCHAR(100) NOT NULL,
    description TEXT,

    scheduled_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,

    deadline TIMESTAMPTZ,

    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    reminder_count INTEGER NOT NULL DEFAULT 0,

    discord_user_id VARCHAR(30) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_task_status
        CHECK (
            status IN (
                'PENDING',
                'ACCEPTED',
                'COMPLETED',
                'SKIPPED',
                'EXPIRED'
            )
        )
);