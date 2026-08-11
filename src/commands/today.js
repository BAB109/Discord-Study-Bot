const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

const {
  getTodayTasks,
} = require("../db/queries");


module.exports = {
  data: new SlashCommandBuilder()
    .setName("today")
    .setDescription("Show today's study progress"),

  async execute(interaction) {
    try {
      const tasks = await getTodayTasks(interaction.user.id);

      if (tasks.length === 0) {
        await interaction.reply(
          "📅 No tasks have been recorded for today yet."
        );

        return;
      }

      const statusEmoji = {
        PENDING: "⏳",
        ACCEPTED: "🟢",
        COMPLETED: "✅",
        SKIPPED: "⏭️",
        EXPIRED: "❌",
      };

      const completed = tasks.filter(
        task => task.status === "COMPLETED"
      ).length;

      const progress = Math.round(
        (completed / tasks.length) * 100
      );

      const taskList = tasks
        .map(task => {
          const emoji =
            statusEmoji[task.status] || "❓";

          return `${emoji} **${task.task_name}**\n` +
                 `└ ${task.status}`;
        })
        .join("\n\n");

      const embed = new EmbedBuilder()
        .setTitle("📅 Today's Study Progress")
        .setDescription(taskList)
        .addFields({
          name: "📊 Progress",
          value:
            `**${completed} / ${tasks.length}** completed\n` +
            `**${progress}%** completion`,
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
      });

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