import open from 'open';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import { EntityManager, EntityManagerFactory, intersection } from 'baqend';
import * as helper from './helper';

const { TokenStorage } = intersection;

const fileName = `${os.homedir()}/.baqend`;
const algorithm = 'aes-256-ctr';
const cipherKey = Buffer.from('08cb2e72b03e90df6b4a4112d2933056574748707276fbdc62d1096d16ca18b1', 'hex');
const cipherIv = Buffer.from('fcc8e0479287f4809b77e1e23777e519', 'hex');
const PROFILE_DEFAULT_KEY = 'N2Ki=za[8iy4ff4jYn/3,y;';
const bbqHost = 'bbq';

export type AccountArgs = {
  app?: string,
  username?: string,
  password?: string,
  token?: string,
  skipInput?: boolean,
};

export type AppInfo = {
  isCustomHost: boolean,
  host: string,
  app: string | null,
};

export type UsernamePasswordCredentials = {
  username: string,
  password: string,
};

export type TokenCredentials = {
  token: string,
};

export type Credentials = UsernamePasswordCredentials | TokenCredentials;

type ProfileJson = {
  [host: string]: {
    host: string,
  } & Credentials,
};

function getAppInfo(args: AccountArgs): AppInfo {
  const isCustomHost = args.app && /^https?:\/\//.test(args.app);

  return {
    isCustomHost: !!isCustomHost,
    host: isCustomHost ? args.app! : bbqHost,
    app: isCustomHost ? null : args.app!,
  };
}

function getArgsCredentials(args: AccountArgs): Credentials | null {
  if (args.username && args.password) {
    return {
      username: args.username,
      password: args.password,
    };
  }

  if (args.token) {
    return { token: args.token };
  }

  return null;
}

function getEnvCredentials(): Credentials | null {
  const token = process.env.BAQEND_TOKEN || process.env.BAT;
  if (token) {
    return { token };
  }

  return null;
}

function getProfileCredentials(appInfo: AppInfo): Promise<Credentials | null> {
  return readProfileFile().then((json) => {
    const credentials = json[appInfo.host];

    if (!credentials) {
      return null;
    }

    if ('password' in credentials) {
      credentials.password = decrypt(credentials.password);
    }

    return credentials;
  }).catch(() => null);
}

function getLocalCredentials(appInfo: AppInfo): Credentials | null {
  if (appInfo.isCustomHost) {
    return { username: 'root', password: 'root' };
  }

  return null;
}

function getInputCredentials(appInfo: AppInfo, showLoginInfo?: boolean): Promise<UsernamePasswordCredentials> {
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

function getCredentials(appInfo: AppInfo, args: AccountArgs): Promise<Credentials | null> {
  let providers = Promise.resolve(null)
    .then((credentials) => credentials || getArgsCredentials(args))
    .then((credentials) => credentials || getEnvCredentials())
    .then((credentials) => credentials || getProfileCredentials(appInfo))
    .then((credentials) => credentials || getLocalCredentials(appInfo));

  if (!args.skipInput && process.stdout.isTTY) {
    providers = providers
      .then((credentials) => credentials || getInputCredentials(appInfo, true));
  }

  return providers;
}

export function register(args: AccountArgs) {
  const appInfo = getAppInfo(args);

  return getInputCredentials(appInfo)
    .then((credentials) => appConnect(appInfo)
      .then((db) => db.User.register(credentials.username, credentials.password).then(() => db))
      .then((db) => Promise.all([
        getDefaultApp(db).then((name) => console.log(`Your app name is ${name}`)),
        saveCredentials(appInfo, credentials!),
      ])));
}

function connect(args: AccountArgs) {
  const appInfo = getAppInfo(args);
  return getCredentials(appInfo, args)
    .then((credentials) => {
      if (!credentials) throw new Error('Login information are missing. Login with baqend login or pass a baqend token via BAQEND_TOKEN environment variable');

      return appConnect(appInfo, credentials);
    });
}

function appConnect(appInfo: AppInfo, credentials?: Credentials): Promise<EntityManager> {
  // do not use the global token storage here, to prevent login collisions on the bbq app
  const factory = new EntityManagerFactory({ host: appInfo.host, secure: true, tokenStorageFactory: TokenStorage });
  return factory.createEntityManager(true).ready().then((db: EntityManager) => {
    if (!credentials) return db;

    if ('token' in credentials) {
      return db.User.loginWithToken(credentials.token)
        .then((me) => {
          if (me) {
            return db;
          }
          throw new Error('Login with Baqend token failed.');
        });
    }
    return db.User.login(credentials.username, credentials.password).then(() => db);
  });
}

export function login(args: AccountArgs): Promise<EntityManager> {
  const appInfo = getAppInfo(args);
  return connect(args)
    .then((db) => {
      if (appInfo.isCustomHost) {
        return db;
      }

      if (appInfo.app) {
        return bbqAppLogin(db, appInfo.app);
      }

      return getDefaultApp(db).then((appName) => bbqAppLogin(db, appName));
    }).catch((e) => {
      // if the login failed try to directly login into the app
      if (appInfo.app && !appInfo.isCustomHost) {
        return login({ ...args, app: `https://${appInfo.app}.app.baqend.com/v1` });
      }
      throw e;
    });
}

function bbqAppLogin(db: EntityManager, appName: string) {
  return db.modules.get('apps', { app: appName }).then((result) => {
    if (!result) {
      throw new Error(`App (${appName}) not found.`);
    }

    return appConnect({ host: result.name, isCustomHost: false, app: appName }, { token: result.token });
  });
}

export function logout(args: AccountArgs) {
  const appInfo = getAppInfo(args);
  return readProfileFile().then((json) => {
    // eslint-disable-next-line no-param-reassign
    delete json[appInfo.host];
    return writeProfileFile(json);
  });
}

export function persistLogin(args: AccountArgs) {
  const appInfo = getAppInfo(args);
  let credentials: Credentials | Promise<Credentials> | null = getArgsCredentials(args);

  if (!credentials) {
    credentials = getInputCredentials(appInfo, false);
  }

  return Promise.resolve(credentials)
    .then((creds: Credentials) => appConnect(appInfo, creds).then(() => saveCredentials(appInfo, creds)))
    .then(() => console.log('You have successfully been logged in.'));
}

export function openApp(app: string) {
  if (app) {
    return open(`https://${app}.app.baqend.com`);
  }
  return login({}).then((db) => {
    open(`https://${db.connection!.host}`);
  });
}

export function openDashboard(args: AccountArgs) {
  return connect(args).then((db) => {
    open(`https://dashboard.baqend.com/login?token=${db.token}`);
  }).catch(() => {
    open('https://dashboard.baqend.com');
  });
}

export function listApps(args: AccountArgs) {
  return connect(args)
    .then((db) => getApps(db))
    .then((apps) => apps.forEach((app) => console.log(app)));
}

export function whoami(args: AccountArgs) {
  return connect({ skipInput: true, ...args })
    .then((db) => console.log(db.User.me!.username), () => console.log('You are not logged in.'));
}

function getApps(db: EntityManager): Promise<string[]> {
  return db.modules.get('apps').then((apps: ({ name: string })[]) => apps.map((app) => app.name));
}

function getDefaultApp(db: EntityManager) {
  return getApps(db).then((apps) => {
    if (apps.length === 1) {
      return apps[0];
    }
    throw new Error('Please add the name of your app as a parameter.');
  });
}

function readInputCredentials(appInfo: AppInfo): Promise<UsernamePasswordCredentials> {
  return helper.readInput(appInfo.isCustomHost ? 'Username: ' : 'E-Mail: ')
    .then((username: string) => helper.readInput('Password: ', true).then((password) => {
      console.log();
      return { username, password };
    }));
}

function encrypt(input: string) {
  const cipher = crypto.createCipheriv(algorithm, cipherKey, cipherIv);
  let encrypted = cipher.update(input, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function decrypt(input: string) {
  // TODO we need to handle that more properly
  // eslint-disable-next-line node/no-deprecated-api
  const decipher = crypto.createDecipher(algorithm, PROFILE_DEFAULT_KEY);
  let decrypted = decipher.update(input, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function writeProfileFile(json: ProfileJson) {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(fileName, JSON.stringify(json), (err) => {
      if (err) {
        console.warn('Baqend Profile file can\'t be written', err);
        reject(err);
      }
      resolve();
    });
  });
}

function readProfileFile(): Promise<ProfileJson> {
  return new Promise((resolve) => {
    if (!fs.existsSync(fileName)) {
      resolve({});
      return;
    }

    fs.readFile(fileName, (err, data) => {
      if (err) {
        console.warn('Baqend Profile file can\'t be read', err);
      }
      resolve(data ? JSON.parse(data.toString()) : {});
    });
  });
}

function saveCredentials(appInfo: AppInfo, credentials: Credentials) {
  return readProfileFile().then((json) => {
    let cred = credentials;
    if ('password' in cred) {
      cred = { ...cred, password: encrypt(cred.password) };
    }
    // eslint-disable-next-line no-param-reassign
    json[appInfo.host] = { ...json[appInfo.host], ...cred };
    return writeProfileFile(json);
  });
}
