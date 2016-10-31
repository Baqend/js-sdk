"use strict";
const os = require('os');
const fs = require('fs');
const baqend = require('../lib/baqend');
const fileName = os.homedir() + '/.baqend';
const readline = require('readline');
const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const password = 'N2Ki=za[8iy4ff4jYn/3,y;';

const bbqHost = 'bbq';
let host;
let app;

module.exports.login = function(args, persist) {
  if (args.host && args.app) {
    throw new Error('Only app or host parameter is allowed.');
  }
  host = args.host || bbqHost;
  app = args.app;

  let inputPromise;
  if (args.username && args.password) {
    inputPromise = Promise.resolve([args.username, args.password]);
  } else if (persist) {
    inputPromise = readInputCredentials();
  } else {
    inputPromise = readFile().then((json) => {
      if (json[host] && json[host].password && json[host].username) {
        return [json[host].username, json[host].password];
      } else {
        console.log('Baqend Login is required. You can skip this step by saving the Login credentials with "baqend login"');
        return readInputCredentials();
      }
    });
  }

  return inputPromise.then((credentials) => {
    return login(credentials[0], credentials[1]).then((db) => [credentials, db]);
  }).then((args) => {
    let credentials = args[0];
    let db = args[1];
    if (persist) {
      return saveCredentials(credentials[0], credentials[1]);
    }

    return db;
  });
};

module.exports.logout = function(args) {
  host = args.host || bbqHost;

  return readFile().then((json) => {
    delete json[host];
    return writeFile(json);
  });
};

function readInputCredentials() {
  console.log('If you have created your Baqend Account with OAuth:');
  console.log(' 1. Login to the dashboard with OAuth.');
  console.log(' 2. Go to your account settings (top right corner)');
  console.log(' 3. Add a password to your account, which you can then use to login with the CLI.');
  console.log('');

  return readInput('Username: ')
      .then((username) => {
        return readInput('Password: ', true).then((password) => {
          return [username, password];
        });
      });
}

function encrypt(input) {
  var cipher = crypto.createCipher(algorithm, password);
  var encrypted = cipher.update(input, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function decrypt(input) {
  var decipher = crypto.createDecipher(algorithm, password);
  var decrypted = decipher.update(input, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function readInput(question, hidden) {
  var Writable = require('stream').Writable;

  var mutableStdout = new Writable({
    write: function(chunk, encoding, callback) {
      if (!this.muted) {
        process.stdout.write(chunk, encoding);
      }
      callback();
    }
  });

  let rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true
  });

  return new Promise((resolve, reject) => {
    mutableStdout.muted = false;
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
    mutableStdout.muted = hidden;
  });
}

function writeFile(json) {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, JSON.stringify(json), function(err) {
      if (err) {
        reject(err)
      }
      resolve();
    });
  });
}

function readFile() {
  return new Promise((resolve, reject) => {
    fs.readFile(fileName, function(err, data) {
      let json = data ? JSON.parse(data.toString()) : {};
      if (json[host] && json[host].password) {
        json[host].password = decrypt(json[host].password);
      }

      resolve(json);
    });
  })
}

function saveCredentials(username, password) {
  return readFile().then((json) => {
    json[host] = json[host] || {};
    json[host].username = username;
    json[host].password = encrypt(password);
    return writeFile(json);
  })
}

function login(username, password) {
  return baqend.connect(host, true).then((db) => {
    return db.login(username, password).then(() => db);
  }).then((db) => {
    return isBbq() && app? bbqAppLogin(db): db;
  }).catch(() => {
    throw new Error('Login denied');
  });
}

function bbqAppLogin(db) {
  return db.modules.get('apps', { app }).then((result) => {
    let factory = new baqend.EntityManagerFactory({host: app, secure: true, tokenStorageFactory: {
      create(origin) {
        return new baqend.util.TokenStorage(origin, result.token);
      }
    }});
    return factory.createEntityManager(true).ready();
  })
}

function isBbq() {
  return host == bbqHost;
}