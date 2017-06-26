/**
 * @namespace util
 */
exports.isNode = require('./is-node').isNode;
exports.atob = require('./atob').atob;
exports.hmac = require('./hmac').hmac;
exports.Metadata = require('./Metadata');
exports.Permission = require('./Permission');
exports.Validator = require('./Validator');
exports.ValidationResult = require('./ValidationResult');
exports.Code = require('./Code');
exports.Modules = require('./Modules');
exports.Lockable = require('./Lockable');
exports.Logger = require('./Logger');
exports.PushMessage = require('./PushMessage');
exports.TokenStorage = require('./TokenStorage');

/**
 * @function
 * @name uuid
 * @memberOf util.prototype
 * @return {string} A generated version 4 UUID.
 */
exports.uuid = require('uuid/v4');
