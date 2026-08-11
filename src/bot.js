require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
} = require("discord.js");

const {
  handleTaskButton,
} = require("./reminderManager");

const {
  startScheduler,
} = require("./scheduler");

const todayCommand = require("./commands/today");
const completeCommand = require("./commands/complete");
const skipCommand = require("./commands/skip");
const statsCommand = require("./commands/stats");
const streakCommand = require("./commands/streak");
const historyCommand = require("./commands/history");


const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});


async function registerCommands() {
  const rest = new REST({ version: "10" })
    .setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      client.user.id,
      process.env.GUILD_ID
    ),
    {
      body: [
  todayCommand.data.toJSON(),
  completeCommand.data.toJSON(),
  skipCommand.data.toJSON(),
  statsCommand.data.toJSON(),
  streakCommand.data.toJSON(),
  historyCommand.data.toJSON()
],
    }
  );

  console.log("Slash commands registered.");
}


client.once("clientReady", async () => {
  try {
    console.log(`Logged in as ${client.user.tag}`);

    await registerCommands();

    const channel = await client.channels.fetch(
      process.env.CHANNEL_ID
    );

    if (!channel) {
      console.log("Channel not found.");
      return;
    }

    console.log("Study bot is ready.");

    startScheduler(
      channel,
      process.env.USER_ID
    );

  } catch (error) {
    console.error("Bot startup error:");
    console.error(error);
  }
});


client.on("interactionCreate", async (interaction) => {

  // Slash commands
  if (interaction.isChatInputCommand()) {

    if (interaction.commandName === "today") {
      await todayCommand.execute(interaction);
    }

    if (interaction.commandName === "complete") {
      await completeCommand.execute(interaction);
    }
    if (interaction.commandName === "skip") {
      await skipCommand.execute(interaction);
    }
    if (interaction.commandName === "stats") {
  await statsCommand.execute(interaction);
}
    if (interaction.commandName === "streak") {
  await streakCommand.execute(interaction);
}
    if(interaction.commandName==="history"){
      await historyCommand.execute(interaction);
    }
    return;
  }


  // Buttons
  if (interaction.isButton()) {
    await handleTaskButton(interaction);
  }
});


client.login(process.env.DISCORD_TOKEN);