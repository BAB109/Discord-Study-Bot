const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

const {
  getHistory,
} = require("../db/queries");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("history")
    .setDescription("Show your recent study history")
    .addIntegerOption(option =>
      option
        .setName("days")
        .setDescription("Number of days to show")
        .setMinValue(1)
        .setMaxValue(30)
    ),

  async execute(interaction) {
    try {
      const days =
        interaction.options.getInteger("days") || 7;

      const history = await getHistory(
        interaction.user.id,
        days
      );

      if (history.length === 0) {
        await interaction.reply(
          "📜 No study history found."
        );

        return;
      }

      const lines = history.map(day => {
        const total = Number(day.total);
        const completed = Number(day.completed);

        const rate =
          total > 0
            ? Math.round(
                (completed / total) * 100
              )
            : 0;

        const date = new Date(
          day.study_date
        ).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        });

        return (
          `📅 **${date}**\n` +
          `✅ ${completed} completed  ` +
          `❌ ${day.expired} expired  ` +
          `⏭️ ${day.skipped} skipped\n` +
          `📊 Completion: **${rate}%**`
        );
      });

      const embed = new EmbedBuilder()
        .setTitle("📜 Study History")
        .setDescription(lines.join("\n\n"))
        .setFooter({
          text: `Showing last ${days} days`,
        })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
      });

    } catch (error) {
      console.error(
        "History command error:",
        error
      );

      await interaction.reply({
        content:
          "❌ Failed to retrieve study history.",
        ephemeral: true,
      });
    }
  },
};