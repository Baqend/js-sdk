import { playwrightLauncher } from '@web/test-runner-playwright';
import { defaultReporter } from '@web/test-runner';
import { junitReporter } from '@web/test-runner-junit-reporter';

import localConfig from './web-test-runner.config.mjs';

export default {
  ...localConfig,
  name: 'playwright',
  watch: false,
  reporters: [
    // use the default reporter only for reporting test progress
    defaultReporter({ reportTestResults: true, reportTestProgress: true }),
    // use another reporter to report test results
    junitReporter({
      outputPath: './playwright-result.xml',
      reportLogs: true, // default `false`
    }),
  ],
  concurrentBrowsers: 1,
  // amount of test files to execute concurrently in a browser. the default value is based
  // on amount of available CPUs locally which is irrelevant when testing remotely
  concurrency: 1,
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
    playwrightLauncher({ product: 'firefox' }),
    playwrightLauncher({ product: 'webkit' }),
  ].filter(b => !process.env.BROWSER || b.name.startsWith(process.env.BROWSER)),
};