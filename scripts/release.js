require('shelljs/global');
var fs = require('fs');

var versionArg = process.env.VERSION || process.argv[2];
if (!versionArg) {
  console.error('Missing version arg!');
  console.log('Usage npm run release <version> | major | minor | patch [--dry-run]');
  exit(1);
}

var changelogArg = process.env.CHANGELOG || process.argv[3];
if (!changelogArg) {
  console.error('Missing changelog arg!');
  exit(1);
}

var date = new Date();
var dateStr = date.getYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
var pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

var pushNPM = !pkg.private;
var requiredBranch = 'master';
var requiredNPMUser = 'info@baqend.com';
var gitAdd = 'dist doc';

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

//prepare release
console.log('Build:');
var versionCmd = exec('npm version --no-git-tag-version ' + versionArg);
if (versionCmd.code != 0) {
  exit(1);
}
var version = versionCmd.output.trim();

var changelog = fs.readFileSync('CHANGELOG.md'); //read existing contents into data
var fd = fs.openSync('CHANGELOG.md', 'w+');
fs.writeSync(fd, '<a name="' + version + '"></a>\n', 'utf8'); //write new data
fs.writeSync(fd, '# ' + version + ' (' + dateStr + ')\n\n\n', 'utf8'); //write new data
fs.writeSync(fd, changelogArg + '\n\n', 'utf8'); //write new data
fs.writeSync(fd, changelog, 0, changelog.length); //append old data
fs.close(fd);

var buildResult =
  exec('npm run dist').code ||
  exec('git add package.json CHANGELOG.md').code ||
  (gitAdd && exec('git add -f ' + gitAdd, {silent: true}).code) ||
  exec('git commit -m "release ' + version + ' [ci skip]"').code ||
  exec('git tag ' + version + ' -m "release ' + version + '"').code;

if (buildResult) {
  console.error('Build failed.');
  exec('git reset --hard origin/' + requiredBranch);
  exit(1);
}

console.log('Release:');
//release
exec('git push origin ' + requiredBranch).code ||
exec('git push origin ' + version).code;

if (pushNPM)
exec('npm publish');

console.log('Postrelease:');
var devVersion = exec('npm version --no-git-tag-version prerelease').output.trim();
(gitAdd && exec('git rm --cached -r ' + gitAdd, {silent: true}).code) ||
exec('git add package.json').code ||
exec('git commit -m "new development version ' + devVersion + ' [ci skip]"').code ||
exec('git push origin ' + requiredBranch).code;


