// initialize Test Framework
var chai = require('chai');

chai.config.includeStack = true;

global.expect = chai.expect;

// load SDK
global.Baqend = require('..');

// initialize tests
global.env = require('./env');
global.helper = require('./helper');
