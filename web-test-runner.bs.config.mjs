import { browserstackLauncher } from '@web/test-runner-browserstack';
import { defaultReporter } from '@web/test-runner';
import { junitReporter } from '@web/test-runner-junit-reporter';

import localConfig from './web-test-runner.config.mjs';

// options shared between all browsers
const sharedCapabilities = {
  // your username and key for browserstack, you can get this from your browserstack account
  // it's recommended to store these as environment variables
  'browserstack.user': process.env.BROWSERSTACK_USERNAME,
  'browserstack.key': process.env.BROWSERSTACK_ACCESS_KEY,

  project: 'JS SDK',
  name: 'JS SDK - API Tests',
  // if you are running tests in a CI, the build id might be available as an
  // environment variable. this is useful for identifying test runs
  // this is for example the name for github actions
  build: `build ${process.env.CI_JOB_ID || 'unknown'}`,
};

export default {
  ...localConfig,
  name: 'browserstack',
  watch: false,
  reporters: [
    // use the default reporter only for reporting test progress
    defaultReporter({ reportTestResults: false, reportTestProgress: true }),
    // use another reporter to report test results
    junitReporter({
      outputPath: './browserstack-result.xml',
      reportLogs: true, // default `false`
    }),
  ],
  concurrentBrowsers: 1,
  // amount of test files to execute concurrently in a browser. the default value is based
  // on amount of available CPUs locally which is irrelevant when testing remotely
  concurrency: 1,
  localOptions: {
    forceLocal: true,
  },
  browsers: [
    // create a browser launcher per browser you want to test
    // you can get the browser capabilities from the browserstack website
    browserstackLauncher({
      capabilities: {
        ...sharedCapabilities,
        browserName: 'Chrome',
        os: 'Windows',
      },
    }),

    browserstackLauncher({
      capabilities: {
        ...sharedCapabilities,
        browserName: 'Safari',
        os: 'OS X',
      },
    }),

    browserstackLauncher({
      capabilities: {
        ...sharedCapabilities,
        browserName: 'Firefox',
        os: 'Windows',
      },
    }),
  ],
};