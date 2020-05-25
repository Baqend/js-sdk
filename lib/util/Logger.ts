'use strict';

import * as msg from "../message";
import { deprecated } from "./deprecated";
import { EntityManager } from "../EntityManager";

/**
 * A Logger to store log notes when running the app.
 */
export class Logger {
  static readonly LEVELS = ['trace', 'debug', 'info', 'warn', 'error'];
  static readonly FORMAT_REGEXP = /%[sdj%]/g;

  public entityManager: EntityManager | null = null;
  public levelIndex: number = 2;

  /**
   * Creates a Logger instance for the given EntityManager
   * @param entityManager - Theo owning entityManager
   * @return The created logger instance
   */
  static create(entityManager: EntityManager): Logger {
    const proto = this.prototype;

    const Logger = function() {
      function Logger() {
        proto.log.apply(Logger, arguments as any);
      }

      Object.getOwnPropertyNames(proto).forEach((key) => {
        Object.defineProperty(Logger, key, Object.getOwnPropertyDescriptor(proto, key)!);
      });

      return Logger as any as Logger;
    }();

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
   * @return {Promise<*>|null} A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  log(/* level, message, data */) {
    const args = Array.prototype.slice.call(arguments);
    const level = Logger.LEVELS.indexOf(args[0]) === -1 ? 'info' : args.shift();

    if (this.levelIndex > Logger.LEVELS.indexOf(level)) {
      return null;
    }

    let message = typeof args[0] === 'string' ? this.format(args.shift(), args) : '[no message]';

    let data: { name?: string, message?: string, stack?: string, data?: {}, status?: number } | null = null;
    if (args.length) {
      const arg = args.pop();
      if (typeof arg !== 'object' || Array.isArray(arg)) {
        data = { data: arg };
      }
      if (arg instanceof Error) {
        // errors aren't loggable by default, since they do not have any visible property
        // @ts-ignore
        const {stack, data: data1, message: message1, name, status} = arg;
        data = {
          name: name,
          message: message1,
          stack: stack,
          status: status,
          data: data1,
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
      user: this.entityManager?.me?.id,
      data,
    });
  }

  format(message, args) {
    if (args.length === 0) {
      return message;
    }

    const str = String(message).replace(Logger.FORMAT_REGEXP, (x: string) => {
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
          return String(Number(args.shift()));
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
    if (!this.entityManager!.isReady) {
      return this.entityManager!.ready(this.logJSON.bind(this, json));
    }

    return this.entityManager!.send(new msg.CreateObject('logs.AppLog', json));
  }
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

deprecated(Logger.prototype, '_init', 'init');
deprecated(Logger.prototype, '_format', 'format');
deprecated(Logger.prototype, '_log', 'logJSON');

module.exports = Logger;
