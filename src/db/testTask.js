require("dotenv").config();

const {
  createTask,
} = require("./queries");

async function test() {
  try {
    const task = await createTask({
      taskName: "TEST TASK",
      description: "Testing PostgreSQL task creation.",
      scheduledAt: new Date(),
      deadline: new Date(Date.now() + 60 * 60 * 1000),
      discordUserId: process.env.USER_ID,
    });

    console.log("Task created successfully:");
    console.log(task);
  } catch (error) {
    console.error("Failed to create task:");
    console.error(error);
  }
}

test();