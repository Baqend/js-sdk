'use strict';

// Initialize node test environment
require('source-map-support').install()

process.on('unhandledRejection', function (reason, p) {
  console.log(reason.message + ': ' + reason.stack);
});

// initialize Test Framework
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.config.includeStack = true;

global.expect = chai.expect;

// load SDK
global.Baqend = require('../');

// initialize tests
global.env = require('./env');
global.helper = require('./helper');
