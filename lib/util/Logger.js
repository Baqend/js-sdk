
var message = require('../message');
var StatusCode = require('../connector/Message').StatusCode;

/**
 * @class baqend.util.Logger
 */
var Logger = Object.inherit(/** @lends baqend.util.Logger.prototype */ {

  /** @lends baqend.util.Logger */
  extend: {
    LEVELS: ['trace', 'debug', 'info', 'warn', 'error'],
    FORMAT_REGEXP: /%[sdj%]/g,

    create: function(entityManager) {
      var proto = this.prototype;

      function Logger() {
        proto.log.apply(Logger, arguments);
      }

      Object.cloneOwnProperties(Logger, proto);
      Logger._init(entityManager);

      return Logger;
    }
  },

  /**
   * @type baqend.EntityManager
   */
  entityManager: null,
  levelIndex: 2,

  get level() {
    return Logger.LEVELS[this.levelIndex];
  },

  set level(level) {
    var index = Logger.LEVELS.indexOf(level);
    if (index == -1)
      throw new Error("Unknown logging level " + level);

    this.levelIndex = index;
  },

  /**
   * Logs a message with the given log level
   * @param {String} [level='info'] The level used to log the message
   * @param {String} message The message to log, the message string can be interpolated like the node util.format method
   * @param {*} args... The arguments used to interpolated the message string
   * @param {Object} [data=null] An optional object which will be included in the log entry
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  log: function(level, message, data) {
    var args = Array.prototype.slice.call(arguments);

    level;
    if (Logger.LEVELS.indexOf(args[0]) == -1) {
      level = 'info';
    } else {
      level = args.shift();
    }

    if (this.levelIndex > Logger.LEVELS.indexOf(level))
      return;

    message = this._format(args.shift(), args);
    data = null;
    if (args.length && typeof args[args.length - 1] === 'object') {
      data = args.pop();
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
  },

  _format: function(f, args) {
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
  },

  _init: function(entityManager) {
    this.entityManager = entityManager;

    Logger.LEVELS.forEach(function(level) {
      this[level] = this.log.bind(this, level);
    }.bind(this));
  },

  _log: function(json) {
    if (!this.entityManager.isReady) {
      return this.entityManager.ready(this._log.bind(this, json));
    } else {
      return this.entityManager._send(new message.CreateObject('logs.AppLog', json));
    }
  }

  /**
   * Log message at trace level
   * @param {String} message The message to log, the message string can be interpolated like the node util.format method
   * @param {*} args... The arguments used to interpolated the message string
   * @param {Object} [data=null] An optional object which will be included in the log entry
   * @function trace
   * @memberOf baqend.util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at debug level
   * @param {String} message The message to log, the message string can be interpolated like the node util.format method
   * @param {*} args... The arguments used to interpolated the message string
   * @param {Object} [data=null] An optional object which will be included in the log entry
   * @function debug
   * @memberOf baqend.util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at info level
   * @param {String} message The message to log, the message string can be interpolated like the node util.format method
   * @param {*} args... The arguments used to interpolated the message string
   * @param {Object} [data=null] An optional object which will be included in the log entry
   * @function info
   * @memberOf baqend.util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at warn level
   * @param {String} message The message to log, the message string can be interpolated like the node util.format method
   * @param {*} args... The arguments used to interpolated the message string
   * @param {Object} [data=null] An optional object which will be included in the log entry
   * @function warn
   * @memberOf baqend.util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */

  /**
   * Log message at error level
   * @param {String} message The message to log, the message string can be interpolated like the node util.format method
   * @param {*} args... The arguments used to interpolated the message string
   * @param {Object} [data=null] An optional object which will be included in the log entry
   * @function error
   * @memberOf baqend.util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
});
module.exports = Logger;