'use strict';

const PersistentError = require('./PersistentError');

/**
 * @alias error.CommunicationError
 * @extends error.PersistentError
 */
class CommunicationError extends PersistentError {
  /**
   * @param {connector.Message} httpMessage The http message which was send
   * @param {Object} response The received entity headers and content
   */
  constructor(httpMessage, response) {
    const entity = response.entity || response.error || {};
    const state = (response.status === 0 ? 'Request' : 'Response');
    const message = entity.message || 'Handling the ' + state + ' for ' + httpMessage.request.method + ' ' + httpMessage.request.path;

    super(message, entity);

    /**
     * The name of the error
     * @type {string}
     */
    this.name = entity.className || 'CommunicationError';

    /**
     * The reason of the error
     * @type {string}
     */
    this.reason = entity.reason || 'Communication failed';

    /**
     * The error response status code of this error
     * @type {number}
     */
    this.status = response.status;

    if (entity.data) {
      this.data = entity.data;
    }

    let cause = entity;
    while (cause && cause.stackTrace) {
      this.stack += '\nServerside Caused by: ' + cause.className + ' ' + cause.message;

      const stackTrace = cause.stackTrace;
      for (let i = 0; i < stackTrace.length; i += 1) {
        const el = stackTrace[i];

        this.stack += '\n    at ' + el.className + '.' + el.methodName;
        this.stack += ' (' + el.fileName + ':' + el.lineNumber + ')';
      }

      cause = cause.cause;
    }
  }
}

module.exports = CommunicationError;
