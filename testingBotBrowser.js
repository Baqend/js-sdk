module.exports = {
  'TB-Firefox-Win': {
    base: 'TestingBot',
    browserName: 'firefox',
    version: 'latest',
    platform: 'WIN10'
  },
  'TB-Firefox-Linux': {
    base: 'TestingBot',
    browserName: 'firefox',
    version: 'latest',
    platform: 'LINUX'
  },
  'TB-Firefox-Beta-Linux': {
    base: 'TestungBot',
    browserName: 'firefox',
    version: 'beta',
    platform: 'LINUX'
  },
  'TB-Firefox-Dev-Linux': {
    base: 'TestungBot',
    browserName: 'firefox',
    version: 'dev',
    platform: 'LINUX'
  },
  'TB-Chrome-Win': {
    base: 'TestingBot',
    browserName: 'chrome',
    version: 'latest',
    platform: 'WIN10'
  },
  'TB-Opera-Win': {
    base: 'TestingBot',
    browserName: 'opera',
    version: 'latest',
    platform: 'WIN10'
  },
  'TB-Chrome-Linux': {
    base: 'TestingBot',
    browserName: 'chrome',
    version: 'latest',
    platform: 'LINUX'
  },
  'TB-Chrome-Linux-Beta': {
    base: 'TestingBot',
    browserName: 'chrome',
    version: 'beta',
    platform: 'LINUX'
  },
  'TB-Chrome-Linux-Dev': {
    base: 'TestingBot',
    browserName: 'chrome',
    version: 'dev',
    platform: 'LINUX'
  },
  'TB-Safari-Mac': {
    base: 'TestingBot',
    browserName: 'safari',
    version: 'latest',
    platform: 'HIGH-SIERRA'
  },
  'TB-Safari-Dev-Mac': {
    base: 'TestingBot',
    browserName: 'safari',
    version: 'dev',
    platform: 'HIGH-SIERRA'
  },
  'TB-Safari-IOS': {
    base: 'TestingBot',
    browserName: 'safari',
    version: '11.3',
    platform: 'HIGH-SIERRA',
    deviceName: 'iPhone 8',
    platformName: 'iOS',
    idletimeout: 7 * 60
  },
  'TB-Chrome-Android': {
    base: 'TestingBot',
    browserName: 'Chrome',
    version: '8.0',
    platform: 'ANDROID',
    deviceName: 'Pixel 2 XL',
    platformName: 'Android',
    idletimeout: 7 * 60
  },
  'TB-Edge-Win': {
    base: 'TestingBot',
    browserName: 'microsoftedge',
    version: 'latest',
    platform: 'WIN10'
  },
  'TB-IE11-Win': {
    base: 'TestingBot',
    browserName: 'internet explorer',
    version: '11',
    platform: 'WIN10'
  }
};
