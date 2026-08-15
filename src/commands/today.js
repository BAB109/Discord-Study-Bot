const {
  SlashCommandBuilder,
} = require("discord.js");

const {
  getTodayTasks,
  getStreak,
} = require("../db/queries");

const schedule = require("../schedule");

// IST is UTC+5:30 (fixed offset, no DST)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toIST(date) {
  return new Date(
    new Date(date).getTime() + IST_OFFSET_MS
  );
}

function formatISTDate() {
  const ist = toIST(new Date());

  const days = [
    "Sunday", "Monday", "Tuesday",
    "Wednesday", "Thursday", "Friday",
    "Saturday",
  ];

  const months = [
    "Jan", "Feb", "Mar", "Apr",
    "May", "Jun", "Jul", "Aug",
    "Sep", "Oct", "Nov", "Dec",
  ];

  return `${days[ist.getUTCDay()]}, ${months[ist.getUTCMonth()]} ${ist.getUTCDate()}`;
}

function isTimePast(timeStr) {
  const ist = toIST(new Date());
  const nowH = ist.getUTCHours();
  const nowM = ist.getUTCMinutes();

  const [h, m] = timeStr.split(":").map(Number);

  return nowH > h || (nowH === h && nowM >= m);
}

function getStatusEmoji(dbTask, endTime) {
  if (dbTask) {
    switch (dbTask.status) {
      case "COMPLETED":
        return "✅";
      case "ACCEPTED":
        return "🟢";
      case "PENDING":
        return "🟡";
      case "SKIPPED":
        return "⏭️";
      case "EXPIRED":
        return "❌";
    }
  }

  // No DB entry — check if past or future
  if (isTimePast(endTime)) {
    return null; // Missed (past deadline, never created)
  }

  return "⬜"; // Upcoming
}


module.exports = {
  data: new SlashCommandBuilder()
    .setName("today")
    .setDescription("Show today's study progress"),

  async execute(interaction) {
    try {
      const tasks = await getTodayTasks(
        interaction.user.id
      );
      const streak = await getStreak(
        interaction.user.id
      );

      // Build lookup: task_name → DB task
      const taskMap = new Map();

      for (const t of tasks) {
        taskMap.set(t.task_name, t);
      }

      let completed = 0;
      let actionable = 0;

      let output =
        `📅 **TODAY** — ${formatISTDate()}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n`;

      for (const section of schedule.sections) {
        output += `**${section.name}**\n`;

        for (const item of section.items) {
          const timeRange =
            `${item.time} – ${item.endTime}`;

          if (!item.isTask) {
            // Break / non-task item
            output +=
              `${timeRange}  ${item.emoji} ${item.name}\n`;
            continue;
          }

          const fullName =
            `${item.emoji} ${item.name}`;

          const dbTask = taskMap.get(fullName);
          const status = getStatusEmoji(
            dbTask,
            item.endTime
          );

          if (status === null) {
            // Missed — show with original emoji, don't count
            output +=
              `${timeRange}  ${item.emoji} ${item.name}\n`;
          } else {
            actionable++;

            if (status === "✅") {
              completed++;
            }

            output +=
              `${timeRange}  ${status} ${item.name}\n`;
          }
        }

        output += `\n━━━━━━━━━━━━━━━━━━\n\n`;
      }

      output +=
        `Progress: ${completed} / ${actionable} completed\n` +
        `🔥 Streak: ${streak} day${streak === 1 ? "" : "s"}`;

      await interaction.reply(output);

    } catch (error) {
      console.error(
        "Today command error:",
        error
      );

      await interaction.reply({
        content:
          "❌ Failed to retrieve today's tasks.",
        ephemeral: true,
      });
    }
  },
};