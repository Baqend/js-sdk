jspa.connector.Connector = Object.inherit({
	extend: {
		create: function(host, port) {
			if (!host && typeof window !== 'undefined') {
				host = window.location.host;
				port = window.location.port;
			}
			
			if (host.indexOf('/') != -1) {
				var matches = /^http:\/\/([^\/:]*)(:(\d*))?\/?$/.exec(host);
				if (matches) {
					host = matches[1];
					port = matches[3];
				} else {
					throw new Error('The connection uri host ' + host + ' seems not to be valid');
				}
			}
			
			if (!port)
				port = 80;
			
			for (name in jspa.connector) {
				var connector = jspa.connector[name];
				if (connector.isUseable && connector.isUseable(host, port)) {
					return new connector(host, port);
				}
			}
			
			throw new Error('No connector is useable for the requested connection');
		}
	},
	
	/**
	 * @constructor
	 * @memberOf jspa.connector.Connector
	 * @param {String} host
	 * @param {Integer} port
	 */
	initialize: function(host, port) {
		this.host = host;
		this.port = port;
	},

	/**
	 * @param {jspa.message.Message} message
	 */
	send: function(context, message, sync) {
		if (!sync) {			
			message.deferred = new jspa.Deferred();
			message.context = context;
		}
		
		try {
			message.doSend();
			this.doSend(message);
		} catch (e) {
			e = jspa.error.PersistentError(e);
			
			if (!message.deferred) {
				throw e;
			} else {				
				message.deferred.rejectWith(context, [e]);
			}
		}
		
		if (message.deferred)
			return message.deferred.promise;
	},
	
	receive: function(message) {
		try {
			message.doReceive();
		} catch (e) {
			e = jspa.error.PersistentError(e);

			if (!message.deferred) {
				throw e;
			} else {				
				message.deferred.rejectWith(message.context, [e]);
			}
		}
		
		if (message.deferred) {			
			message.deferred.resolveWith(message.context, [message]);
		}
	},
	
	doSend: function() {
		throw new Error('Connector.doSend() not implemented');
	},
	
	/**
	 * @param {jspa.message.Message} message
	 */
	prepareRequestEntity: function(message) {
		if (message.request.entity) {
			message.request.headers['Content-Type'] = 'application/json;charset=utf-8';
			return JSON.stringify(message.request.entity);
		} else {
			return null;
		}
	},
	
	prepareResponseEntity: function(data) {
		var entity = null;
		if (data && data.length > 0) {
			entity = JSON.parse(data);
		}
		
		return entity;
	}
});