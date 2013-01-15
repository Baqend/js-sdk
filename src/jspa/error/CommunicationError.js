jspa.error.CommunicationError = jspa.error.PersistentError.inherit({
	initialize: function(httpMessage) {
		var state = (httpMessage.response.statusCode == 0? 'Request': 'Response');
		this.superCall('Communication failed by handling the ' + state + ' for ' + httpMessage.request.path);
		
		this.httpMessage = httpMessage;
	}
});