const config = {
  reporter: 'mocha-junit-reporter',
  quiet: false,
  package: './package.json',
  reporterOption: [
    `mochaFile=./build/test-results/node-result.xml`,
    'jenkinsMode=false',
    `rootSuiteTitle="Node ${process.version} Test Suite"`,
  ],
  timeout: 4000,
  spec: ['spec/**/*.js'],
}

module.exports = config;
