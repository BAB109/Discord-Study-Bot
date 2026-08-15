const {
  getTodayTasks,
} = require("./db/queries");

// IST is UTC+5:30 (fixed offset, no DST)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toIST(date) {
  return new Date(new Date(date).getTime() + IST_OFFSET_MS);
}

function formatTime(date) {
  const ist = toIST(date);
  let hours = ist.getUTCHours();
  const minutes = String(ist.getUTCMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
}

function getISTDateDisplay() {
  const ist = toIST(new Date());
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  return `${days[ist.getUTCDay()]}, ${ist.getUTCDate()} ${months[ist.getUTCMonth()]}`;
}

async function sendMorningSchedule(channel, userId) {
  try {
    const tasks = await getTodayTasks(userId);

    if (tasks.length === 0) {
      await channel.send(
        "🌅 **GOOD MORNING**\n\n" +
        "No tasks are scheduled for today."
      );

      return;
    }

    const taskList = tasks
      .map(task => {
        return (
          `⏰ **${formatTime(task.scheduled_at)}**\n` +
          `${task.task_name}`
        );
      })
      .join("\n\n");

    await channel.send(
      `🌅 **GOOD MORNING**\n\n` +
      `📅 **${getISTDateDisplay()}**\n\n` +
      `**Today's Schedule**\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `${taskList}\n\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🎯 **Today's target: ${tasks.length} tasks**\n\n` +
      `Use \`/today\` to check your progress.`
    );

  } catch (error) {
    console.error(
      "Morning schedule error:",
      error
    );
  }
}


const {
  getTodayStats,
  getStreak,
} = require("./db/queries");


async function sendNightlySummary(channel, userId) {
  try {
    const stats = await getTodayStats(userId);
    const streak = await getStreak(userId);

    const total = Number(stats.total);
    const completed = Number(stats.completed);
    const skipped = Number(stats.skipped);
    const expired = Number(stats.expired);
    const pending = Number(stats.pending);

    const completionRate =
      total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    await channel.send(
      `🌙 **DAILY SUMMARY**\n\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `✅ Completed: **${completed}**\n` +
      `⏭️ Skipped: **${skipped}**\n` +
      `❌ Expired: **${expired}**\n` +
      `⏳ Pending: **${pending}**\n\n` +
      `📊 Completion: **${completionRate}%**\n` +
      `🔥 Streak: **${streak} day${streak === 1 ? "" : "s"}**\n\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      (
        completionRate >= 80
          ? "🏆 Excellent work today!"
          : completionRate >= 50
            ? "💪 Solid effort. Keep improving."
            : "⚠️ Tomorrow, focus on completing your scheduled tasks."
      )
    );

  } catch (error) {
    console.error(
      "Nightly summary error:",
      error
    );
  }
}


module.exports = {
  sendMorningSchedule,
  sendNightlySummary,
};