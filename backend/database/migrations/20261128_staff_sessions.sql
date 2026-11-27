-- Staff sessions table for token-based authentication.
-- Run once against kapet_balay_db.

CREATE TABLE IF NOT EXISTS staff_sessions (
    session_id  INT          AUTO_INCREMENT PRIMARY KEY,
    staff_id    INT          NOT NULL,
    token       VARCHAR(64)  NOT NULL UNIQUE,
    expires_at  DATETIME     NOT NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_staff
        FOREIGN KEY (staff_id) REFERENCES staff(staff_id)
        ON DELETE CASCADE
);
