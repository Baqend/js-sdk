var Connector = require('./Connector').Connector;

/**
 * @class jspa.connector.XMLHttpConnector
 * @extends jspa.connector.Connector
 */
exports.XMLHttpConnector = XMLHttpConnector = Connector.inherit(
/**
 * @lends jspa.connector.XMLHttpConnector.prototype
 */
{
  /**
   * @lends jspa.connector.XMLHttpConnector
   */
	extend: {
    initialize: function() {
      Connector.connectors.push(this);
    },

    /**
     * Indicates if this _connector implementation is usable for the given host and port
     * @param {String} host
     * @param {number} port
     * @param {boolean} secure
     * @returns {boolean}
     */
		isUsable: function(host, port, secure) {
			return typeof XMLHttpRequest != 'undefined';
		}
	},
	
	/**
	 * @param {jspa.message.Message} message
	 */
	doSend: function(message) {
		var xhr = new XMLHttpRequest();
		
		var url = (this.secure? 'https': 'http') + '://' + this.host + ':' + this.port + message.request.path;
		//console.log(message.request.method + ' ' + url);

	  xhr.onreadystatechange = this.readyStateChange.bind(this, xhr, message);

		xhr.open(message.request.method, url, !!message._deferred);

		var entity = this.prepareRequestEntity(message);
		var headers = message.request.headers;
		for (var name in headers)
			xhr.setRequestHeader(name, headers[name]);

		xhr.send(entity);
		
    this.doReceive(xhr, message);
	},

  /**
   * @param {XMLHttpRequest} xhr
   * @param {jspa.message.Message} message
   */
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