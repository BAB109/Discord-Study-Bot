const {
  getTodayTasks,
} = require("./db/queries");

function formatTime(date) {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
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
      `📅 **${new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Asia/Kolkata",
      })}**\n\n` +
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