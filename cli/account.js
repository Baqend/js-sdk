'use strict';
const os = require('os');
const fs = require('fs');
const baqend = require('../lib/baqend');
const fileName = os.homedir() + '/.baqend';
const crypto = require('crypto');
const opn = require('opn');
const algorithm = 'aes-256-ctr';
const password = 'N2Ki=za[8iy4ff4jYn/3,y;';
const bbqHost = 'bbq';
const helper = require('./helper');

function getAppInfo(args) {
  const isCustomHost = args.app && /^https?:\/\//.test(args.app);

  return {
    isCustomHost: !!isCustomHost,
    host: isCustomHost? args.app: bbqHost,
    app: isCustomHost? null: args.app
  };
}

function getArgsCredentials(args) {
  if (args.username && args.password) {
    return {
      username: args.username,
      password: args.password
    };
  }

  if (args.token) {
    return {token: args.token};
  }

  return null;
}

function getEnvCredentials() {
  const token = process.env.BAQEND_TOKEN || process.env.BAT;
  if (token) {
    return { token: token };
  }

  return null;
}

function getProfileCredentials(appInfo) {
  return readProfileFile().then(json => {
    const credentials = json[appInfo.host];

    if (!credentials) {
      return null;
    }

    if (credentials.password) {
      credentials.password = decrypt(credentials.password);
    }

    return credentials;
  }).catch(() => null);
}

function getLocalCredentials(appInfo) {
  if (appInfo.isCustomHost) {
    return {username: 'root', password: 'root'};
  }

  return null;
}

function getInputCredentials(appInfo, showLoginInfo) {
  if (!process.stdout.isTTY) {
    return Promise.reject(new Error('Can\'t interactive login into baqend, no tty session was detected.'));
  }

  if (showLoginInfo) {
    console.log('Baqend Login is required. You can skip this step by saving the Login credentials with "baqend login"');
  }

  if (!appInfo.isCustomHost) {
    console.log('If you have created your Baqend Account with OAuth:');
    console.log(' 1. Login to the dashboard with OAuth.');
    console.log(' 2. Go to your account settings (top right corner)');
    console.log(' 3. Add a password to your account, which you can then use with the CLI.');
    console.log('');
  }

  return readInputCredentials(appInfo);
}

function getCredentials(appInfo, args) {
  let providers = Promise.resolve(null)
    .then(credentials => credentials || getArgsCredentials(args))
    .then(credentials => credentials || getEnvCredentials())
    .then(credentials => credentials || getProfileCredentials(appInfo))
    .then(credentials => credentials || getLocalCredentials(appInfo));

  if (!args.skipInput && process.stdout.isTTY) {
    providers = providers
      .then(credentials => credentials || getInputCredentials(appInfo, true))
  }

  return providers;
}

function register(args) {
  const appInfo = getAppInfo(args);

  return getInputCredentials(appInfo)
    .then(credentials => {
      return appConnect(appInfo)
        .then(db => {
          return db.User.register(credentials.username, credentials.password).then(() => db);
        })
        .then(db => {
          return Promise.all([
            getDefaultApp(db).then(name => console.log('Your app name is ' + name)),
            saveCredentials(appInfo, credentials)
          ]);
        });
    });
}

function connect(args) {
  const appInfo = getAppInfo(args);
  return getCredentials(appInfo, args)
    .then(credentials => {
      if (!credentials)
        throw new Error('Login information are missing. Login with baqend login or pass a baqend token via BAQEND_TOKEN environment variable');

      return appConnect(appInfo, credentials);
    });
}

function appConnect(appInfo, credentials) {
  // do not use the global token storage here, to prevent login collisions on the bbq app
  let factory = new baqend.EntityManagerFactory({host: appInfo.host, secure: true, tokenStorageFactory: baqend.util.TokenStorage});
  return factory.createEntityManager(true).ready().then(db => {
    if (!credentials)
      return db;

    if (credentials.token) {
      return db.User.loginWithToken(credentials.token)
        .then((me) => {
          if (me) {
            return db;
          }
          throw new Error('Login with Baqend token failed.')
        });
    } else {
      return db.User.login(credentials.username, credentials.password).then(() => db);
    }
  });
}

function login(args) {
  const appInfo = getAppInfo(args);
  return connect(args)
    .then((db) => {
      if (appInfo.isCustomHost) {
        return db;
      }

      if (appInfo.app) {
        return bbqAppLogin(db, appInfo.app)
      }

      return getDefaultApp(db).then(appName => bbqAppLogin(db, appName));
    }).catch((e) => {
      // if the login failed try to directly login into the app
      if (appInfo.app && !appInfo.isCustomHost) {
        return login(Object.assign({}, args, {app: `https://${appInfo.app}.app.baqend.com/v1`}))
      }
      throw e;
    });
}

function bbqAppLogin(db, appName) {
  return db.modules.get('apps', { app: appName }).then((result) => {
    if (!result) {
      throw new Error(`App (${appName}) not found.`);
    }

    return appConnect({host: result.name}, {token: result.token});
  });
}

function logout(args) {
  const appInfo = getAppInfo(args);
  return readProfileFile().then((json) => {
    delete json[appInfo.host];
    return writeProfileFile(json);
  });
}

function persistLogin(args) {
  const appInfo = getAppInfo(args);
  let credentials = getArgsCredentials(args);

  if (!credentials) {
    credentials = getInputCredentials(appInfo, false);
  }

  return Promise.resolve(credentials)
    .then(credentials => {
      return appConnect(appInfo, credentials).then(() => {
        return saveCredentials(appInfo, credentials);
      });
    }).then(() => console.log('You have successfully been logged in.'));
}

function openApp(app) {
  if (app) {
    return opn(`https://${app}.app.baqend.com`);
  } else {
    return login({}).then(db => {
      opn(`https://${db._connector.host}`);
    });
  }
}

function openDashboard(args) {
  return connect(args).then(db => {
    opn(`https://dashboard.baqend.com/login?token=${db.token}`);
  }).catch(() => {
    opn('https://dashboard.baqend.com');
  });
}

function listApps(args) {
  return connect(args)
    .then(db => getApps(db))
    .then(apps => apps.forEach(app => console.log(app)))
}

function whoami(args) {
  return connect(Object.assign({skipInput: true}, args))
    .then(db => console.log(db.User.me.username), () => console.log('You are not logged in.'));
}

function getApps(db) {
  return db.modules.get('apps').then(apps => apps.map(app => app.name));
}

function getDefaultApp(db) {
  return getApps(db).then(apps => {
    if (apps.length === 1) {
      return apps[0];
    }
    throw new Error('Please add the name of your app as a parameter.');
  });
}

function readInputCredentials(appInfo) {
  return helper.readInput(appInfo.isCustomHost ? 'Username: ' : 'E-Mail: ')
      .then((username) => {
        return helper.readInput('Password: ', true).then((password) => {
          console.log();
          return { username: username, password: password };
        });
      });
}

function encrypt(input) {
  let cipher = crypto.createCipher(algorithm, password);
  let encrypted = cipher.update(input, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function decrypt(input) {
  let decipher = crypto.createDecipher(algorithm, password);
  let decrypted = decipher.update(input, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function writeProfileFile(json) {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, JSON.stringify(json), function(err) {
      if (err) {
        console.warn('Baqend Profile file can\'t be written', err);
        reject(err);
      }
      resolve();
    });
  });
}

function readProfileFile() {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, (err, data) => {
      if (err) {
        console.warn('Baqend Profile file can\'t be read', err);
        reject(err);
      }
      resolve(data ? JSON.parse(data.toString()) : {});
    });
  });
}

function saveCredentials(appInfo, credentials) {
  return readProfileFile().then((json) => {
    json[appInfo.host] = Object.assign({}, json[appInfo.host], credentials, {
      password: encrypt(credentials.password)
    });
    return writeProfileFile(json);
  });
}

exports.login = login;
exports.register = register;
exports.logout = logout;
exports.openApp = openApp;
exports.persistLogin = persistLogin;
exports.whoami = whoami;
exports.listApps = listApps;
exports.openDashboard = openDashboard;
