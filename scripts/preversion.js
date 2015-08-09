require('shelljs/global');

var requiredBranch = 'master';
var requiredNPMUser = 'info@baqend.com';

console.log('Check npm user.');
var user = exec('npm config get email', {silent: true}).output.trim();
if (user != requiredNPMUser) {
  console.error('Not logged in as npm user ' + requiredNPMUser);
  exit(1);
}

console.log('Check correct branch.');
var branch = exec('git rev-parse --abbrev-ref HEAD', {silent: true}).output.trim();
if (branch != requiredBranch) {
  console.error('Not on required branch ' + requiredBranch);
  exit(1);
}

console.log('Fetch remotes:');
var fetchCode = exec('git remote update').code;
if (fetchCode != 0) {
  console.error('Fetch failed.');
  exit(1);
}

console.log('Check project is clean.');
var statusLines = exec('git status -sb', {silent: true}).output.trim().split('\n');
var ahead = /.*ahead (\d+).*/.exec(statusLines[0]);
var behind = /.*behind (\d+).*/.exec(statusLines[0]);
if (ahead) {
  console.error('You have ' + ahead[1] + ' local change(s) to push.');
}
if (behind) {
  console.error('You have ' + behind[1] + ' remote change(s) to pull..');
}

statusLines.shift();
if (statusLines.length > 0) {
  console.error('You have uncommitted changes:');
  console.log(statusLines.join('\n'));
}

if (behind || ahead || statusLines.length > 0)
  exit(1);

