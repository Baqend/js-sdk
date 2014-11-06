var Connector = require('./Connector').Connector;

/**
 * @class baqend.connector.NodeConnector
 * @extends baqend.connector.Connector
 */
exports.NodeConnector = NodeConnector = Connector.inherit(/** @lends baqend.connector.NodeConnector.prototype */ {
  /** @lends baqend.connector.NodeConnector */
  extend: {
    initialize: function() {
      Connector.connectors.push(this);
    },

    isUsable: function(host, port, secure) {
      if (!this.prototype.http) {
        try {
          var http;
          if (secure) {
            http = require('https');
          } else {
            http = require('http');
          }

          if (http.request) {
            this.prototype.http = http;
          }
        } catch (e) {
        }
      }
      return Boolean(this.prototype.http);
    }
  },

  cookie: null,

  /**
   * @param {baqend.connector.Message} message
   */
  doSend: function(message) {
    message.request.host = this.host;
    message.request.port = this.port;

    var self = this;
    var entity = message.request.entity;

    if (entity)
      message.request.headers['Transfer-Encoding'] = 'chunked';

    if (this.cookie && this.secure && message.withCredentials)
      message.request.headers['Cookie'] = this.cookie;

    var req = this.http.request(message.request, function(res) {
      var data = '';

      res.setEncoding('utf-8');
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
        message.response.statusCode = res.statusCode;
        message.response.headers = res.headers;

        var cookie = res.headers['set-cookie'];
        if (cookie) {
          // cookie may be an array, convert it to a string
          self.cookie = self.parseCookie(cookie + '');
        }

        message.response.entity = data;
        self.receive(message);
      });
    });

    req.on('error', function(e) {
      self.receive(message);
    });

    if (entity)
      req.write(entity, 'utf8');

    req.end();
  },

  /**
   * Parse the cookie header
   * @param {String} header
   */
  parseCookie: function(header) {
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
});