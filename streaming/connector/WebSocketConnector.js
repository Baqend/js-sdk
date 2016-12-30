"use strict";
var CommunicationError = require('../../lib/error/CommunicationError');
var WebSocket = require('./websocket').WebSocket;
var lib = require('../../lib');
var util = require('../../lib/util/util');

/**
 * @alias connector.WebSocketConnector
 */
class WebSocketConnector {

  /**
   * @param {connector.Connector} connector a connector
   * @param {String=} url The websocket connect script url
   * @return {connector.WebSocketConnector} a websocket connection
   */
  static create(url) {
    var websocket = this.websockets[url];
    if (!websocket) {
      websocket = new WebSocketConnector(url);
      this.websockets[url] = websocket;
    }
    return websocket;
  }

  /**
   * @param {String} url
   */
  constructor(url) {
    this.observers = {};
    this.socket = null;
    this.url = url;
  }

  open() {
    if (!this.socket) {
      const socket = new WebSocket(this.url);
      let socketPromise;

      var handleSocketCompletion = (error) => {
        Object.keys(this.observers).forEach(id => {
          error? this.observers[id].error(error): this.observers[id].complete();
          delete this.observers[id];
        });
        if (this.socket == socketPromise)
          this.socket = null;
      };

      socket.onerror = handleSocketCompletion;
      socket.onclose = handleSocketCompletion;
      socket.onmessage = (event) => {
        var message = JSON.parse(event.data);
        message.date = new Date(message.date);

        var id = message.id;
        if (!id) {
          if (message.type == 'error')
            handleSocketCompletion(new CommunicationError(null, message));
          return;
        }

        var observer = this.observers[id];
        if (observer) {
          if (message.type == "error") {
            observer.error(new CommunicationError(null, message));
          } else {
            observer.next(message);
          }
        }
      };

      socketPromise = this.socket = new Promise((resolve) => {
        socket.onopen = resolve;
      }).then(() => {
        return socket;
      });
    }

    return this.socket;
  }

  close() {
    if (this.socket) {
      this.socket.then((socket) => {
        socket.close();
      });
      this.socket = null;
    }
  }

  /**
   * @param {util.TokenStorage} tokenStorage
   * @return {connector.ObservableStream} The channel for sending and receiving messages
   */
  openStream(tokenStorage) {
    let id = util.uuid();
    let stream = new lib.Observable(observer => {
      if (this.observers[id])
        throw new Error("Only one subscription per stream is allowed.");

      this.observers[id] = observer;
      return () => {
        delete this.observers[id];
      }
    });

    stream.send = (message) => {
      this.open().then((socket) => {
        message.id = id;
        if (tokenStorage.token)
          message.token = tokenStorage.token;
        var jsonMessage = JSON.stringify(message);
        socket.send(jsonMessage);
      });
    };

    return stream;
  }
}

Object.assign(WebSocketConnector,  /** @lends connector.WebSocketConnector */ {
  /**
   * Map of all available connectors to their respective websocket connections
   * @type connector.Connector[]
   */
  websockets: {}
});

module.exports = WebSocketConnector;