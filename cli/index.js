#!/usr/bin/env node
"use strict";


const account = require('./account');
const deploy = require('./deploy');
const typings = require('./typings');

if (!module.parent) {
  const program = require('commander');
  const pjson = require('../package.json');
  let result = null;

  program
      .version(pjson.version);

  program
      .command('login')
      .description('logs you in and locally saves your credentials')
      .option('-H, --host <name>', 'Host for custom deployment')
      .action(options => result = account.login(options, true));

  program
      .command('deploy')
      .description('deploys your baqend code and files.')
      .option('-a, --app <name>', 'name of your app')
      .option('-F, --files', 'deploy files')
      .option('-C, --code', 'deploy code')
      .option('-f, --file-dir <dir>', 'path to file directory', 'www')
      .option('-g, --file-glob <pattern>', 'pattern to match files', '**/*')
      .option('-c, --code-dir <dir>', 'path to code directory', 'baqend')
      .action(options => result = deploy(options));

  program
      .command('logout')
      .description('removes your stored credentials')
      .option('-H, --host <name>', 'Host for custom deployment')
      .action(options => result = account.logout(options));

  program
      .command('typings')
      .description('generates additional typings for your app')
      .option('-a, --app <name>', 'The app name')
      .option('-d, --dest <dir>', 'The destination where the typings should be saved [default:typings/baqend-model.d.ts]')
      .action(options => result = typings(options));

  program.parse(process.argv);

  if (!result) {
    program.help();
  } else if(result.catch) {
    result.catch((e) => console.log(e));
  }
}


module.exports.deploy = deploy;
module.exports.typings = typings;
module.exports.account = account;