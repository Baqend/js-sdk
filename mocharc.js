module.exports = {
  reporter: 'mocha-junit-reporter',
  quiet: true,
  package: './package.json',
  reporterOptions: {
    mochaFile: `./build/test-results/node-${process.version}.xml`,
    jenkinsMode: true,
  },
  timeout: 4000,
  spec: ['spec/**/*.js'],
};
