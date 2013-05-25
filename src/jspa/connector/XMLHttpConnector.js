jspa.connector.XMLHttpConnector = jspa.connector.Connector.inherit({
	extend: {
		isUseable: function(host, port) {
			return typeof XMLHttpRequest != 'undefined';
		}
	},
	
	/**
	 * @memberOf jspa.connector.XMLHttpConnector
	 * @param {jspa.message.Message} message
	 * @param {Boolean} sync
	 */
	send: function(message, sync) {
		var xhr = new XMLHttpRequest();
		
		var url = 'http://' + this.host + ':' + this.port + message.request.path;
		console.log(url);
		xhr.open(message.request.method, url, !sync);
		
		var entity = this.prepareRequestEntity(message);
		if (!sync)			
			xhr.onreadystatechange = this.readyStateChange.bind(this, xhr, message);
		
		var headers = message.request.headers;
		for (var name in headers)
			xhr.setRequestHeader(name, headers[name]);
		
		xhr.send(entity);
		
		if (sync)
			this.receive(xhr, message);
	},
	
	readyStateChange: function(xhr, message) {
		if (xhr.readyState == 4) {
			this.receive(xhr, message);
		}
	},
	
	receive: function(xhr, message) {
		message.response.statusCode = xhr.status;
		
		var headers = message.response.headers;
		for (var name in headers)
			headers[name] = xhr.getResponseHeader(name);
		
		message.response.entity = this.prepareResponseEntity(xhr.responseText);
		message.receive();
	}
});