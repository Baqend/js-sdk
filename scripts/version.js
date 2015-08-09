require('shelljs/global');

exec('npm run dist');

exec('git add package.json');
exec('git add -f dist doc');