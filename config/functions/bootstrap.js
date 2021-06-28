const loadRoles = require('../../services/load-roles');
const loadAdminRoles = require('../../services/load-admin-roles');

module.exports = async () => {
  await loadRoles({});
  await loadAdminRoles({});
};
