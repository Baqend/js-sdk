/**
 * @class jspa.connector.XMLHttpConnector
 * @extends jspa.connector.Connector
 */
jspa.connector.XMLHttpConnector = jspa.connector.Connector.inherit({
	extend: {
		isUsable: function(host, port) {
			return typeof XMLHttpRequest != 'undefined';
		}
	},
	
	/**
	 * @param {jspa.message.Message} message
	 */
	doSend: function(message) {
		var xhr = new XMLHttpRequest();
		
		var url = 'http://' + this.host + ':' + this.port + message.request.path;
		//console.log(message.request.method + ' ' + url);

		if (message.deferred)			
			xhr.onreadystatechange = this.readyStateChange.bind(this, xhr, message);
		
		xhr.open(message.request.method, url, !!message.deferred);

		var entity = this.prepareRequestEntity(message);
		var headers = message.request.headers;
		for (var name in headers)
			xhr.setRequestHeader(name, headers[name]);

		xhr.send(entity);
		
		if (!message.deferred)
			this.doReceive(xhr, message);
	},
	
	readyStateChange: function(xhr, message) {
		if (xhr.readyState == 4) {
			this.doReceive(xhr, message);
		}
	},
	
	doReceive: function(xhr, message) {
		message.response.statusCode = xhr.status;
		
		var headers = message.response.headers;
		for (var name in headers)
			headers[name] = xhr.getResponseHeader(name);
		
		this.prepareResponseEntity(message, xhr.responseText);
		this.receive(message);
	}
});