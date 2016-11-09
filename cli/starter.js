"use strict";

const https = require('https');
const simpleGit = require('simple-git');
const exec = require('child_process').exec;
const path = require('path');
const rimraf = require('rimraf');


module.exports = function(name, dir) {
  if (!name) {
    return list();
  } else {
    return clone(name, dir);
  }
};

module.exports.clone = clone;
module.exports.list = list;

function clone(name, dir) {
  let folder = path.join(dir || name);

  return callGithub(`/repos/baqend/${name}`).then((json) => {
    if (json.name !== name) {
      console.log(`${name} not found.`);
    } else {
      return installStarter(name, folder);
    }
  });
}

function list() {
  return callGithub('/orgs/baqend/repos?type=public').then((json) => {
    console.log('Available starters');
    json.forEach(repo => {
      if (repo.name.endsWith('starter')) {
        console.log(`- ${repo.name} (baqend start ${repo.name})`);
      }
    })
  });
}

function installStarter(name, folder) {
  console.log(`cloning starter into ${folder}`);

  return simpleGit()
      .clone(`https://github.com/baqend/${name}`, folder)
      .then(() => {
        rimraf(path.join(folder, '.git'), () => {});

        process.stdout.write('npm is installing...');
        let interval = setInterval(() => process.stdout.write('.'), 4000);

        return new Promise((success, error) => {
          let child = exec('npm install', { cwd: folder });
          child.stderr.pipe(process.stderr);
          child.stdout.pipe(process.stdout);
          child.on('error', error);
          child.on('exit', success);
        }).then(() => {
          clearInterval(interval);
          console.log(`${name} has successfully been installed`);
        });
      });
}

function callGithub(url) {
  return new Promise((success, error) => {
    https.request({
      host: 'api.github.com',
      port: '443',
      path: url,
      method: 'GET',
      headers: {
        accept: 'application/vnd.github.v3+json',
        'user-agent': 'baqend'
      }
    }, resp => {
      let data = '';

      resp.on('data', chunk => {
        data += chunk;
      });

      resp.on('end', () => success(JSON.parse(data)));
    }).on('error', (e) => {
      console.log('problem with github request: ' + e.message);
      error(e);
    }).end();
  });
}