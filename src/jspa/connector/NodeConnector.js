jspa.connector.NodeConnector = jspa.connector.Connector.inherit({
	extend: {
		isUseable: function(host, port) {
			if (!this.prototype.http) {
				try {
					var http = require('http');
					if (http.ClientRequest) {
						this.prototype.http = http;
					} 
				} catch (e) {};
			}
			return Boolean(this.prototype.http);
		}
	},
	
	/**
	 * @memberOf jspa.connector.XMLHttpConnector
	 * @param {jspa.message.Message} message
	 * @param {Boolean} sync
	 */
	send: function(message, sync) {
		if (sync)
			throw new Error('Blocking IO is not supported');
		
		message.request.host = this.host;
		message.request.port = this.port;
		
		var self = this;
		var entity = this.prepareRequestEntity(message);
		
		message.request.headers['Content-Length'] = entity? entity.length: 0;
		
		var req = this.http.request(message.request, function(res) {
			var data = '';
			
			res.setEncoding('utf8');
			res.on('data', function(chunk) {
				data += chunk;
			});
			res.on('end', function() {
				message.response.statusCode = res.statusCode;
				message.response.headers = res.headers;
				message.response.entity = self.prepareResponseEntity(data);
				message.receive();
			});
		});
		
		req.on('error', function() {
			message.receive();
		});
		
		if (entity)
			req.write(entity);
		
		req.end();
	}
});