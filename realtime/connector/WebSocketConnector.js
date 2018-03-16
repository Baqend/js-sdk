'use strict';

const CommunicationError = require('../../lib/error/CommunicationError');
const WebSocket = require('./websocket').WebSocket;
const lib = require('../../lib');

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
    let websocket = this.websockets[url];
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

      const handleSocketCompletion = (error) => {
        // observable error calls can throw an exception therefore cleanup beforehand
        let isError = false;
        if (this.socket === socketPromise) {
          isError = socket.readyState !== 3;
          this.socket = null;
        }

        let firstErr;
        Object.keys(this.observers).forEach((id) => {
          const observer = this.observers[id];
          delete this.observers[id]; // unsubscribe to allow resubscriptions
          try {
            if (isError) {
              observer.error(new CommunicationError(null, error));
            } else {
              observer.complete();
            }
          } catch (e) {
            if (!firstErr) { firstErr = e; }
          }
        });

        if (firstErr) { throw firstErr; }
      };

      socket.onerror = handleSocketCompletion;
      socket.onclose = handleSocketCompletion;
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        message.date = new Date(message.date);

        const id = message.id;
        if (!id) {
          if (message.type === 'error') { handleSocketCompletion(message); }
          return;
        }

        const observer = this.observers[id];
        if (observer) {
          if (message.type === 'error') {
            observer.error(new CommunicationError(null, message));
          } else {
            observer.next(message);
          }
        }
      };

      socketPromise = new Promise((resolve) => {
        socket.onopen = resolve;
      }).then(() => socket);

      this.socket = socketPromise;
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
   * @param {string} id subscription ID
   * @return {connector.ObservableStream} The channel for sending and receiving messages
   */
  openStream(tokenStorage, id) {
    const stream = new lib.Observable((observer) => {
      if (this.observers[id]) { throw new Error('Only one subscription per stream is allowed.'); }

      this.observers[id] = observer;
      return () => {
        // cleanup only our subscription and handle resubscription on the same stream id correctly
        if (this.observers[id] === observer) { delete this.observers[id]; }
      };
    });

    stream.send = (message) => {
      this.open().then((socket) => {
        message.id = id;
        if (tokenStorage.token) { message.token = tokenStorage.token; }
        const jsonMessage = JSON.stringify(message);
        socket.send(jsonMessage);
      });
    };

    return stream;
  }
}

Object.assign(WebSocketConnector, /** @lends connector.WebSocketConnector */ {
  /**
   * Map of all available connectors to their respective websocket connections
   * @type connector.Connector[]
   */
  websockets: {},
});

module.exports = WebSocketConnector;
