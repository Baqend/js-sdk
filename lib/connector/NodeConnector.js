"use strict";

var Connector = require('./Connector');

/**
 * @class baqend.connector.NodeConnector
 * @extends baqend.connector.Connector
 */
class NodeConnector extends Connector {
  static isUsable(host, port, secure) {
    if (!this.prototype.http) {
      try {
        var http;
        if (secure) {
          http = require('https');
        } else {
          http = require('http');
        }

        if (http.request && http.Server) {
          this.prototype.http = http;
        }
      } catch (e) {
      }
    }
    return Boolean(this.prototype.http);
  }

  constructor(host, port, secure) {
    super(host, port, secure);
    this.cookie = null;
  }

  /**
   * @inheritDoc
   */
  doSend(request, receive) {
    request.host = this.host;
    request.port = this.port;

    var self = this;
    var entity = request.entity;

    if (entity)
      request.headers['Transfer-Encoding'] = 'chunked';

    if (this.cookie && this.secure && request.withCredentials)
      request.headers['Cookie'] = this.cookie;

    var req = this.http.request(request, function(res) {
      var data = '';

      res.setEncoding('utf-8');
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
        var cookie = res.headers['set-cookie'];
        if (cookie) {
          // cookie may be an array, convert it to a string
          self.cookie = self.parseCookie(cookie + '');
        }

        receive({
          status: res.statusCode,
          headers: res.headers,
          entity: data
        });
      });
    });

    req.on('error', function(e) {
      receive({
        status: 0,
        error: e
      });
    });

    if (entity)
      req.write(entity, 'utf8');

    req.end();
  }

  /**
   * @inheritDoc
   */
  createSocket () {
    var WebSocket = require('websocket').w3cwebsocket;
    return new WebSocket((this.secure ? 'wss://' : 'ws://') + this.host + ':' + this.port + '/events/');
  }

  /**
   * Parse the cookie header
   * @param {String} header
   */
  parseCookie(header) {
    var parts = header.split(';');

    for (var i = 0, part; part = parts[i]; ++i) {
      if (part.indexOf('Expires=') == 0) {
        var date = Date.parse(part.substring(8));
        if (date < Date.now()) {
          return null;
        }
      }
    }

    return parts[0];
  }
}

Connector.connectors.push(NodeConnector);

module.exports = NodeConnector;