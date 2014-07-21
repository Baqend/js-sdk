var Connector = require('./Connector').Connector;

/**
 * @class jspa.connector.NodeConnector
 * @extends jspa.connector.Connector
 */
exports.NodeConnector = NodeConnector = Connector.inherit(
/**
 * @lends jspa.connector.NodeConnector.prototype
 */
{
  /**
   * @lends jspa.connector.NodeConnector
   */
	extend: {
    initialize: function() {
      Connector.connectors.push(this);
    },

		isUsable: function(host, port) {
			if (!this.prototype.http) {
				try {
					var http = require('http');
					if (http.ClientRequest) {
						this.prototype.http = http;
					} 
				} catch (e) {}
			}
			return Boolean(this.prototype.http);
		}
	},
	
	/**
	 * @param {jspa.message.Message} message
	 */
	doSend: function(message) {
		if (!message.deferred)
			throw new Error('Blocking IO is not supported');

		message.request.host = this.host;
		message.request.port = this.port;

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

		req.on('error', function() {
			self.receive(message);
		});
		
		if (entity)
			req.write(entity, 'utf8');
		
		req.end();
	}
});