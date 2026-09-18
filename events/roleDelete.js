const { Events } = require('discord.js');
const { sendAuditLog } = require('../utils/auditLogger');

module.exports = {
  name: Events.RoleDelete,
  async execute(role) {
    await sendAuditLog(role.guild, `➖ Role deleted: @${role.name}`);
  },
};
