'use strict';

var env = {
    TEST_SERVER: 'https://local.baqend.com:8080/v1',
};

// set env to TEST_SERVER if we set a karma arg
if (typeof __karma__ != 'undefined') {
    env.TEST_SERVER = __karma__.config.args || env.TEST_SERVER
}
if (typeof process != 'undefined') {
    env.TEST_SERVER = process.env.TEST_SERVER || env.TEST_SERVER;
}

if (typeof module !== 'undefined') {
    module.exports = env;
}
