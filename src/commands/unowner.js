const { SlashCommandBuilder } = require("discord.js");
const config = require("../../config");
const { removeOwner } = require("../utils/owners");

function isSys(userId) {
  return Array.isArray(config.SYS) && config.SYS.includes(userId);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unowner")
    .setDescription("Retirer un owner du bot (SYS only)")
    .addUserOption(opt => opt.setName("membre").setDescription("Membre à retirer").setRequired(true)),

  async execute(interaction) {
    if (!isSys(interaction.user.id)) {
      return interaction.reply({ content: "❌ Permission refusée.", ephemeral: true });
    }
    const user = interaction.options.getUser("membre", true);
    const owners = removeOwner(user.id);
    return interaction.reply({
      content: `✅ <@${user.id}> retiré des owners.\n👑 Owners: ${owners.length ? owners.map(id => `<@${id}>`).join(", ") : "Aucun"}`,
      ephemeral: true
    });
  }
};
