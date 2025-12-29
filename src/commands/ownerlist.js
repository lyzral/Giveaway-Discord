const { SlashCommandBuilder } = require("discord.js");
const config = require("../../config");
const { getOwners } = require("../utils/owners");

function isSys(userId) {
  return Array.isArray(config.SYS) && config.SYS.includes(userId);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ownerlist")
    .setDescription("Afficher la liste des owners (SYS only)"),

  async execute(interaction) {
    if (!isSys(interaction.user.id)) {
      return interaction.reply({ content: "❌ Permission refusée.", ephemeral: true });
    }
    const data = getOwners();
    const owners = Array.isArray(data.owners) ? data.owners : [];
    return interaction.reply({
      content: owners.length ? `👑 Owners: ${owners.map(id => `<@${id}>`).join(", ")}` : "👑 Owners: Aucun",
      ephemeral: true
    });
  }
};
