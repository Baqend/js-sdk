'use strict';

var env = {
  //TEST_SERVER: 'https://local.baqend.com:8443/v1',
  TEST_SERVER: 'http://localhost:8080/v1'
};

if (typeof module !== 'undefined') {
  module.exports = env;
}
