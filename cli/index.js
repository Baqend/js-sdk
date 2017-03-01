#!/usr/bin/env node
"use strict";

const account = require('./account');
const deploy = require('./deploy');
const typings = require('./typings');
const starter = require('./starter');

if (!module.parent) {
  const program = require('commander');
  const pjson = require('../package.json');
  let result;

  //provide the cli command name
  program._name = 'baqend';

  program
      .version(pjson.version)
  ;

  program
      .command('login')
      .description('Logs you in and locally saves your credentials')
      .option('-H, --host <name>', 'Host for custom deployment')
      .action(options => result = account.login(options, true))
  ;

  program
      .command('deploy <app>')
      .description('Deploys your baqend code and files')
      .option('-F, --files', 'deploy files')
      .option('-C, --code', 'deploy code')
      .option('-f, --file-dir <dir>', 'path to file directory [default:www]', 'www')
      .option('-g, --file-glob <pattern>', 'pattern to match files [default:**/*]', '**/*')
      .option('-g, --bucket-path <path>', 'remote path where the files will be uploaded to.', 'www')
      .option('-c, --code-dir <dir>', 'path to code directory [default:baqend]', 'baqend')
      .action((app, options) => result = deploy(Object.assign({app: app}, options)))
  ;

  program
      .command('logout')
      .description('Removes your stored credentials')
      .option('-H, --host <name>', 'Host for custom deployment')
      .action(options => result = account.logout(options))
  ;

  program
      .command('typings <app>')
      .description('Generates additional typings (TypeScript support)')
      .option('-d, --dest <dir>', 'The destination where the typings should be saved', '.')
      .action((app, options) => result = typings(Object.assign({app: app}, options)))
  ;

  program
      .usage('[command] [options] <args...>')
      .description('Type in one of the above commands followed by --help to get more information')
  ;

  program
      .command('start [name] [dir]')
      .description('clones the starter kit and install it in the given directory')
      .action((name, dir) => result = starter(name, dir))
  ;

  program.parse(process.argv);

  if (!result) {
    program.outputHelp();
  } else if (result) {
    if (result.catch) {
      result.catch((e) => console.error(e));
    }
  }
}


module.exports.deploy = deploy;
module.exports.typings = typings;
module.exports.account = account;