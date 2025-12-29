
const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const config = require("../../config");
const path = require("path");
const { readJson, writeJson } = require("../utils/storage");
const { buildPanelEmbed } = require("../utils/panel");
const { isOwner } = require("../utils/owners");

const SESSIONS_PATH = path.join(__dirname, "../../data/sessions.json");

function isSys(userId) {
  return Array.isArray(config.SYS) && config.SYS.includes(userId);
}


function canUse(userId) {
  return isSys(userId) || isOwner(userId);
}
function createSession(userId, panel) {
  return {
    userId,
    panelMessageId: panel?.messageId || null,
    panelChannelId: panel?.channelId || null,
    cfg: { ...config.DEFAULTS },
    createdAt: Date.now()
  };
}

function getSessions() {
  return readJson(SESSIONS_PATH, {});
}

function saveSession(session) {
  const all = getSessions();
  all[session.userId] = session;
  writeJson(SESSIONS_PATH, all);
}

function getSession(userId) {
  const all = getSessions();
  return all[userId] || null;
}

function buildPanelComponents() {
  const select = new StringSelectMenuBuilder()
    .setCustomId("gw:select")
    .setPlaceholder("Make a selection")
    .addOptions(
      { label: "Modifier le gain", value: "prize", emoji: "🎁" },
      { label: "Modifier la durée", value: "duration", emoji: "🕒" },
      { label: "Modifier le salon", value: "channel", emoji: "🏷️" },
      { label: "Modifier le nombre de gagnant", value: "winners", emoji: "👥" },
      { label: "Modifier l'émoji", value: "emoji", emoji: "🎉" },
      { label: "Présence voc obligatoire (ON/OFF)", value: "voice", emoji: "🔊" }
    );

  const row1 = new ActionRowBuilder().addComponents(select);
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("gw:validate").setLabel("Valider").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("gw:cancel").setLabel("Annuler").setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("giveaway")
    .setDescription("Ouvre le panel de configuration giveaway (SYS only)"),

  isSys,
  canUse,
  getSession,
  saveSession,
  buildPanelComponents,

  async execute(interaction) {
    if (!canUse(interaction.user.id)) {
      return interaction.reply({ content: "❌ Tu n'as pas la permission.", ephemeral: true });
    }

    const embed = buildPanelEmbed(config.DEFAULTS, config.BRAND);
    const components = buildPanelComponents();

    // Panel visible dans le salon (plus simple à éditer depuis les modals)
    const msg = await interaction.channel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [embed],
      components
    });

    const session = createSession(interaction.user.id, { messageId: msg.id, channelId: msg.channel.id });
    saveSession(session);

    return interaction.reply({ content: "✅ Panel envoyé.", ephemeral: true });
  }
};
