#! /usr/bin/env node

import program from 'commander';
import * as account from './account';
import { typings } from './typings';
import { schema } from './schema';
import { download } from './download';
import { deploy } from './deploy';
import { copy } from './copy';

export { deploy, typings, account };

const pjson = require('../package.json');

export function run() {
  program
    .name('baqend')
    .version(pjson.version)
    .option('--token <token>', 'Pass a Baqend Authorization Token to the command');
  program
    .command('login [app]')
    .option('--auth <auth>', 'The authentication method to use for the login. Can be password, google, facebook or gitHub.')
    .description('Logs you in and locally saves your credentials')
    .action((app, options) => account.persistLogin({ app, ...options, ...program.opts() }));
  program
    .command('register')
    .description('Registers an account and locally saves your credentials')
    .action((options) => account.register({ ...options, ...program.opts() }).then(() => { }));
  program
    .command('whoami [app]')
    .alias('me')
    .description('Show your login status')
    .action((app) => account.whoami({ app, ...program.opts() }));
  program
    .command('open [app]')
    .description('Opens the url to your app')
    .action((app) => account.openApp(app).then(() => { }));
  program
    .command('dashboard')
    .description('Opens the url to the baqend dashboard')
    .action((options) => account.openDashboard({ ...options, ...program.opts() }));
  program
    .command('deploy [app]')
    .description('Deploys your Baqend code and files')
    .option('-F, --files', 'deploy files')
    .option('-f, --file-dir <dir>', 'path to file directory', 'www')
    .option('-g, --file-glob <pattern>', 'pattern to match files', '**/*')
    .option('-b, --bucket-path <path>', 'remote path where the files will be uploaded to.', 'www')
    .option('-B, --cretae-bucket', 'create the bucket, if it does not exists.')
    .option('-C, --code', 'deploy baqend code')
    .option('-c, --code-dir <dir>', 'path to code directory', 'baqend')
    .option('-S, --schema', 'deploy schema')
    .action((app, options) => deploy({ app, ...options, ...program.opts() }).then(() => { }));
  program
    .command('copy <source> <dest>')
    .alias('cp')
    .description('Copies single files to and from Baqend')
    .usage(`[OPTIONS] SRC_PATH     DEST_PATH
         copy|cp [OPTIONS] APP:SRC_PATH DEST_PATH
         copy|cp [OPTIONS] SRC_PATH     APP:DEST_PATH
         copy|cp [OPTIONS] APP:SRC_PATH APP:DEST_PATH`)
    .action((source, dest, options) => copy({
      source, dest, ...options, ...program.opts(),
    }))
    .on('--help', () => {
      console.log(`
  You can specify local paths without colon and app paths with a colon.
  For APP, you can use either your Baqend app's name or an API endpoint: "https://example.org/v1".
  If the app path is relative, it is assumed you are using the "www" bucket:
  
    baqend cp my-app:index.html . 
     
  Is the same as:
  
    baqend cp my-app:/www/index.html .
    
  If you target a directory, the filename of the source file will be used.
  You can also copy files between different apps, or between community editions and apps.`);
    });
  program
    .command('download [app]')
    .description('Downloads your Baqend code and files')
    .option('-C, --code', 'download code')
    .option('-c, --code-dir <dir>', 'path to code directory', 'baqend')
    .action((app, options) => download({ app, ...options, ...program.opts() }).then(() => { }));
  program
    .command('schema <command> [app]')
    .description('Upload and download your schema')
    .option('-F, --force', 'overwrite old schema')
    .action((command, app, options) => schema({
      command, app, ...options, ...program.opts(),
    }));

  // program
  //     .command('schema download [app]')
  //     .action((app, options) => result = schema.download(Object.assign({app: app}, options)))

  program
    .command('logout [app]')
    .description('Removes your stored credentials')
    .action((app) => account.logout({ app, ...program.opts() }));
  program
    .command('typings <app>')
    .description('Generates additional typings (TypeScript support)')
    .option('-d, --dest <dir>', 'The destination where the typings should be saved', '.')
    .action((app, options) => typings({ app, ...options, ...program.opts() }));
  program
    .usage('[command] [options] <args...>')
    .description(
      'Type in one of the above commands followed by --help to get more information\n'
        + '  The optional [app] parameter can be passed to define the target of a command.\n'
        + '  It can be either an app name or a custom domain location like\n'
        + '  https://my-baqend-domain:8080/v1.',
    );
  program
    .command('apps')
    .description('List all your apps')
    .action((options) => account.listApps({ ...options, ...program.opts() }));

  return program.parseAsync(process.argv);
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e.stack || e);
    process.exit(1);
  });
}
