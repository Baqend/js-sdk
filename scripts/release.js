require('shelljs/global');
const fs = require('fs');

const versionArg = process.env.VERSION || process.argv[2];
if (!versionArg) {
  console.error('Missing version arg!');
  console.log('Usage npm run release <version> | major | minor | patch [--dry-run]');
  exit(1);
}

const changelogArg = process.env.CHANGELOG || process.argv[3];
if (!changelogArg) {
  console.error('Missing changelog arg!');
  exit(1);
}

const date = new Date();
const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

const pushNPM = !pkg.private;
const requiredBranch = 'master';
const requiredNPMUser = 'info@baqend.com';
const gitAdd = '';

console.log('Check npm user.');
const user = exec('npm config get email', { silent: true }).stdout.trim();
if (user !== requiredNPMUser) {
  console.error(`Not logged in as npm user ${requiredNPMUser}`);
  exit(1);
}

console.log('Check correct branch.');
const branch = exec('git rev-parse --abbrev-ref HEAD', { silent: true }).stdout.trim();
if (branch !== requiredBranch) {
  console.error(`Not on required branch ${requiredBranch}`);
  exit(1);
}

console.log('Fetch remotes:');
const fetchCode = exec('git remote update').code;
if (fetchCode !== 0) {
  console.error('Fetch failed.');
  exit(1);
}

console.log('Check project is clean.');
const statusLines = exec('git status -sb', { silent: true }).stdout.trim().split('\n');
const ahead = /.*ahead (\d+).*/.exec(statusLines[0]);
const behind = /.*behind (\d+).*/.exec(statusLines[0]);
if (ahead) {
  console.error(`You have ${ahead[1]} local change(s) to push.`);
}
if (behind) {
  console.error(`You have ${behind[1]} remote change(s) to pull..`);
}

statusLines.shift();
if (statusLines.length > 0) {
  console.error('You have uncommitted changes:');
  console.log(statusLines.join('\n'));
}

if (behind || ahead || statusLines.length > 0) exit(1);

// prepare release
console.log('Build:');
const versionCmd = exec(`npm version --no-git-tag-version ${versionArg}`);
if (versionCmd.code !== 0) {
  exit(1);
}
const version = versionCmd.stdout.trim();

const changelog = fs.readFileSync('CHANGELOG.md'); // read existing contents into data
const fd = fs.openSync('CHANGELOG.md', 'w+');
fs.writeSync(fd, `<a name="${version}"></a>\n`, 'utf8'); // write new data
fs.writeSync(fd, `# ${version} (${dateStr})\n\n\n`, 'utf8'); // write new data
fs.writeSync(fd, `${changelogArg}\n\n`, 'utf8'); // write new data
fs.writeSync(fd, changelog, 0, changelog.length); // append old data
fs.closeSync(fd);

const buildResult = exec('npm run dist').code
  || exec('git add package.json CHANGELOG.md').code
  || (gitAdd && exec(`git add -f ${gitAdd}`, { silent: true }).code)
  || exec(`git commit -m "release ${version} [ci skip]"`).code
  || exec(`git tag ${version} -m "release ${version}"`).code;

if (buildResult) {
  console.error('Build failed.');
  exec(`git reset --hard origin/${requiredBranch}`);
  exit(1);
}

console.log('Release:');
// release
exec(`git push origin ${requiredBranch}`).code
|| exec(`git push origin ${version}`).code;

if (pushNPM) exec('npm publish');

console.log('Postrelease:');
const devVersion = exec('npm version --no-git-tag-version prerelease').stdout.trim();
(gitAdd && exec(`git rm --cached -r ${gitAdd}`, { silent: true }).code)
|| exec('git add package.json').code
|| exec(`git commit -m "new development version ${devVersion} [ci skip]"`).code
|| exec(`git push origin ${requiredBranch}`).code;
