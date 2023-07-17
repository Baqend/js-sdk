'use strict';

var env = {
  TEST_SERVER: process.env.TEST_SERVER || 'https://local.baqend.com:8443/v1',
};

if (typeof module !== 'undefined') {
  module.exports = env;
}
