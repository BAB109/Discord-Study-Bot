const cron = require("node-cron");

const schedule = require("./schedule");

// const {
//   sendMorningSchedule,
// } = require("./dailySummary");
const {
  sendMorningSchedule,
  sendNightlySummary,
} = require("./dailySummary");

const {
  createTask,
} = require("./db/queries");

const {
  startTask,
} = require("./reminderManager");


// IST is UTC+5:30 (fixed offset, no DST)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toIST(date) {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

function getTodayDate(time, baseDate = new Date()) {
  const [hours, minutes] = time.split(":");

  const ist = toIST(baseDate);
  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const day = String(ist.getUTCDate()).padStart(2, "0");

  const date = new Date(
    `${year}-${month}-${day}T${hours}:${minutes}:00+05:30`
  );

  return date;
}

function getIndiaTime() {
  const ist = toIST(new Date());
  const hours = String(ist.getUTCHours()).padStart(2, "0");
  const minutes = String(ist.getUTCMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getIndiaDateString() {
  const ist = toIST(new Date());
  const year = ist.getUTCFullYear();
  const month = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const day = String(ist.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startScheduler(channel, userId) {
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const currentTime = getIndiaTime();

        const allTasks = schedule.getAllTasks();

        const taskConfig = allTasks.find(
          (item) => item.time === currentTime
        );

        if (!taskConfig) return;

        const fullName =
          `${taskConfig.emoji} ${taskConfig.name}`;

        const scheduledAt = getTodayDate(
          taskConfig.time
        );

        let deadline = getTodayDate(
          taskConfig.endTime
        );

        if (deadline <= scheduledAt) {
          deadline = new Date(
            deadline.getTime() + 24 * 60 * 60 * 1000
          );
        }

        const dbTask = await createTask({
          taskName: fullName,
          description: taskConfig.description,
          scheduledAt,
          deadline,
          discordUserId: userId,
        });

        console.log(
          `Created task #${dbTask.id}: ${dbTask.task_name}`
        );

        await startTask(
          channel,
          userId,
          fullName,
          taskConfig.description,
          dbTask.id,
          deadline
        );

      } catch (error) {
        console.error(
          "Scheduler error:",
          error
        );
      }
    },
    {
      timezone: "Asia/Kolkata",
    }
  );

  // Start automatic morning message
  startMorningSchedule(channel, userId);
  startNightlySummary(channel, userId);

  console.log("Scheduler started.");
}



function startMorningSchedule(channel, userId) {
  const CHECK_INTERVAL = 30 * 1000;

  let lastSentDate = null;

  setInterval(async () => {
    const indiaTime = getIndiaTime();
    const today = getIndiaDateString();

    if (
      indiaTime === "06:00" &&
      lastSentDate !== today
    ) {
      await sendMorningSchedule(
        channel,
        userId
      );

      lastSentDate = today;
    }
  }, CHECK_INTERVAL);
}

function startNightlySummary(channel, userId) {
  const CHECK_INTERVAL = 30 * 1000;

  let lastSentDate = null;

  setInterval(async () => {
    const indiaTime = getIndiaTime();
    const today = getIndiaDateString();

    if (
      indiaTime === "22:30" &&
      lastSentDate !== today
    ) {
      await sendNightlySummary(
        channel,
        userId
      );

      lastSentDate = today;
    }
  }, CHECK_INTERVAL);
}

module.exports = {
  startScheduler,
};