const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const {
  acceptTask,
  completeTask,
  skipTask,
  expireTask,
  incrementReminderCount,
} = require("./db/queries");
const activeTasks = new Map();
const MAX_REMINDERS = 10;
const DEADLINE_CHECK_INTERVAL = 10 * 1000;
const REMINDER_INTERVAL = 2 * 60 * 1000;
//const MAX_REMINDERS = 10;


function createButtons(task) {
  if (!task.accepted) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`accept:${task.dbId}`)
        .setLabel("Accept Task")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`skip:${task.dbId}`)
        .setLabel("Skip Task")
        .setStyle(ButtonStyle.Danger)
    );
  }

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`complete:${task.dbId}`)
      .setLabel("Complete Task")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`giveup:${task.dbId}`)
      .setLabel("Give Up")
      .setStyle(ButtonStyle.Danger)
  );
}


async function sendReminder(task, channel) {
  if (task.reminderCount >= MAX_REMINDERS) {
    clearInterval(task.interval);
    activeTasks.delete(task.dbId);

    await channel.send(
      `⏹️ **${task.taskName}**\n\n` +
      `Reminder limit reached.\n` +
      `Task was not completed.`
    );

    return;
  }

  task.reminderCount++;

  await incrementReminderCount(task.dbId);

  const status = task.accepted
    ? "You accepted this task, but haven't completed it yet."
    : "You haven't accepted this task yet.";

  await channel.send({
    content:
      `🔔 **REMINDER #${task.reminderCount}**\n\n` +
      `<@${task.userId}> — **${task.taskName}**\n\n` +
      `${status}`,
    components: [createButtons(task)],
  });
}

async function checkDeadline(task, channel) {
  if (!task.deadline) return;

  const now = new Date();

  if (now < task.deadline) {
    return;
  }

  clearInterval(task.interval);
  clearInterval(task.deadlineInterval);

  activeTasks.delete(task.dbId);

  await expireTask(task.dbId);

  await channel.send(
    `⏰ **SESSION ENDED**\n\n` +
    `**${task.taskName}**\n\n` +
    `The deadline has been reached.\n` +
    `❌ Task marked as **EXPIRED**.`
  );
}
async function startTask(
  channel,
  userId,
  taskName,
  description,
  dbTaskId,
  deadline
) {
  const task = {
  dbId: String(dbTaskId),
  userId,
  taskName,
  description,
  deadline,
  reminderCount: 0,
  accepted: false,
  interval: null,
};

activeTasks.set(task.dbId, task);

  await channel.send({
        content:
        `⏰ **TASK TIME**\n\n` +
        `## ${taskName}\n` +
        `${description}\n\n` +
        `<@${userId}>`,
        components: [createButtons(task)],
    });

    task.interval = setInterval(
        () => sendReminder(task, channel),
        REMINDER_INTERVAL
    );
    task.deadlineInterval = setInterval(
        () => checkDeadline(task, channel),
        DEADLINE_CHECK_INTERVAL
    );
}


async function handleTaskButton(interaction) {
  const [action, dbTaskId] = interaction.customId.split(":");

    const task = activeTasks.get(dbTaskId);

  if (!task) {
    await interaction.reply({
      content:
        "⚠️ This task is no longer active in the bot.",
      ephemeral: true,
    });

    return;
  }

  if (interaction.user.id !== task.userId) {
    await interaction.reply({
      content:
        "❌ This task belongs to another user.",
      ephemeral: true,
    });

    return;
  }


  // ACCEPT
  if (action === "accept") {
    task.accepted = true;

    await acceptTask(task.dbId);

    await interaction.update({
      content:
        `🟢 **TASK ACCEPTED**\n\n` +
        `**${task.taskName}**\n\n` +
        `The task is now active.\n` +
        `⏰ Reminders will continue until completion.`,
      components: [createButtons(task)],
    });

    return;
  }


  // SKIP
  if (action === "skip") {
    clearInterval(task.interval);
    clearInterval(task.deadlineInterval);

    activeTasks.delete(task.dbId);

    await skipTask(task.dbId);

    await interaction.update({
      content:
        `❌ **TASK SKIPPED**\n\n` +
        `**${task.taskName}**\n\n` +
        `Reminder loop stopped.`,
      components: [],
    });

    return;
  }


  // COMPLETE
  if (action === "complete") {
    clearInterval(task.interval);
    clearInterval(task.deadlineInterval);

    activeTasks.delete(task.dbId);

    await completeTask(task.dbId);

    await interaction.update({
      content:
        `🎉 **TASK COMPLETED**\n\n` +
        `**${task.taskName}**\n\n` +
        `Excellent. Task completed successfully. ✅`,
      components: [],
    });

    return;
  }


  // GIVE UP
  if (action === "giveup") {
    clearInterval(task.interval);
    clearInterval(task.deadlineInterval);

    activeTasks.delete(task.dbId);

    await skipTask(task.dbId);

    await interaction.update({
      content:
        `⚠️ **TASK NOT COMPLETED**\n\n` +
        `**${task.taskName}**\n\n` +
        `You gave up on this task.`,
      components: [],
    });

    return;
  }
}


async function completeActiveTask(userId) {
  for (const task of activeTasks.values()) {
    if (task.userId !== userId) {
      continue;
    }

    clearInterval(task.interval);
    clearInterval(task.deadlineInterval);

    activeTasks.delete(task.dbId);

    const completedTask = await completeTask(task.dbId);

    return completedTask;
  }

  return null;
}


async function skipActiveTask(userId) {
  for (const task of activeTasks.values()) {
    if (task.userId !== userId) {
      continue;
    }

    clearInterval(task.interval);
    clearInterval(task.deadlineInterval);

    activeTasks.delete(task.dbId);

    const skippedTask = await skipTask(task.dbId);

    return skippedTask;
  }

  return null;
}


module.exports = {
  startTask,
  handleTaskButton,
  completeActiveTask,
  skipActiveTask,
};