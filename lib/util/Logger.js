"use strict";

var message = require('../message');
var StatusCode = require('../connector/Message').StatusCode;

/**
 * A Logger to store log notes when running the app.
 *
 * @alias util.Logger
 */
class Logger {

  static create(entityManager) {
    var proto = this.prototype;

    function Logger() {
      proto.log.apply(Logger, arguments);
    }

    for (let key of Object.getOwnPropertyNames(proto))
      Object.defineProperty(Logger, key, Object.getOwnPropertyDescriptor(proto, key));

    Logger._init(entityManager);

    return Logger;
  }

  /**
   * The log level which will be logged
   *
   * The log level can be one of 'trace', 'debug', 'info', 'warn', 'error'
   * @type string
   */
  get level() {
    return Logger.LEVELS[this.levelIndex];
  }

  /**
   * Sets the log level which will be logged
   * @param {string} value
   */
  set level(value) {
    var index = Logger.LEVELS.indexOf(value);
    if (index == -1)
      throw new Error("Unknown logging level " + value);

    this.levelIndex = index;
  }

  /**
   * Logs a message in the default level 'info'
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   * @return {void}
   *
   * @name log
   * @memberOf util.Logger.prototype
   * @function
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Logs a message in the default level 'info'
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
   * @return {void}
   *
   * @name log
   * @memberOf util.Logger.prototype
   * @function
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Logs a message with the given log level
   * @param {string} level The level used to log the message
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   * @return {void}
   * @name log
   * @memberOf util.Logger.prototype
   * @function
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Logs a message with the given log level
   * @param {string} level The level used to log the message
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
   * @return {void}
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  log(level, message, data) {
    var args = Array.prototype.slice.call(arguments);

    if (Logger.LEVELS.indexOf(args[0]) == -1) {
      level = 'info';
    } else {
      level = args.shift();
    }

    if (this.levelIndex > Logger.LEVELS.indexOf(level))
      return;

    message = typeof args[0] === 'string'? this._format(args.shift(), args): '[no message]';
    data = null;
    if (args.length && typeof args[args.length - 1] === 'object') {
      data = args.pop();
      if (Array.isArray(data))
        data = {data: data};
    }

    if (args.length) {
      message += ", " + args.join(", ");
    }

    return this._log({
      date: new Date(),
      message: message,
      level: level,
      user: this.entityManager.me && this.entityManager.me.id,
      data: data
    });
  }

  _format(f, args) {
    if (args.length == 0)
      return f;

    var str = String(f).replace(Logger.FORMAT_REGEXP, function(x) {
      if (x === '%%') return '%';
      if (!args.length) return x;
      switch (x) {
        case '%s':
          return String(args.shift());
        case '%d':
          return Number(args.shift());
        case '%j':
          try {
            return JSON.stringify(args.shift());
          } catch (_) {
            return '[Circular]';
          }
        default:
          return x;
      }
    });

    return str;
  }

  _init(entityManager) {
    /** @type EntityManager */
    this.entityManager = entityManager;
    this.levelIndex = 2;

    Logger.LEVELS.forEach((level) => {
      this[level] = this.log.bind(this, level);
    });
  }

  _log(json) {
    if (!this.entityManager.isReady) {
      return this.entityManager.ready(this._log.bind(this, json));
    } else {
      return this.entityManager.send(new message.CreateObject('logs.AppLog', json));
    }
  }
}

/**
 * Log message at trace level
 * @param {string} message The message to log, the message string can be interpolated like the node util.format method
 * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
 * be included in the log entry
 * @return {void}
 * @function trace
 * @memberOf util.Logger.prototype
 *
 * @see https://nodejs.org/api/util.html#util_util_format_format
 */

/**
 * Log message at trace level
 * @param {string} message The message to log, the message string can be interpolated like the node util.format method
 * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
 * @return {void}
 * @function trace
 * @memberOf util.Logger.prototype
 *
 * @see https://nodejs.org/api/util.html#util_util_format_format
 */

/**
 * Log message at debug level
 * @param {string} message The message to log, the message string can be interpolated like the node util.format method
 * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
 * be included in the log entry
 * @return {void}
 * @function debug
 * @memberOf util.Logger.prototype
 *
 * @see https://nodejs.org/api/util.html#util_util_format_format
 */

/**
 * Log message at debug level
 * @param {string} message The message to log, the message string can be interpolated like the node util.format method
 * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
 * @return {void}
 * @function debug
 * @memberOf util.Logger.prototype
 *
 * @see https://nodejs.org/api/util.html#util_util_format_format
 */

/**
 * Log message at info level
 * @param {string} message The message to log, the message string can be interpolated like the node util.format method
 * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
 * be included in the log entry
 * @return {void}
 * @function info
 * @memberOf util.Logger.prototype
 *
 * @see https://nodejs.org/api/util.html#util_util_format_format
 */

/**
 * Log message at info level
 * @param {string} message The message to log, the message string can be interpolated like the node util.format method
 * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
 * @return {void}
 * @function info
 * @memberOf util.Logger.prototype
 *
 * @see https://nodejs.org/api/util.html#util_util_format_format
 */

/**
 * Log message at warn level
 * @param {string} message The message to log, the message string can be interpolated like the node util.format method
 * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
 * be included in the log entry
 * @return {void}
 * @function warn
 * @memberOf util.Logger.prototype
 *
 * @see https://nodejs.org/api/util.html#util_util_format_format
 */

/**
 * Log message at warn level
 * @param {string} message The message to log, the message string can be interpolated like the node util.format method
 * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
 * @return {void}
 * @function warn
 * @memberOf util.Logger.prototype
 *
 * @see https://nodejs.org/api/util.html#util_util_format_format
 */

/**
 * Log message at error level
 * @param {string} message The message to log, the message string can be interpolated like the node util.format method
 * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
 * be included in the log entry
 * @return {void}
 * @function error
 * @memberOf util.Logger.prototype
 *
 * @see https://nodejs.org/api/util.html#util_util_format_format
 */

/**
 * Log message at error level
 * @param {string} message The message to log, the message string can be interpolated like the node util.format method
 * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
 * @return {void}
 * @function error
 * @memberOf util.Logger.prototype
 *
 * @see https://nodejs.org/api/util.html#util_util_format_format
 */

Object.assign(Logger, {
  LEVELS: ['trace', 'debug', 'info', 'warn', 'error'],
  FORMAT_REGEXP: /%[sdj%]/g
});

module.exports = Logger;
