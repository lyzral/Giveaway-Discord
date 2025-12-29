
const {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const config = require("../../config");
const giveawayCmd = require("../commands/giveaway");
const { parseDuration } = require("../utils/duration");
const { isOwner } = require("../utils/owners");
const { buildPanelEmbed } = require("../utils/panel");
const path = require("path");
const { readJson, writeJson } = require("../utils/storage");

const GIVEAWAYS_PATH = path.join(__dirname, "../../data/giveaways.json");

function requireSys(interaction) {
  const allowed = giveawayCmd.isSys(interaction.user.id) || isOwner(interaction.user.id);
  if (!allowed) {
    interaction.reply({ content: "❌ Permission refusée.", ephemeral: true }).catch(() => {});
    return false;
  }
  return true;
}

async function editPanel(client, session) {
  if (!session?.panelChannelId || !session?.panelMessageId) return false;
  const ch = await client.channels.fetch(session.panelChannelId).catch(() => null);
  if (!ch) return false;
  const msg = await ch.messages.fetch(session.panelMessageId).catch(() => null);
  if (!msg) return false;

  await msg.edit({
    embeds: [buildPanelEmbed(session.cfg, config.BRAND)],
    components: giveawayCmd.buildPanelComponents()
  }).catch(() => {});

  return true;
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

module.exports = {
  name: "interactionCreate",
  async execute(client, interaction) {
    // Slash commands
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction);
      } catch (e) {
        console.error(e);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: "❌ Erreur commande.", ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ content: "❌ Erreur commande.", ephemeral: true }).catch(() => {});
        }
      }
      return;
    }

    // Panel select
    if (interaction.isStringSelectMenu() && interaction.customId === "gw:select") {
      if (!requireSys(interaction)) return;

      const session = giveawayCmd.getSession(interaction.user.id);
      if (!session) return interaction.reply({ content: "Session expirée. Relance /giveaway", ephemeral: true });

      const choice = interaction.values[0];

      if (choice === "voice") {
        session.cfg.voiceRequired = !session.cfg.voiceRequired;
        giveawayCmd.saveSession(session);
        await editPanel(client, session);
        return interaction.reply({ content: "✅ Paramètre mis à jour.", ephemeral: true });
      }

      if (choice === "channel") {
        const row = new ActionRowBuilder().addComponents(
          new ChannelSelectMenuBuilder()
            .setCustomId("gw:channel")
            .setPlaceholder("Choisis le salon d'envoi")
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setMaxValues(1)
        );
        return interaction.reply({ content: "Choisis le salon :", components: [row], ephemeral: true });
      }

      // modal for others
      const map = {
        prize: { title: "Modifier le gain", label: "Quel est le gain du giveaway ?", placeholder: "Ex: Deco X1", max: 256 },
        duration: { title: "Modifier la durée", label: "Durée (ex: 10m, 2h, 1d, 1h30m)", placeholder: "1h30m", max: 32 },
        winners: { title: "Modifier le nombre de gagnants", label: "Nombre de gagnants (1-50)", placeholder: "1", max: 3 },
        emoji: { title: "Modifier l'émoji", label: "Emoji (🎉 ou <:name:id>)", placeholder: "🎉", max: 64 }
      }[choice];

      if (!map) return;

      const modal = new ModalBuilder().setCustomId(`gw:modal:${choice}`).setTitle(map.title);
      const input = new TextInputBuilder()
        .setCustomId("value")
        .setLabel(map.label)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(map.max)
        .setPlaceholder(map.placeholder);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }

    // Channel select result
    if (interaction.isChannelSelectMenu() && interaction.customId === "gw:channel") {
      if (!requireSys(interaction)) return;

      const session = giveawayCmd.getSession(interaction.user.id);
      if (!session) return interaction.reply({ content: "Session expirée. Relance /giveaway", ephemeral: true });

      session.cfg.channelId = interaction.values?.[0] || null;
      giveawayCmd.saveSession(session);
      await editPanel(client, session);

      return interaction.reply({ content: "✅ Salon mis à jour.", ephemeral: true });
    }

    // Modal submit
    if (interaction.isModalSubmit() && interaction.customId.startsWith("gw:modal:")) {
      if (!requireSys(interaction)) return;

      const session = giveawayCmd.getSession(interaction.user.id);
      if (!session) return interaction.reply({ content: "Session expirée. Relance /giveaway", ephemeral: true });

      const type = interaction.customId.split(":")[2];
      const value = interaction.fields.getTextInputValue("value")?.trim();

      if (type === "prize") {
        session.cfg.prize = value.slice(0, 256);
      } else if (type === "duration") {
        const ms = parseDuration(value);
        if (!ms || ms < 10_000) {
          return interaction.reply({ content: "❌ Durée invalide. Ex: 10m, 2h, 1d, 1h30m", ephemeral: true });
        }
        session.cfg.durationMs = ms;
      } else if (type === "winners") {
        const n = Number(value);
        if (!Number.isInteger(n) || n < 1 || n > 50) {
          return interaction.reply({ content: "❌ Mets un nombre entre 1 et 50.", ephemeral: true });
        }
        session.cfg.winners = n;
      } else if (type === "emoji") {
        session.cfg.emoji = value.slice(0, 64) || "🎉";
      }

      giveawayCmd.saveSession(session);
      await editPanel(client, session);

      return interaction.reply({ content: "✅ Paramètre mis à jour.", ephemeral: true });
    }

    // Cancel panel
    if (interaction.isButton() && interaction.customId === "gw:cancel") {
      if (!requireSys(interaction)) return;

      const session = giveawayCmd.getSession(interaction.user.id);
      if (!session) return interaction.reply({ content: "Session expirée.", ephemeral: true });

      // delete panel message
      const ch = await client.channels.fetch(session.panelChannelId).catch(() => null);
      const msg = ch ? await ch.messages.fetch(session.panelMessageId).catch(() => null) : null;
      if (msg) await msg.delete().catch(() => {});

      return interaction.reply({ content: "✅ Panel supprimé.", ephemeral: true });
    }

    // Validate -> start giveaway
    if (interaction.isButton() && interaction.customId === "gw:validate") {
      if (!requireSys(interaction)) return;

      const session = giveawayCmd.getSession(interaction.user.id);
      if (!session) return interaction.reply({ content: "Session expirée. Relance /giveaway", ephemeral: true });

      if (!session.cfg.channelId) {
        return interaction.reply({ content: "❌ Choisis un salon avant de valider.", ephemeral: true });
      }

      const channel = await interaction.guild.channels.fetch(session.cfg.channelId).catch(() => null);
      if (!channel) return interaction.reply({ content: "❌ Salon introuvable.", ephemeral: true });

      const gwId = `gw_${Date.now()}`;
      const endsAt = Date.now() + session.cfg.durationMs;

      const joinBtn = new ButtonBuilder()
        .setCustomId(`gw:join:${gwId}`)
        .setLabel("Participer")
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(joinBtn);

      const embed = new EmbedBuilder()
        .setTitle(`${session.cfg.emoji || "🎉"} Giveaway`)
        .setDescription(
          `**Gain :** ${session.cfg.prize}\n` +
          `**Gagnants :** ${session.cfg.winners}\n` +
          `**Participants :** 0\n` +
          `**Fin :** <t:${Math.floor(endsAt / 1000)}:F>\n\n` +
          `Clique sur **Participer** pour entrer !`
        )
        .setColor(0x2b2d31)
        .setFooter({ text: config.BRAND?.footer || "Crow Bots" });

      const gwMsg = await channel.send({ embeds: [embed], components: [row] });

      const all = readJson(GIVEAWAYS_PATH, {});
      all[gwId] = {
        id: gwId,
        guildId: interaction.guild.id,
        channelId: channel.id,
        messageId: gwMsg.id,
        prize: session.cfg.prize,
        winners: session.cfg.winners,
        emoji: session.cfg.emoji,
        voiceRequired: !!session.cfg.voiceRequired,
        endsAt,
        ended: false,
        entrants: []
      };
      writeJson(GIVEAWAYS_PATH, all);

      // schedule end
      const delay = Math.min(Math.max(0, endsAt - Date.now()), 2_147_483_647);
      setTimeout(async () => {
        const all2 = readJson(GIVEAWAYS_PATH, {});
        const gw = all2[gwId];
        if (!gw || gw.ended) return;

        gw.ended = true;
        all2[gwId] = gw;
        writeJson(GIVEAWAYS_PATH, all2);

        const ch = await client.channels.fetch(gw.channelId).catch(() => null);
        if (!ch) return;
        const msg = await ch.messages.fetch(gw.messageId).catch(() => null);

        const entrants = Array.isArray(gw.entrants) ? gw.entrants : [];
        if (entrants.length === 0) {
          await ch.send(`🎉 Giveaway terminé : personne n'a participé (**${gw.prize}**).`).catch(() => {});
        } else {
          const winners = pickWinners(entrants, gw.winners);
          await ch.send(`🎉 Giveaway terminé ! Gain: **${gw.prize}**\nGagnant(s): ${winners.map(id => `<@${id}>`).join(", ")}`).catch(() => {});
        }

        if (msg) {
          try {
            const row = msg.components?.[0];
            if (row) {
              const btn = row.components?.[0];
              if (btn) {
                const disabledRow = new ActionRowBuilder().addComponents(ButtonBuilder.from(btn).setDisabled(true));
                await msg.edit({ components: [disabledRow] });
              }
            }
          } catch {}
        }
      }, delay);

      return interaction.reply({ content: "✅ Giveaway lancé !", ephemeral: true });
    }

    // Join giveaway
    if (interaction.isButton() && interaction.customId.startsWith("gw:join:")) {
      const gwId = interaction.customId.split(":")[2];
      const all = readJson(GIVEAWAYS_PATH, {});
      const gw = all[gwId];
      if (!gw) return interaction.reply({ content: "❌ Giveaway introuvable.", ephemeral: true });
      if (gw.ended || Date.now() >= gw.endsAt) return interaction.reply({ content: "❌ Ce giveaway est terminé.", ephemeral: true });

      // voice required
      if (gw.voiceRequired) {
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        const inVoice = member?.voice?.channelId;
        if (!inVoice) return interaction.reply({ content: "🔊 Tu dois être en vocal pour participer.", ephemeral: true });
      }

      gw.entrants = Array.isArray(gw.entrants) ? gw.entrants : [];
      if (gw.entrants.includes(interaction.user.id)) {
        return interaction.reply({ content: "✅ Tu participes déjà.", ephemeral: true });
      }

      gw.entrants.push(interaction.user.id);
      all[gwId] = gw;
      writeJson(GIVEAWAYS_PATH, all);

      // update participants count on the giveaway message
      try {
        const channel = await client.channels.fetch(gw.channelId).catch(() => null);
        if (channel) {
          const msg = await channel.messages.fetch(gw.messageId).catch(() => null);
          if (msg && msg.embeds && msg.embeds[0]) {
            const old = msg.embeds[0];
            const eb = EmbedBuilder.from(old);
            const desc = eb.data.description || "";
            const count = gw.entrants.length;

            if (/\*\*Participants\s*:\*\*/i.test(desc)) {
              eb.setDescription(desc.replace(/\*\*Participants\s*:\*\*\s*\d+/i, `**Participants :** ${count}`));
            } else {
              eb.setDescription(desc.replace(/\*\*Fin\s*:\*\*/i, `**Participants :** ${count}\n**Fin :**`));
            }
            await msg.edit({ embeds: [eb] }).catch(() => {});
          }
        }
      } catch {}

      return interaction.reply({ content: "✅ Participation enregistrée !", ephemeral: true });
    }
  }
};
