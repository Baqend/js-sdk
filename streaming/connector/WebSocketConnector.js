"use strict";
var Connector = require('../../lib/connector/Connector');
var message = require('../../lib/message');

/**
 * @alias connector.WebSocketConnector
 */
class WebSocketConnector {


  /**
   * @param {connector.Connector} connector a connector
   * @return {connector.WebSocketConnector} a websocket connection
   */
  static create(connector) {
    if (!connector)
      throw new Error('No connector was provided, but connector is required for websocket connection!');

    var url = Connector.toUri(connector.host, connector.port, connector.secure, connector.basePath);
    var websocket = this.websockets[url];

    if (!websocket) {
      websocket = new WebSocketConnector(connector);
      this.websockets[url] = websocket;
    }

    return websocket;
  }

  /**
   * @param {connector.Connector} connector
   */
  constructor(connector) {
    this.host = connector.host;
    this.port = connector.port;
    this.secure = connector.secure;
    this.basePath = connector.basePath;
    this.connector = connector;
    this.listeners = {};
  }

  /**
   * Registers a handler for a topic.
   * @param {string|Object} topic
   * @param {Function} cb
   */
  subscribe(topic, cb) {
    topic = Object(topic) instanceof String ? topic : JSON.stringify(topic);
    if (!this.listeners[topic]) {
      this.listeners[topic] = [cb];
    } else if (this.listeners[topic].indexOf(cb) == -1) {
      this.listeners[topic].push(cb);
    }
  }

  /**
   * Deregisters a handler.
   * @param {string|Object} topic
   * @param {Function} cb
   */
  unsubscribe(topic, cb) {
    topic = Object(topic) instanceof String ? topic : JSON.stringify(topic);
    if (this.listeners[topic]) {
      var index = this.listeners[topic].indexOf(cb);
      if (index != -1) {
        this.listeners[topic].splice(index, 1);
      }
    }
  }

  socketListener(event) {
    var message = JSON.parse(event.data);
    var topic = message.topic;
    topic = Object(topic) instanceof String ? topic : JSON.stringify(topic);
    if (this.listeners[topic]) {
      this.listeners[topic].forEach(function(listener) {
        listener(message);
      });
    }
  }

  /**
   * Sends a websocket message over a lazily initialized websocket connection.
   * @param {Object} msg
   * @param {string} msg.topic
   * @param {string} msg.token
   */
  sendOverSocket(msg) {
    //Lazy socket initialization
    if (!this.socketOpen) {
      //Resolve Promise on connect
      this.socketOpen = new Promise((resolve, reject) => {
        this.connector.send(new message.EventsUrl()).then((response) => {
          return response.entity.urls;
        }, () => null).then((urls) => {
          let url;
          if (urls) {
            let prefix = this.secure ? "wss://" : "ws://";
            urls = urls.filter((url) => {
              return url.indexOf(prefix) == 0;
            });

            let len = urls.length;
            url = urls[Math.floor(Math.random() * len)];
          } else {
            url = (this.secure ? 'wss://' : 'ws://') + this.host + ':' + this.port + this.basePath + '/events'
          }

          this.socket = this.createWebSocket(url);
          this.socket.onmessage = this.socketListener.bind(this);

          this.socket.onopen = resolve;
          this.socket.onerror = reject;

          //Reset socket on close
          this.socket.onclose = () => {
            this.socket = null;
            this.socketOpen = null;
          };
        }).catch(reject);
      });
    }

    this.socketOpen.then(() => {
      var jsonMessage = JSON.stringify(msg);
      this.socket.send(jsonMessage);
    });
  }

  createWebSocket(destination) {
    var WebSocket = require('../../lib/util').WebSocket;

    if (!WebSocket)
      console.warn('Optional websocket module is not installed. Therefore, real-time communication is not available.');

    return new WebSocket(destination);
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