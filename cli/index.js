#!/usr/bin/env node
"use strict";

const account = require('./account');
const deploy = require('./deploy');
const schema = require('./schema');
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
      .action(options => result = account.persistLogin(options))
  ;

  program
      .command('register')
      .description('Registers an account and locally saves your credentials')
      .action(options => result = account.register())
  ;

  program
      .command('whoami')
      .alias('me')
      .option('-H, --host <name>', 'Host for custom deployment')
      .description('Show your login status')
      .action(options => result = account.whoami(options))
  ;

  program
      .command('open [app}')
      .description('Opens the url to your app')
      .action(app => result = account.openApp(app))
  ;

  program
      .command('dashboard')
      .description('Opens the url to the baqend dashboard')
      .action(() => result = account.openDashboard())
  ;

  program
      .command('deploy [app]')
      .description('Deploys your baqend code and files')
      .option('-F, --files', 'deploy files')
      .option('-C, --code', 'deploy code')
      .option('-f, --file-dir <dir>', 'path to file directory [default:www]', 'www')
      .option('-g, --file-glob <pattern>', 'pattern to match files [default:**/*]', '**/*')
      .option('-b, --bucket-path <path>', 'remote path where the files will be uploaded to.', 'www')
      .option('-c, --code-dir <dir>', 'path to code directory [default:baqend]', 'baqend')
      .action((app, options) => result = deploy(Object.assign({app: app}, options)))
  ;

  program
      .command('schema [command] [app]')
      .option('-F, --force', 'overwrite old schema')
      .action((command, app, options) => result = schema(Object.assign({command: command, app: app}, options)))

  // program
  //     .command('schema download [app]')
  //     .action((app, options) => result = schema.download(Object.assign({app: app}, options)))

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

  program
      .command('apps')
      .description('list all your apps')
      .action(() => result = account.listApps())
  ;

  program.parse(process.argv);

  if (!result) {
    program.outputHelp();
  } else if (result) {
    if (result.catch) {
      result.catch((e) => console.error(e.message ||e));
    }
  }
}


module.exports.deploy = deploy;
module.exports.typings = typings;
module.exports.account = account;
