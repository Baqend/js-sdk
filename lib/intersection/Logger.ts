'use strict';

import * as msg from "../message";
import { EntityManager } from "../EntityManager";
import { Json, JsonMap } from "../util";

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

/**
 * A Logger to store log notes when running the app.
 */
export class Logger {
  static readonly LEVELS: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error'];
  static readonly FORMAT_REGEXP = /%[sdj%]/g;

  public entityManager: EntityManager = null as any;
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
  get level(): LogLevel {
    return Logger.LEVELS[this.levelIndex];
  }

  /**
   * Sets the log level which will be logged
   * @param value
   */
  set level(value: LogLevel) {
    const index = Logger.LEVELS.indexOf(value);
    if (index === -1) {
      throw new Error('Unknown logging level ' + value);
    }

    this.levelIndex = index;
  }

  /**
   * Logs a message in the default level 'info'
   * @param message The message to log, the message string can be interpolated like the node util.format method
   * @param args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   *
   * @return A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   */
  log(message: string, ...args: any[]): Promise<any>;

  /**
   * Logs a message in the default level 'info'
   * @param message The message to log, the message string can be interpolated like the node util.format method
   * @param [data=null] An optional object which will be included in the log entry
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   *
   * @return A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   */
  log(message: string, data: any): Promise<any>;

  /**
   * Logs a message with the given log level
   * @param level The level used to log the message
   * @param message The message to log, the message string can be interpolated like the node util.format method
   * @param args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   *
   * @return A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   */
  log(level: string, message: string, ...args: any[]): Promise<any>;

  /**
   * Logs a message with the given log level
   * @param level The level used to log the message
   * @param message The message to log, the message string can be interpolated like the node util.format method
   * @param [data=null] An optional object which will be included in the log entry
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   *
   * @return A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   */
  log(level: string, message: string, data: any): Promise<any>;

  log(): Promise<any> {
    const args = Array.prototype.slice.call(arguments);
    const level: LogLevel = Logger.LEVELS.indexOf(args[0]) === -1 ? 'info' : args.shift();

    if (this.levelIndex > Logger.LEVELS.indexOf(level)) {
      return Promise.resolve(null);
    }

    let message: string = typeof args[0] === 'string' ? this.format(args.shift(), args) : '[no message]';

    let data: { data: any } | { name: string, message: string, stack: string, data: {}, status: number } | null = null;
    if (args.length) {
      const arg = data = args.pop();
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
      date: new Date().toISOString(),
      message,
      level,
      data,
      ...(this.entityManager.me && {user: this.entityManager.me.id })
    });
  }

  format(message: string, args: any) {
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

  init(entityManager: EntityManager) {
    this.entityManager = entityManager;
    this.levelIndex = 2;

    Logger.LEVELS.forEach((level) => {
      this[level] = this.log.bind(this, level);
    });
  }

  logJSON(json: JsonMap): Promise<any> {
    if (!this.entityManager.isReady) {
      return this.entityManager.ready(this.logJSON.bind(this, json));
    }

    return this.entityManager.send(new msg.CreateObject('logs.AppLog', json));
  }
}

export interface Logger {
  /**
   * Log message at trace level
   * @param message The message to log, the message string can be interpolated like the node util.format method
   * @param args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   * @return A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function trace
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  trace(message: string, ...args: any[]): Promise<any>;

  /**
   * Log message at trace level
   * @param message The message to log, the message string can be interpolated like the node util.format method
   * @param [data=null] An optional object which will be included in the log entry
   * @return A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function trace
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  trace(message: string, data: any): Promise<any>;

  /**
   * Log message at debug level
   * @param message The message to log, the message string can be interpolated like the node util.format method
   * @param args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   * @return A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function debug
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  debug(message: string, ...args: any[]): Promise<any>;

  /**
   * Log message at debug level
   * @param message The message to log, the message string can be interpolated like the node util.format method
   * @param [data=null] An optional object which will be included in the log entry
   * @return A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function debug
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  debug(message: string, data: any): Promise<any>;

  /**
   * Log message at info level
   * @param message The message to log, the message string can be interpolated like the node util.format method
   * @param args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   * @return A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function info
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  info(message: string, ...args: any[]): Promise<any>;

  /**
   * Log message at info level
   * @param message The message to log, the message string can be interpolated like the node util.format method
   * @param [data=null] An optional object which will be included in the log entry
   * @return A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function info
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  info(message: string, data: any): Promise<any>;

  /**
   * Log message at warn level
   * @param message The message to log, the message string can be interpolated like the node util.format method
   * @param args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   * @return A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function warn
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  warn(message: string, ...args: any[]): Promise<any>;

  /**
   * Log message at warn level
   * @param message The message to log, the message string can be interpolated like the node util.format method
   * @param [data=null] An optional object which will be included in the log entry
   * @return A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function warn
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  warn(message: string, data: any): Promise<any>;

  /**
   * Log message at error level
   * @param message The message to log, the message string can be interpolated like the node util.format method
   * @param args The arguments used to interpolated the message string. The last param can be object which will
   * be included in the log entry
   * @return A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function error
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  error(message: string, ...args: any[]): Promise<any>;

  /**
   * Log message at error level
   * @param message The message to log, the message string can be interpolated like the node util.format method
   * @param [data=null] An optional object which will be included in the log entry
   * @return A promise which resolves when the log messages was logged, or null if the log level has
   * skipped the message
   * @function error
   * @memberOf util.Logger.prototype
   *
   * @see https://nodejs.org/api/util.html#util_util_format_format
   */
  error(message: string, data: any): Promise<any>;
}
