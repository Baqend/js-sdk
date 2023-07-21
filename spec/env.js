'use strict';

var env = {
  TEST_SERVER:  __karma__.config.args || 'https://local.baqend.com:8443/v1',
};

if (typeof module !== 'undefined') {
  module.exports = env;
}
