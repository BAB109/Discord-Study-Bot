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


function getTodayDate(time, baseDate = new Date()) {
  const [hours, minutes] = time.split(":");

  const dateString = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(baseDate);

  const [year, month, day] = dateString.split("-");

  const date = new Date(
    `${year}-${month}-${day}T${hours}:${minutes}:00+05:30`
  );

  return date;
}

function getIndiaTime() {
  const now = new Date();

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
}

function startScheduler(channel, userId) {
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const currentTime = getIndiaTime();

        const taskConfig = schedule.find(
          (item) => item.time === currentTime
        );

        if (!taskConfig) return;

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