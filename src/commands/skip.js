const {
  SlashCommandBuilder,
} = require("discord.js");

const {
  skipActiveTask,
} = require("../reminderManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip your currently active task"),

  async execute(interaction) {
    try {
      const task = await skipActiveTask(
        interaction.user.id
      );

      if (!task) {
        await interaction.reply({
          content:
            "❌ You don't have an active task right now.",
          ephemeral: true,
        });

        return;
      }

      await interaction.reply(
        `⏭️ **TASK SKIPPED**\n\n` +
        `**${task.task_name}**\n\n` +
        `Reminders have been stopped.`
      );

    } catch (error) {
      console.error(
        "Skip command error:",
        error
      );

      await interaction.reply({
        content:
          "❌ Failed to skip the task.",
        ephemeral: true,
      });
    }
  },
};