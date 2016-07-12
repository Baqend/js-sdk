var argv = require('minimist')(process.argv.slice(2));

switch (argv._[0]) {
  case 'typings':
    require('./typings')(argv);
    break;
  default:
    console.log('baqend help - to get a list of all commands');
    console.log('baqend typings help');
}