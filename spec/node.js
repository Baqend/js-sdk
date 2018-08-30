'use strict';

var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.config.includeStack = true;

global.env = require('./env');
global.helper = require('./helper');

global.expect = chai.expect;

process.on('unhandledRejection', function (reason, p) {
  console.log(reason.message + ': ' + reason.stack);
});
