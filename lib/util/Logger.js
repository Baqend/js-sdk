'use strict';

const msg = require('../message');

/**
 * @alias util.Logger
 */
class Logger {

  /**
   * Creates a Logger instance for the given EntityManager
   * @param {EntityManager} entityManager
   * @return {util.Logger} The created logger instance
   */
  static create(entityManager) {
    const proto = this.prototype;

    // eslint-disable-next-line no-shadow
    function Logger() {
      proto.log.apply(Logger, arguments);
    }

    Object.getOwnPropertyNames(proto).forEach((key) => {
      Object.defineProperty(Logger, key, Object.getOwnPropertyDescriptor(proto, key));
    });

    Logger.init(entityManager);

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
    const index = Logger.LEVELS.indexOf(value);
    if (index === -1) {
      throw new Error('Unknown logging level ' + value);
    }

    this.levelIndex = index;
  }

  /**
   * Logs a message in the default level 'info'
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
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
   * @return {Promise<*>|null} A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  log(level, message, data) {
    const args = Array.prototype.slice.call(arguments);

    if (Logger.LEVELS.indexOf(args[0]) === -1) {
      level = 'info';
    } else {
      level = args.shift();
    }

    if (this.levelIndex > Logger.LEVELS.indexOf(level)) {
      return null;
    }

    message = typeof args[0] === 'string' ? this.format(args.shift(), args) : '[no message]';

    let dataObj = null;
    if (args.length) {
      dataObj = args.pop();
      if (typeof dataObj !== 'object' || Array.isArray(dataObj)) {
        dataObj = { dataObj };
      }
      if (dataObj instanceof Error) {
        // errors aren't loggable by default, since they do not have any visible property
        dataObj = {
          name: data.name,
          message: data.message,
          stack: data.stack,
          data: data.data,
        };
      }
    }

    if (args.length) {
      message += ', ' + args.join(', ');
    }

    return this.logJSON({
      date: new Date(),
      message,
      level,
      user: this.entityManager.me && this.entityManager.me.id,
      data: dataObj,
    });
  }

  format(f, args) {
    if (args.length === 0) {
      return f;
    }

    const str = String(f).replace(Logger.FORMAT_REGEXP, (x) => {
      if (x === '%%') {
        return '%';
      }
      if (!args.length) {
        return x;
      }
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

  init(entityManager) {
    /** @type EntityManager */
    this.entityManager = entityManager;
    this.levelIndex = 2;

    Logger.LEVELS.forEach((level) => {
      this[level] = this.log.bind(this, level);
    });
  }

  logJSON(json) {
    if (!this.entityManager.isReady) {
      return this.entityManager.ready(this.logJSON.bind(this, json));
    }

    return this.entityManager.send(new msg.CreateObject('logs.AppLog', json));
  }

  /**
   * Log message at trace level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {...*} args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   * @return {Promise<*>|null} A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function trace
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at trace level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
   * @return {Promise<*>|null} A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
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
   * @return {Promise<*>|null} A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function debug
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at debug level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
   * @return {Promise<*>|null} A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
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
   * @return {Promise<*>|null} A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function info
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at info level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
   * @return {Promise<*>|null} A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
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
   * @return {Promise<*>|null} A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function warn
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at warn level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
   * @return {Promise<*>|null} A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
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
   * @return {Promise<*>|null} A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function error
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at error level
   * @param {string} message The message to log, the message string can be interpolated like the node util.format method
   * @param {Object<string, *>} [data=null] An optional object which will be included in the log entry
   * @return {Promise<*>|null} A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function error
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
}

Object.assign(Logger, {
  LEVELS: ['trace', 'debug', 'info', 'warn', 'error'],
  FORMAT_REGEXP: /%[sdj%]/g,
});

module.exports = Logger;
