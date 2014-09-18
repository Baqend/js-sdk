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

  agent: null,

  initialize: function(host, port, secure) {
    this.superCall(host, port, secure);

    if (secure) {
      var caPath = 'ca.crt.pem';
      var fs = require('fs');
      var ca = fs.existsSync(caPath) && fs.readFileSync(caPath);

      if (ca) {
        this.agent = new this.http.Agent({
          host: host,
          port: port,
          ca: ca
        });
      }
    }
  },
	
	/**
	 * @param {jspa.message.Message} message
	 */
	doSend: function(message) {
		message.request.host = this.host;
		message.request.port = this.port;

    if (this.agent) {
      message.request.agent = this.agent;
    }

		var self = this;
		var entity = this.prepareRequestEntity(message);
		
		if (entity)
			message.request.headers['Transfer-Encoding'] = 'chunked';
		
		var req = this.http.request(message.request, function(res) {
			var data = '';
			
			res.setEncoding('utf-8');
			res.on('data', function(chunk) {
				data += chunk;
			});
			res.on('end', function() {
				message.response.statusCode = res.statusCode;
				message.response.headers = res.headers;
				self.prepareResponseEntity(message, data);
				self.receive(message);
			});
		});

		req.on('error', function(e) {
      console.log(e);
			self.receive(message);
		});
		
		if (entity)
			req.write(entity, 'utf8');
		
		req.end();
	}
});