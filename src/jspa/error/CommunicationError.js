jspa.error.CommunicationError = jspa.error.PersistentError.inherit({
	initialize: function(httpMessage) {
		var state = (httpMessage.response.statusCode == 0? 'Request': 'Response');
		this.superCall('Communication failed by handling the ' + state + ' for ' + 
				httpMessage.request.method + ' ' + httpMessage.request.path);
		
		this.stack = 'CommunicationError\n';
		
		var cause = httpMessage.response.entity;
		
		this.stack += cause.message || '';
		
		while (cause) {			
			this.stack += 'Serverside Caused by ' + cause.className + ' ' + cause.message + '\n';
			
			var stackTrace = cause.stackTrace;
			for (var i = 0; i < stackTrace.length; ++i) {
				var el = stackTrace[i];

				this.stack += '  at ' + el.className + '.' + el.methodName;
				this.stack += ' (' + el.fileName + ':' + el.lineNumber + ')\n';
			}
			
			cause = cause.cause;
		}	
	}
});