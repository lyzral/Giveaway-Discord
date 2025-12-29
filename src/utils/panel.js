
const { EmbedBuilder, time } = require("discord.js");
const { formatDuration } = require("./duration");

function buildPanelEmbed(cfg, brand) {
  const endAt = new Date(Date.now() + (cfg.durationMs || 0));
  const ends = cfg.durationMs ? `${formatDuration(cfg.durationMs)}\n${time(endAt, "F")}` : "Aucun";

  const embed = new EmbedBuilder()
    .setTitle("Paramètre du giveaway")
    .setColor(0x2b2d31)
    .addFields(
      { name: "Gain", value: cfg.prize || "Aucun", inline: true },
      { name: "Durée", value: ends, inline: true },
      { name: "Salon", value: cfg.channelId ? `<#${cfg.channelId}>` : "Aucun", inline: true },

      { name: "Emoji", value: cfg.emoji || "🎉", inline: true },
      { name: "Nombre de gagnants", value: String(cfg.winners ?? 1), inline: true },
      { name: "Présence en voc obligatoire", value: cfg.voiceRequired ? "✅" : "❌", inline: true },

      { name: "Rôles requis", value: "Aucun", inline: true },
      { name: "Rôles interdits", value: "Aucun", inline: true },
      { name: "Serveurs requis", value: "Aucun", inline: true },

      { name: "Gagnants imposés", value: "Aucun", inline: false }
    )
    .setFooter({ text: brand?.footer || "Crow Bots" });

  return embed;
}

module.exports = { buildPanelEmbed };
