import open from 'open';
import { ChildProcess } from 'child_process';
import crypto from 'crypto';
import { createServer } from 'http';
import os from 'os';
import {
  EntityManager, EntityManagerFactory, intersection, binding,
} from 'baqend';
import * as helper from './helper';
import {
  isFile, readFile, readInput,
} from './helper';

const { TokenStorage } = intersection;
const { UserFactory } = binding;

const fileName = `${os.homedir()}/.baqend`;
const algorithm = 'aes-256-ctr';
const PROFILE_DEFAULT_KEY = 'N2Ki=za[8iy4ff4jYn/3,y;';
const bbqHost = 'bbq';

export type AccountArgs = {
  app?: string,
  username?: string,
  password?: string,
  token?: string,
  skipInput?: boolean,
  auth?: string
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
      console.log('Storing username/password in the baqend profile will not be supported in future version.');
      console.log('Logout and login again to fix this issue.');
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

function getInputCredentials(appInfo: AppInfo, authProvider?: string, showLoginInfo?: boolean): Promise<Credentials> {
  if (!process.stdout.isTTY) {
    return Promise.reject(new Error('Can\'t interactive login into baqend, no tty session was detected.'));
  }

  if (showLoginInfo) {
    console.log('Baqend Login is required. You can skip this step by saving the Login credentials with "baqend login or baqend sso"');
  }

  const options = ['password', 'google', 'facebook', 'github'];

  let result = Promise.resolve(String(options.indexOf(authProvider || 'password') + 1));
  if (!appInfo.isCustomHost && options.length > 1 && !authProvider) {
    console.log('Choose how you want to login:');
    options.forEach((provider, index) => {
      console.log(`${index + 1}. Login with ${provider}`);
    });
    result = readInput(`Type 1-${options.length}: `);
  }

  return result.then((option): Promise<Credentials> => {
    if (option === '1') {
      return readInputCredentials(appInfo);
    }

    const provider = options[Number(option) - 1];
    if (!provider) {
      throw new Error('No valid login option was chosen.');
    }

    return requestSSOCredentials(appInfo, provider);
  });
}

function requestSSOCredentials(appInfo: AppInfo, oAuthProvider: string, oAuthOptions: binding.OAuthOptions = {}):
Promise<TokenCredentials> {
  // TODO: current workaround until our server pass this ids to the client dynamically
  const clientIds: { [oAuthProvider: string]: string } = {
    facebook: '976707865723719',
    google: '586076830320-0el1jebupjvbcmqf95vfaqjq7gbs0bdh.apps.googleusercontent.com',
    gitHub: '1311e3415ab415fda705',
  };

  return appConnect(appInfo)
    .then((db) => {
      const host = '127.0.0.1';
      const port = 9876;
      const provider = oAuthProvider.toLowerCase();

      return Promise.all([
        oAuthHandler(host, port),
        db.loginWithOAuth(oAuthProvider, {
          ...(UserFactory.DefaultOptions as any)[provider] || {},
          ...(clientIds[provider] && { clientId: clientIds[provider] }),
          ...{ open },
          ...oAuthOptions,
          redirect: `http://${host}:${port}`,
        }) as Promise<ChildProcess>,
      ]).then(([credentials, windowProcess]) => {
        windowProcess.kill('SIGHUP'); // seems not working on every platform
        return credentials;
      });
    });
}

function oAuthHandler(host: string, port: number): Promise<TokenCredentials> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url!, `http://${host}:${port}`);
      let done = false;
      if (url.searchParams.has('errorMessage')) {
        reject(new Error(url.searchParams.get('errorMessage')!));
        done = true;
      } else if (url.searchParams.has('token')) {
        resolve({ token: url.searchParams.get('token')! });
        done = true;
      }

      if (done) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<!DOCTYPE html><html><head></head><body><h1>Continue within the CLI!</h1></a></body></html>');
        server.close();
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    server.on('error', (err) => {
      reject(err);
    });
    server.listen(port, host);
  });
}

function getCredentials(appInfo: AppInfo, args: AccountArgs): Promise<Credentials | null> {
  let providers = Promise.resolve(null)
    .then((credentials) => credentials || getArgsCredentials(args))
    .then((credentials) => credentials || getEnvCredentials())
    .then((credentials) => credentials || getProfileCredentials(appInfo))
    .then((credentials) => credentials || getLocalCredentials(appInfo));

  if (!args.skipInput && process.stdout.isTTY) {
    providers = providers
      .then((credentials) => credentials || getInputCredentials(appInfo, args.auth, true));
  }

  return providers;
}

export function register(args: AccountArgs) {
  const appInfo = getAppInfo(args);

  return getInputCredentials(appInfo, args.auth)
    .then((credentials) => appConnect(appInfo)
      .then((db) => {
        if ('token' in credentials) {
          return db.User.loginWithToken(credentials.token).then(() => db);
        }
        return db.User.register(credentials.username, credentials.password).then(() => db);
      })
      .then((db) => Promise.all([
        getDefaultApp(db).then((name) => console.log(`Your app name is ${name}`)),
        saveCredentials(appInfo, { token: db.token! }),
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
  return db.modules.get('apps', { app: appName }).then((result: { name: string, token: string }) => {
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
    credentials = getInputCredentials(appInfo, args.auth, false);
  }

  return Promise.resolve(credentials)
    .then((creds: Credentials) => appConnect(appInfo, creds)
      .then((db) => saveCredentials(appInfo, 'token' in creds ? creds : { token: db.token! })))
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

function decrypt(input: string) {
  // This is legacy and we will remove support for the username / password storage in the profile file
  // eslint-disable-next-line node/no-deprecated-api
  const decipher = crypto.createDecipher(algorithm, PROFILE_DEFAULT_KEY);
  let decrypted = decipher.update(input, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function writeProfileFile(json: ProfileJson) {
  return helper.writeFile(fileName, JSON.stringify(json)).catch((e) => {
    console.warn('Baqend Profile file can\'t be written', e);
    throw e;
  });
}

function readProfileFile(): Promise<ProfileJson> {
  return isFile(fileName).then((exists) => {
    if (!exists) {
      return {};
    }

    return readFile(fileName, 'utf-8').then((data) => (data ? JSON.parse(data) : {}));
  });
}

function saveCredentials(appInfo: AppInfo, credentials: TokenCredentials) {
  return readProfileFile().then((json) => {
    // eslint-disable-next-line no-param-reassign
    json[appInfo.host] = { ...json[appInfo.host], ...credentials };
    return writeProfileFile(json);
  });
}
