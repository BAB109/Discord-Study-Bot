require("dotenv").config();

const pool = require("./pool");

async function debug() {
  try {
    // Show DB server timezone and current date
    const tzResult = await pool.query(`
      SELECT 
        current_setting('TIMEZONE') AS db_timezone,
        CURRENT_DATE AS current_date_server,
        (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date AS current_date_ist,
        CURRENT_TIMESTAMP AS current_timestamp
    `);
    console.log("\n=== DB Server Info ===");
    console.log(tzResult.rows[0]);

    // Show all recent tasks
    const tasksResult = await pool.query(`
      SELECT 
        id,
        task_name,
        status,
        scheduled_at,
        (scheduled_at AT TIME ZONE 'Asia/Kolkata')::date AS scheduled_date_ist,
        deadline
      FROM tasks
      ORDER BY scheduled_at DESC
      LIMIT 10;
    `);
    console.log("\n=== Recent Tasks ===");
    tasksResult.rows.forEach(row => {
      console.log(`#${row.id} | ${row.task_name} | ${row.status} | scheduled: ${row.scheduled_at} | IST date: ${row.scheduled_date_ist} | deadline: ${row.deadline}`);
    });

    await pool.end();
  } catch (error) {
    console.error("Debug error:", error);
  }
}

debug();
