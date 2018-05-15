const webdriverConfig = {
  hostname: 'jenkins.baqend.com',
  port: 4444
};

module.exports = {
  'Chrome-Linux': {
    base: 'WebDriver',
    config: webdriverConfig,
    browserName: 'chrome',
    platform: 'LINUX',
    version: '',
    name: 'Karma'
  },
  'Firefox-Linux': {
    base: 'WebDriver',
    config: webdriverConfig,
    browserName: 'firefox',
    platform: 'LINUX',
    version: '59.0.2',
    name: 'Karma'
  },
  'Safari-Mac': {
    base: 'WebDriver',
    config: webdriverConfig,
    browserName: 'safari',
    platform: 'MAC',
    version: '11',
    name: 'Karma'
  },
  'SafariTechnologyPreview-Mac': {
    base: 'WebDriver',
    config: webdriverConfig,
    technologyPreview: true,
    browserName: 'safari',
    platform: 'MAC',
    version: 'TP',
    name: 'Karma'
  },
  'Safari-iOS': {
    base: 'WebDriver',
    config: webdriverConfig,
    browserName: 'safari',
    platformName: 'iOS',
    version: 'mobile',
    platformVersion: '11.2',
    deviceName: 'iPhone 8',
    automationName: 'XCUITest',
    fullReset: true,
    launchTimeout: 120000,
  },
  'Safari-iOS-Beta': {
    base: 'WebDriver',
    config: webdriverConfig,
    browserName: 'safari',
    platformName: 'iOS',
    version: 'mobileBeta',
    platformVersion: '11.3',
    deviceName: 'iPhone 8',
    automationName: 'XCUITest',
    fullReset: true,
    launchTimeout: 120000,
  },
  'Safari-iOS-Beta-Device': {
    base: 'WebDriver',
    config: webdriverConfig,
    browserName: 'safari',
    platformName: 'iOS',
    plattformVersion: '11.3',
    version: 'mobileBetaDevice',
    showXcodeLog: true,
    deviceName: 'iPad Air 2',
    startIWDP: true,
    udid: "auto",
    automationName: 'XCUITest',
    fullReset: true,
  },
  'Chrome-Win': {
    base: 'WebDriver',
    config: webdriverConfig,
    browserName: 'chrome',
    platform: 'WINDOWS',
    version: '',
    name: 'Karma'
  },
  'Firefox-Win': {
    base: 'WebDriver',
    config: webdriverConfig,
    browserName: 'firefox',
    platform: 'WINDOWS',
    version: '',
    name: 'Karma'
  },
  'Edge-Win': {
    base: 'WebDriver',
    config: webdriverConfig,
    browserName: 'MicrosoftEdge',
    platform: 'WINDOWS',
    name: 'Karma'
  },
  'Edge-Win-Preview': {
    base: 'WebDriver',
    config: webdriverConfig,
    browserName: 'MicrosoftEdge',
    version: 'DevPreview',
    platform: 'WINDOWS',
    name: 'Karma'
  },
  'Chrome-Mobile-Linux': {
    base: 'WebDriver',
    config: webdriverConfig,
    chromeOptions: {
      mobileEmulation: {
        deviceName: "iPhone 6"
      }
    },
    browserName: 'chrome',
    platform: 'LINUX',
    version: '',
    name: 'Karma'
  }
};
