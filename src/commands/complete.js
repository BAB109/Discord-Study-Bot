const {
  SlashCommandBuilder,
} = require("discord.js");

const {
  completeActiveTask,
} = require("../reminderManager");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("complete")
    .setDescription("Complete your currently active task"),

  async execute(interaction) {
    try {
      const task = await completeActiveTask(
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
        `🎉 **TASK COMPLETED**\n\n` +
        `**${task.task_name}**\n\n` +
        `Great work. ✅`
      );

    } catch (error) {
      console.error(
        "Complete command error:",
        error
      );

      await interaction.reply({
        content:
          "❌ Failed to complete the task.",
        ephemeral: true,
      });
    }
  },
};