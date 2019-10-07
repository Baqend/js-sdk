module.exports = {
  'bs_chrome_win': {
    base: 'BrowserStack',
    'os' : 'Windows',
    'os_version': '10',
    'browser': 'Chrome',
    'browser_version': 'latest',
  },
  'bs_firefox_win': {
    base: 'BrowserStack',
    'os' : 'Windows',
    'os_version' : '10',
    'browser' : 'Firefox',
    'browser_version' : 'latest',
  },
  'bs_safari_mac': {
    base: 'BrowserStack',
    'os' : 'OS X',
    'os_version' : 'Mojave',
    'browser' : 'Safari',
    'browser_version' : 'latest',
  },
  'bs_edge_win': {
    base: 'BrowserStack',
    'os' : 'Windows',
    'os_version' : '10',
    'browser' : 'Edge',
    'browser_version' : 'latest',
  },
  'bs_ie_win': {
    base: 'BrowserStack',
    'os': 'Windows',
    'os_version': '10',
    'browser': 'IE',
    'browser_version': 'latest',
  },
  'bs_safari_ios': {
    base: 'BrowserStack',
    'device' : 'iPhone XS',
    'real_mobile' : true,
    'os': 'ios',
    'os_version' : '12.1',
  },
  'bs_chrome_android': {
    base: 'BrowserStack',
    'device' : 'Google Pixel 2',
    'real_mobile' : true,
    'os': 'android',
    'os_version' : '9.0',
  }
};
