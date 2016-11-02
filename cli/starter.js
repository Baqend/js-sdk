"use strict";

const https = require('https');
const simpleGit = require('simple-git');
const exec = require('child_process').exec;
const path = require('path');
const rimraf = require('rimraf');


module.exports = function(name, dir) {
  if (!name) {
    list();
  } else {
    clone(name, dir);
  }

  return true;
};

function clone(name, dir) {
  let folder = path.join(dir || name);

  callGithub(`/repos/baqend/${name}`, (json) => {
    if (json.name !== name) {
      console.log(`${name} not found.`);
    } else {
      installStarter(name, folder);
    }
  });
}

function list() {
  callGithub('/orgs/baqend/repos?type=public', (json) => {
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

  simpleGit()
      .clone(`https://github.com/baqend/${name}`, folder)
      .then(() => {
        rimraf(path.join(folder, '.git'), () => {});

        process.stdout.write('npm is installing...');
        let interval = setInterval(() => process.stdout.write('.'), 4000);

        let child = exec('npm install', { cwd: folder });
        child.stderr.pipe(process.stderr);
        child.stdout.pipe(process.stdout);

        child.on('exit', () => {
          clearInterval(interval);
          console.log(`${name} has successfully been installed`);
        });
      });
}

function callGithub(url, cb) {
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

    resp.on('end', () => cb(JSON.parse(data)));
  }).on('error', function(e) {
    console.log('problem with github request: ' + e.message);
  }).end();
}