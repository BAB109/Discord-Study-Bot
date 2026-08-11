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


function getTodayDate(time) {
  const now = new Date();

  const [hours, minutes] = time.split(":");

  now.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return now;
}


function startScheduler(channel, userId) {
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const now = new Date();

        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");

        const currentTime = `${hours}:${minutes}`;

        const taskConfig = schedule.find(
          (item) => item.time === currentTime
        );

        if (!taskConfig) return;

        const scheduledAt = getTodayDate(
          taskConfig.time
        );

        const deadline = getTodayDate(
          taskConfig.endTime
        );

        const dbTask = await createTask({
          taskName: taskConfig.name,
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
          taskConfig.name,
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
    const now = new Date();

    const indiaTime = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

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
    const now = new Date();

    const indiaTime = new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);

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