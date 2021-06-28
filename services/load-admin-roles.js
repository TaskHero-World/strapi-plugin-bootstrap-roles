const createPermission = async (attributes, permissionService) => {
  let idToKeep = -1;

  const { roleId } = attributes;
  const permission = await permissionService.sanitizePermission(attributes);
  permission.role = roleId;
  let searchPermissions;
  if(permission.subject) {
    searchPermissions = await permissionService.find({ action: permission.action, subject: permission.subject, role: roleId });
  } else {
    searchPermissions = await permissionService.find({ action: permission.action, role: roleId });
  }

  if(Array.isArray(searchPermissions) && searchPermissions.length < 1) {
    const newPermission = await permissionService.createMany([permission]);
    idToKeep = newPermission[0].id;
  } else {
    const updatedPermission = await strapi.query('permission', 'admin').update({ id: searchPermissions[0].id }, permission);
    idToKeep = updatedPermission.id;
  }

  return idToKeep;
};

const setAdminPermissions = async (currentRole) => {
  const permissionService = strapi.admin.services.permission;

  const { name, permissions } = currentRole;
  const { id: roleId } = await strapi.query('role', 'admin').findOne({ name }) || {};
  const idsToKeep = [];

  if(permissions) {
    for (const permissionType in permissions) {
      const permType = permissions[permissionType];

      if(Object.keys(permType).length > 0) {
        if(permissionType === 'contentTypes') {
          for (const collectionType in permType) {
            const subject = `application::${collectionType}.${collectionType}`;
            const collType = permType[collectionType];

            if(Object.keys(collType).length > 0) {
              for (const crud in collType) {
                let fields = collType[crud];
                const action = `plugins::content-manager.explorer.${crud}`;

                if(fields === '*') {
                  fields = [];
                  const collectionTypeAttributes = await strapi.models[collectionType].attributes;
                  for (const attribute in collectionTypeAttributes) {
                    fields.push(attribute);
                  }
                }

                const attributes = {
                  action,
                  subject,
                  fields,
                  roleId,
                };
                idsToKeep.push(await createPermission(attributes, permissionService));

              }
            }
          }
        } else if(permissionType === 'plugins') {
          for (const pluginName in permType) {
            const pluginInfo = permType[pluginName];
            for (const pluginInfoType in pluginInfo) {
              const pluginActions = pluginInfo[pluginInfoType];
              if(pluginActions !== '') {
                for(const pluginAction in pluginActions) {
                  const action = `plugins::${pluginName}.${pluginInfoType}.${pluginActions[pluginAction]}`;
                  const attributes = {
                    action,
                    roleId,
                  };

                  idsToKeep.push(await createPermission(attributes, permissionService));
                }
              } else {
                const action = `plugins::${pluginName}.${pluginInfoType}`;
                const attributes = {
                  action,
                  roleId,
                };

                idsToKeep.push(await createPermission(attributes, permissionService));
              }
            }
          }
        }
      }
    };
  }

  const idsToDelete = [];
  const rolePermissions = await permissionService.find({ role: roleId });

  for(const permission in rolePermissions) {
    const rolePermission = rolePermissions[permission];
    if(!idsToKeep.includes(rolePermission.id)) {
      idsToDelete.push(rolePermission.id);
    }
  }

  await permissionService.deleteByIds(idsToDelete);
};

module.exports = async ({ roles = strapi.config.get('adminRoles', {}) }) => {
  const roleService = strapi.admin.services.role;
  const userService = strapi.admin.services.user;
  const rolesToKeep = [];

  for(const role in roles) {
    const currentRole = roles[role];
    const { code, description, developmentUser } = currentRole;
    let { name } = currentRole;
    const adminRoleInformation = { name, code, description };
    let { id: roleId } = await roleService.findOne({ name }) || {};

    if(currentRole.code === 'strapi-super-admin') {
      return;
    }

    if(roleId) {
      await roleService.update({ id: roleId }, adminRoleInformation);
    } else {
      roleId = (await roleService.create(adminRoleInformation)).id;
    }

    rolesToKeep.push(roleId);

    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      name = name.replace(/\s/g, '');
      const admin = await userService.findOne({ username: name });
      const password = await strapi.admin.services.auth.hashPassword(developmentUser.password);
      if(admin) {
        await userService.updateById(admin.id, { firstname: name, lastname: name, email: developmentUser.email, password, isActive: true, blocked: false, roles: [roleId] });
      } else {
        await userService.create({ username: name, firstname: name, lastname: name, email: developmentUser.email, password, isActive: true, blocked: false, roles: [roleId] });
      }
    }

    await setAdminPermissions(currentRole);
  }

  const allRoles = await roleService.find();

  for(const roleNumber in allRoles) {
    const role = allRoles[roleNumber];

    if(role.name === 'Super Admin') {
      continue;
    }

    if(!rolesToKeep.includes(role.id)) {
      const usersToDelete = await strapi.query('user', 'admin').find({ roles: role.id });
      const userIdsToDelete = [];
      for (const key in usersToDelete) {
        userIdsToDelete.push(usersToDelete[key].id);
      }
      await userService.deleteByIds(userIdsToDelete);
      await roleService.deleteByIds([role.id]);
    }
  }
};
