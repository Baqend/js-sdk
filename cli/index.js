#!/usr/bin/env node
"use strict";

var argv = require('minimist')(process.argv.slice(2));

let result = false;
switch (argv._[0]) {
  case 'typings':
    result = require('./typings')(argv);
    break;
  case 'deploy':
    result = require('./deploy')(argv);
    break;
}

if (!result) {
  console.log('baqend help            - to get a list of all commands');
  console.log('');
  console.log('baqend typings         - generates additional typings for your app');
  console.log('       --app appName   - The app name');
  console.log('       --dest          - The destination where the typings should be saved [default:typings/baqend-model.d.ts]');
}