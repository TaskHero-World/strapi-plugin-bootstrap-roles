# Strapi plugin strapi-plugin-bootstrap-roles

This plugin creates roles and permissions for administrators and users. 
These are created based on a couple custom config files.
During a development startup or test startup there will be roles automaticly created for all created roles.

## Installation  
------
```
# using yarn
yarn add strapi-plugin-bootstrap-roles

# using npm
npm install strapi-plugin-bootstrap-roles --save
```

## Usage load-admin-roles
------
After installing the following file needs to be created in the config folder. 
The file `adminRoles.js` for admin roles and permissions.
The admin permissions include Collection Types, Single Types and plugins.
an example for `config/adminRoles.js` is shown below. This example admin role is called "testAdmin" and he does not have any permissions.
The fields name, code, description and developmentUser are required.

```js
module.exports = ({ env }) => ({
  testAdmin: {
    name: 'Test Admin',
    code: 'strapi-test-admin',
    description: 'Test Admins can access and manage most features and settings.',
    developmentUser: {
      email: 'test@test.com',
      password: 'test',
    },
    permissions: {}
  }
});
```

### Collection Types and Single Types
To add Collection Types and or Single Types to the permissions of an admin add the following to the permissions object.
In the permissions object there need to be one object called "contentTypes". This object contains all CollectionTypes and Single Types you want this role to have access to. The chosen example is "restaurant".
Within this object you have the different crud statements you want this role to have access to. `read` and `update` in the example.
This crud can have the string '*' to give access to all fields within the content type.
If you want to give access to specific fields only, you should create an array like shown below with all the fields you want this role to have access to.
This example will give access to the restaurant content type and will allow this role to `read` all fields but can only `update` the fields: "name", "email" and "phoneNumber"

```js
contentTypes: {
  restaurant: {
    read: '*',
    update: [
      'name',
      'email',
      'phoneNumber',
    ],
  },
},
```

### Plugins
To add plugins to the permissions of an admin add the following to the permissions object.
In the permissions object there need to be one object called "plugins".
In this plugins object there are all the plugin names, in this case "upload".
Within that the plugin name object there are all the direct actions as keys and have the value ''.
If there are actions within a category in your plugin make they key your plugin category. The upload plugin has the category "assets".
This category has an array with all the actions inside of it.

```js
plugins: {
  upload: {
    read: '',
    assets: [
      'download',
      'create',
      'update',
      'copy-link',
    ],
  },
},
```

## Usage load-roles
------
After installing the following file needs to be created in the config folder.
The file `roles.js` for user-permissions-roles and user-permissions-permissions.
an example for `config/roles.js` is shown below.
The fields name, code and description are required.
This object consists of roles in this case there is only one role called `authenticated` and has a name, description, type and permissions.
In the permission object there are possibly multiple objects with the permission type as key. In this case it is "users-permissions".
This permission type has an object called controllers and that object contains specific controllers. In this case the controller "user".
Within the controller you put all the actions that this role can perform. In this case the action "me".

```js
module.exports = () => ({
  authenticated: {
    name: 'Authenticated',
    description: 'Default role given to an authenticated user.',
    type: 'authenticated',
    permissions: {
      'users-permissions': {
        controllers: {
          user: {
            me: { enabled: true, policy: '' },
          },
        },
      },
    },
  },
});
```

There is a more simple version shown below.
```
permissions -> type -> "controllers" -> controller(specific) -> action
permissions -> 'users-permissions' -> "controllers" -> user -> me
```


## full example adminRoles.js
------
A fulle example adminRoles.js is shown below.

```js
module.exports = ({ env }) => ({
  testAdmin: {
    name: 'Test Admin',
    code: 'strapi-test-admin',
    description: 'Test Admins can access and manage most features and settings.',
    developmentUser: {
      email: 'test@test.com',
      password: 'test',
    },
    permissions: {
      contentTypes: {
        restaurant: {
          read: '*',
          update: [
            'name',
            'email',
            'phoneNumber',
          ],
        },
        pizza: {
          read: '*',
        },
      },
      plugins: {
        upload: {
          read: '',
          assets: [
            'download',
            'create',
            'update',
            'copy-link',
          ],
        },
      },
    },
  },
});
```

## Full example roles.js
------
A full example roles.js is shown below.

```js
module.exports = () => ({
  authenticated: {
    name: 'Authenticated',
    description: 'Default role given to an authenticated user.',
    type: 'authenticated',
    permissions: {
      'users-permissions': {
        controllers: {
          user: {
            me: { enabled: true, policy: '' },
          },
        },
      },
    },
  },
  public: {
    name: 'Public',
    description: 'Default role given to an unauthenticated user.',
    type: 'public',
    permissions: {
      application: {
        controllers: {
          restaurant: {
            create: { enabled: true, policy: '' },
            update: { enabled: true, policy: '' },
          },
          pizza: {
            read: { enabled: true, policy: '' },
          },
        },
      },
      'users-permissions': {
        controllers: {
          auth: {
            forgotpassword: { enabled: true, policy: '' },
            resetpassword: { enabled: true, policy: '' },
            emailconfirmation: { enabled: true, policy: '' },
            callback: { enabled: true, policy: '' },
          },
        },
      },
    },
  },
});
```