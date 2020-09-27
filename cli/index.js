#!/usr/bin/env node
"use strict";

const account = require('./account');
const copy = require('./copy');
const deploy = require('./deploy');
const download = require('./download');
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
      .command('login [app]')
      .description('Logs you in and locally saves your credentials')
      .action(app => result = account.persistLogin({app: app}))
  ;

  program
      .command('register')
      .description('Registers an account and locally saves your credentials')
      .action(options => result = account.register(options))
  ;

  program
      .command('whoami [app]')
      .alias('me')
      .description('Show your login status')
      .action(app => result = account.whoami({app: app}))
  ;

  program
      .command('open [app}')
      .description('Opens the url to your app')
      .action(app => result = account.openApp(app))
  ;

  program
      .command('dashboard')
      .description('Opens the url to the baqend dashboard')
      .action(options => result = account.openDashboard(options))
  ;

  program
      .command('deploy [app]')
      .description('Deploys your Baqend code and files')
      .option('-F, --files',                'deploy files')
      .option('-f, --file-dir <dir>',       'path to file directory [default: www]', 'www')
      .option('-g, --file-glob <pattern>',  'pattern to match files [default: **/*]', '**/*')
      .option('-b, --bucket-path <path>',   'remote path where the files will be uploaded to.', 'www')
      .option('-C, --code',                 'deploy code')
      .option('-c, --code-dir <dir>',       'path to code directory [default: baqend]', 'baqend')
      .option('-S, --schema',               'deploy schema')
      .option('--upload-limit <count>',     'Set parallel file upload limit [default: 2]', '2')
      .option('--clean-up',                 'Remove all unused files in bucket path')
      .action((app, options) => result = deploy(Object.assign({ app: app }, options)))
  ;

  const copyCommand = program
    .command('copy <source> <dest>')
    .alias('cp')
    .description(`Copies single files to and from Baqend`)
    .usage(`[OPTIONS] SRC_PATH     DEST_PATH
         copy|cp [OPTIONS] APP:SRC_PATH DEST_PATH
         copy|cp [OPTIONS] SRC_PATH     APP:DEST_PATH
         copy|cp [OPTIONS] APP:SRC_PATH APP:DEST_PATH`)
    .action((source, dest, options) => result = copy(Object.assign({ source: source, dest: dest }, options)))
    .on('--help', () => {
        console.log(`
  You can specify local paths without colon and app paths with a colon.
  For APP, you can use either your Baqend app's name or an API endpoint: "https://example.org/v1".
  If the app path is relative, it is assumed you are using the "www" bucket:
  
    baqend cp my-app:index.html . 
     
  Is the same as:
  
    baqend cp my-app:/www/index.html .
    
  If you target a directory, the filename of the source file will be used.
  You can also copy files between different apps, or between community editions and apps.`)
    })
  ;

  program
      .command('download [app]')
      .description('Downloads your Baqend code and files')
      .option('-C, --code',                 'download code')
      .option('-c, --code-dir <dir>',       'path to code directory [default: baqend]', 'baqend')
      .action((app, options) => result = download(Object.assign({ app: app }, options)))
  ;

  program
      .command('schema <command> [app]')
      .description('Upload and download your schema')
      .option('-F, --force', 'overwrite old schema')
      .action((command, app, options) => result = schema(Object.assign({command: command, app: app}, options)));

  // program
  //     .command('schema download [app]')
  //     .action((app, options) => result = schema.download(Object.assign({app: app}, options)))

  program
      .command('logout [app]')
      .description('Removes your stored credentials')
      .action(app => result = account.logout({app: app}))
  ;

  program
      .command('typings <app>')
      .description('Generates additional typings (TypeScript support)')
      .option('-d, --dest <dir>', 'The destination where the typings should be saved', '.')
      .action((app, options) => result = typings(Object.assign({app: app}, options)))
  ;

  program
      .usage('[command] [options] <args...>')
      .description(
        'Type in one of the above commands followed by --help to get more information\n' +
        '  The optional [app] parameter can be passed to define the target of a command.\n' +
        '  It can be either an app name or a custom domain location like\n' +
        '  http://my-baqend-domain:8080/v1.'
      )
  ;

  program
      .command('start [name] [dir]')
      .description('Clones the starter kit and install it in the given directory')
      .action((name, dir) => result = starter(name, dir))
  ;

  program
      .command('apps')
      .description('List all your apps')
      .action(options => result = account.listApps(options))
  ;

  program.parse(process.argv);

  if (!result) {
    program.outputHelp();
  } else if (result) {
    if (result.catch) {
      result.catch((e) => {
        console.error(e.stack || e);
        process.exit(1);
      });
    }
  }
}


module.exports.deploy = deploy;
module.exports.typings = typings;
module.exports.account = account;
