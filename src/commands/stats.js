const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

const {
  getTodayStats,
  getWeekStats,
} = require("../db/queries");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show your study statistics"),

  async execute(interaction) {
    try {
      const today = await getTodayStats(
        interaction.user.id
      );

      const week = await getWeekStats(
        interaction.user.id
      );

      const todayTotal = Number(today.total);
      const todayCompleted = Number(today.completed);

      const weekTotal = Number(week.total);
      const weekCompleted = Number(week.completed);

      const todayRate =
        todayTotal > 0
          ? Math.round(
              (todayCompleted / todayTotal) * 100
            )
          : 0;

      const weekRate =
        weekTotal > 0
          ? Math.round(
              (weekCompleted / weekTotal) * 100
            )
          : 0;

      const embed = new EmbedBuilder()
        .setTitle("📊 Study Statistics")
        .addFields(
          {
            name: "📅 Today",
            value:
              `✅ Completed: **${todayCompleted}**\n` +
              `⏭️ Skipped: **${today.skipped}**\n` +
              `❌ Expired: **${today.expired}**\n` +
              `⏳ Pending: **${today.pending}**\n\n` +
              `**Completion Rate: ${todayRate}%**`,
            inline: false,
          },
          {
            name: "📆 Last 7 Days",
            value:
              `✅ Completed: **${weekCompleted}**\n` +
              `⏭️ Skipped: **${week.skipped}**\n` +
              `❌ Expired: **${week.expired}**\n` +
              `📋 Total: **${weekTotal}**\n\n` +
              `**Completion Rate: ${weekRate}%**`,
            inline: false,
          }
        )
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
      });

    } catch (error) {
      console.error(
        "Stats command error:",
        error
      );

      await interaction.reply({
        content:
          "❌ Failed to retrieve statistics.",
        ephemeral: true,
      });
    }
  },
};