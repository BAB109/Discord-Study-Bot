const pool = require("./pool");

async function createTask({
  taskName,
  description,
  scheduledAt,
  deadline,
  discordUserId,
}) {
  const query = `
    INSERT INTO tasks (
      task_name,
      description,
      scheduled_at,
      deadline,
      discord_user_id
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const values = [
    taskName,
    description,
    scheduledAt,
    deadline,
    discordUserId,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
}


async function acceptTask(taskId) {
  const query = `
    UPDATE tasks
    SET
      status = 'ACCEPTED',
      accepted_at = NOW(),
      started_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [taskId]);

  return result.rows[0];
}


async function completeTask(taskId) {
  const query = `
    UPDATE tasks
    SET
      status = 'COMPLETED',
      completed_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [taskId]);

  return result.rows[0];
}


async function skipTask(taskId) {
  const query = `
    UPDATE tasks
    SET
      status = 'SKIPPED'
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [taskId]);

  return result.rows[0];
}


async function expireTask(taskId) {
  const query = `
    UPDATE tasks
    SET
      status = 'EXPIRED'
    WHERE id = $1
    RETURNING *;
  `;

  const result = await pool.query(query, [taskId]);

  return result.rows[0];
}


async function incrementReminderCount(taskId) {
  const query = `
    UPDATE tasks
    SET reminder_count = reminder_count + 1
    WHERE id = $1
    RETURNING reminder_count;
  `;

  const result = await pool.query(query, [taskId]);

  return result.rows[0];
}

async function getTodayTasks(discordUserId) {
  const query = `
    SELECT
      id,
      task_name,
      status,
      scheduled_at,
      deadline,
      accepted_at,
      completed_at,
      reminder_count
    FROM tasks
    WHERE discord_user_id = $1
      AND scheduled_at AT TIME ZONE 'Asia/Kolkata'
          >= CURRENT_DATE
      AND scheduled_at AT TIME ZONE 'Asia/Kolkata'
          < CURRENT_DATE + INTERVAL '1 day'
    ORDER BY scheduled_at ASC;
  `;

  const result = await pool.query(query, [discordUserId]);

  return result.rows;
}

async function getTodayStats(discordUserId) {
  const query = `
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
      COUNT(*) FILTER (WHERE status = 'SKIPPED') AS skipped,
      COUNT(*) FILTER (WHERE status = 'EXPIRED') AS expired,
      COUNT(*) FILTER (
        WHERE status IN ('PENDING', 'ACCEPTED')
      ) AS pending
    FROM tasks
    WHERE discord_user_id = $1
      AND scheduled_at AT TIME ZONE 'Asia/Kolkata'
          >= CURRENT_DATE
      AND scheduled_at AT TIME ZONE 'Asia/Kolkata'
          < CURRENT_DATE + INTERVAL '1 day';
  `;

  const result = await pool.query(query, [discordUserId]);

  return result.rows[0];
}


async function getWeekStats(discordUserId) {
  const query = `
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'COMPLETED') AS completed,
      COUNT(*) FILTER (WHERE status = 'SKIPPED') AS skipped,
      COUNT(*) FILTER (WHERE status = 'EXPIRED') AS expired
    FROM tasks
    WHERE discord_user_id = $1
      AND scheduled_at AT TIME ZONE 'Asia/Kolkata'
          >= CURRENT_DATE - INTERVAL '6 days'
      AND scheduled_at AT TIME ZONE 'Asia/Kolkata'
          < CURRENT_DATE + INTERVAL '1 day';
  `;

  const result = await pool.query(query, [discordUserId]);

  return result.rows[0];
}

async function getStreak(discordUserId) {
  const query = `
    WITH completed_days AS (
      SELECT DISTINCT
        (completed_at AT TIME ZONE 'Asia/Kolkata')::date AS study_date
      FROM tasks
      WHERE discord_user_id = $1
        AND status = 'COMPLETED'
        AND completed_at IS NOT NULL
    ),

    numbered_days AS (
      SELECT
        study_date,
        study_date
          - (
              ROW_NUMBER() OVER (
                ORDER BY study_date DESC
              )
            )::integer AS group_date
      FROM completed_days
    )

    SELECT
      COUNT(*) AS streak
    FROM numbered_days
    WHERE group_date = (
      SELECT MAX(group_date)
      FROM numbered_days
    );
  `;

  const result = await pool.query(query, [discordUserId]);

  return Number(result.rows[0].streak || 0);
}

async function getHistory(discordUserId, days = 7) {
  const query = `
    SELECT
      (scheduled_at AT TIME ZONE 'Asia/Kolkata')::date AS study_date,

      COUNT(*) AS total,

      COUNT(*) FILTER (
        WHERE status = 'COMPLETED'
      ) AS completed,

      COUNT(*) FILTER (
        WHERE status = 'SKIPPED'
      ) AS skipped,

      COUNT(*) FILTER (
        WHERE status = 'EXPIRED'
      ) AS expired

    FROM tasks

    WHERE discord_user_id = $1

      AND scheduled_at AT TIME ZONE 'Asia/Kolkata'
          >= CURRENT_DATE - ($2::integer - 1)

      AND scheduled_at AT TIME ZONE 'Asia/Kolkata'
          < CURRENT_DATE + INTERVAL '1 day'

    GROUP BY study_date
    ORDER BY study_date DESC;
  `;

  const result = await pool.query(
    query,
    [discordUserId, days]
  );

  return result.rows;
}

module.exports = {
  createTask,
  acceptTask,
  completeTask,
  skipTask,
  expireTask,
  incrementReminderCount,
  getTodayTasks,
  getTodayStats,
  getWeekStats,
  getStreak,
  getHistory,
};