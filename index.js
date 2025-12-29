
const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, "src/commands");
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
  const cmd = require(path.join(commandsPath, file));
  client.commands.set(cmd.data.name, cmd);
}

// Load events
const eventsPath = path.join(__dirname, "src/events");
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"))) {
  const evt = require(path.join(eventsPath, file));
  if (evt.once) client.once(evt.name, (...args) => evt.execute(client, ...args));
  else client.on(evt.name, (...args) => evt.execute(client, ...args));
}

process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));

client.login(config.TOKEN);
