"use strict";
const Connector = require('./Connector');

/**
 * @alias connector.FalseConnector
 * @extends connector.Connector
 */
class FalseConnector extends Connector {
  /**
   * Indicates if this connector implementation is usable for the given host and port
   * @param {string} host
   * @param {number} port
   * @param {boolean} secure
   * @returns {boolean}
   */
  static isUsable(host, port, secure) {
    return false;
  }

  /**
   * @inheritDoc
   */
  doSend(message, request, receive) {
  }

  /**
   * @inheritDoc
   */
  fromFormat(response, entity, type) {
  }

  /**
   * @inheritDoc
   */
  toFormat(message) {
  }
}

Connector.connectors.push(FalseConnector);

module.exports = FalseConnector;
