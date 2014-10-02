var Connector = require('./Connector').Connector;

/**
 * @class jspa.connector.NodeConnector
 * @extends jspa.connector.Connector
 */
exports.NodeConnector = NodeConnector = Connector.inherit(/** @lends jspa.connector.NodeConnector.prototype */ {
  /** @lends jspa.connector.NodeConnector */
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
				} catch (e) {}
			}
			return Boolean(this.prototype.http);
		}
	},

  cookie: null,
	
	/**
	 * @param {jspa.message.Message} message
	 */
	doSend: function(message) {
		message.request.host = this.host;
		message.request.port = this.port;

		var self = this;
		var entity = this.prepareRequestEntity(message);
		
		if (entity)
			message.request.headers['Transfer-Encoding'] = 'chunked';

    if (this.cookie && this.secure)
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

        var cookie = res.headers['Set-Cookie'];
        if (cookie) {
          self.cookie = self.parseCookie(cookie);
        }

				self.prepareResponseEntity(message, data);
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
    // BAT=V8EeMlSJJLJULZYKAAA3/aXhJevapjcUmzX681lB+RblM8ih;Path=/;Expires=Sat, 27-Aug-2016 04:59:30 GMT;Secure
    var parts = header.split(';');

    for (var part in parts) {
      if (part.indexOf('Expires=') == 0) {
        var date = Date.parse(part.substring(8));
        if (date.getTime() < new Date().getTime()) {
          return null;
        }
      }
    }

    return parts[0];
  }
});