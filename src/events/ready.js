
const { REST, Routes } = require("discord.js");
const config = require("../../config");
const path = require("path");
const { readJson, writeJson } = require("../utils/storage");

const GIVEAWAYS_PATH = path.join(__dirname, "../../data/giveaways.json");

async function safeDeploy(client) {
  if (!config.GUILD_ID) {
    console.log("⚠️ GUILD_ID manquant dans config.js -> pas de deploy auto.");
    return;
  }

  try {
    const rest = new REST({ version: "10" }).setToken(config.TOKEN);
    const commands = [...client.commands.values()].map(c => c.data.toJSON());

    await rest.put(
      Routes.applicationGuildCommands(client.application.id, config.GUILD_ID),
      { body: commands }
    );

    console.log("✅ Slash commands déployées sur le serveur:", config.GUILD_ID);
  } catch (e) {
    console.log("⚠️ Deploy slash commands échoué (le bot continue quand même).");
    console.log("   Erreur:", e?.rawError?.message || e?.message || e);
  }
}

function pickWinners(arr, n) {
  const copy = [...arr];
  const winners = [];
  while (copy.length && winners.length < n) {
    const i = Math.floor(Math.random() * copy.length);
    winners.push(copy.splice(i, 1)[0]);
  }
  return winners;
}

async function endGiveaway(client, gwId) {
  const all = readJson(GIVEAWAYS_PATH, {});
  const gw = all[gwId];
  if (!gw || gw.ended) return;

  gw.ended = true;
  all[gwId] = gw;
  writeJson(GIVEAWAYS_PATH, all);

  const channel = await client.channels.fetch(gw.channelId).catch(() => null);
  if (!channel) return;

  const msg = await channel.messages.fetch(gw.messageId).catch(() => null);

  const entrants = Array.isArray(gw.entrants) ? gw.entrants : [];
  if (entrants.length === 0) {
    await channel.send(`🎉 Giveaway terminé : personne n'a participé (**${gw.prize}**).`).catch(() => {});
  } else {
    const winners = pickWinners(entrants, gw.winners);
    await channel.send(`🎉 Giveaway terminé ! Gain: **${gw.prize}**\nGagnant(s): ${winners.map(id => `<@${id}>`).join(", ")}`).catch(() => {});
  }

  if (msg) {
    // disable button
    try {
      const row = msg.components?.[0];
      if (row) {
        const btn = row.components?.[0];
        if (btn) {
          const { ActionRowBuilder, ButtonBuilder } = require("discord.js");
          const disabledRow = new ActionRowBuilder().addComponents(ButtonBuilder.from(btn).setDisabled(true));
          await msg.edit({ components: [disabledRow] });
        }
      }
    } catch {}
  }
}

function scheduleAll(client) {
  const all = readJson(GIVEAWAYS_PATH, {});
  for (const gwId of Object.keys(all)) {
    const gw = all[gwId];
    if (!gw || gw.ended) continue;
    const ms = Math.max(0, (gw.endsAt || 0) - Date.now());

    const delay = Math.min(ms, 2_147_483_647);
    setTimeout(() => endGiveaway(client, gwId), delay);
  }
}

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log(`✅ Logged as ${client.user.tag}`);
    await safeDeploy(client);
    scheduleAll(client);
  }
};
