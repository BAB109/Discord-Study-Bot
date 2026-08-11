const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

const {
  getStreak,
} = require("../db/queries");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("streak")
    .setDescription("Show your current study streak"),

  async execute(interaction) {
    try {
      const streak = await getStreak(
        interaction.user.id
      );

      const embed = new EmbedBuilder()
        .setTitle("🔥 Study Streak")
        .setDescription(
          streak > 0
            ? `You have studied for **${streak} consecutive day${streak === 1 ? "" : "s"}**.`
            : "No active streak yet. Complete a task today to start one!"
        )
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
      });

    } catch (error) {
      console.error(
        "Streak command error:",
        error
      );

      await interaction.reply({
        content:
          "❌ Failed to calculate your streak.",
        ephemeral: true,
      });
    }
  },
};