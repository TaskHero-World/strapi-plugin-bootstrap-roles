module.exports = async ({ roles = strapi.config.get('roles', {}) }) => {
  for(const role in roles) {
    const type = roles[role].type;
    let { id: roleId } = await strapi.query('role', 'users-permissions').findOne({ type }) || {};

    if(roleId) {
      await strapi.plugins['users-permissions'].services.userspermissions.updateRole(roleId, roles[role]);
    } else {
      await strapi.plugins['users-permissions'].services.userspermissions.createRole(roles[role]);
      roleId = (await strapi.query('role', 'users-permissions').findOne({ type })).id;
    }

    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      const { id: userId } = await strapi.plugins['users-permissions'].services.user.fetch({ username: type }) || {};

      if(userId) {
        await strapi.plugins['users-permissions'].services.user.edit({ id: userId }, { email: `${type}@flemas.com`, provider: 'local', password: type, confirmed: true, blocked: false, role: roleId });
      } else {
        await strapi.plugins['users-permissions'].services.user.add({ username: type, email: `${type}@flemas.com`, provider: 'local', password: type, confirmed: true, blocked: false, role: roleId });
      }
    }
  }

  await strapi.plugins['users-permissions'].services.userspermissions.updatePermissions();
};
