var Connector = require('./Connector').Connector;

/**
 * @class baqend.connector.XMLHttpConnector
 * @extends baqend.connector.Connector
 */
exports.XMLHttpConnector = XMLHttpConnector = Connector.inherit(/** @lends baqend.connector.XMLHttpConnector.prototype */ {
  /** @lends baqend.connector.XMLHttpConnector */
	extend: {
    initialize: function() {
      Connector.connectors.push(this);
    },

    /**
     * Indicates if this connector implementation is usable for the given host and port
     * @param {String} host
     * @param {number} port
     * @param {boolean} secure
     * @returns {boolean}
     */
		isUsable: function(host, port, secure) {
      if (typeof window != 'undefined') {
        if (window.location.hostname == host && window.location.port == port) {
          return typeof XMLHttpRequest != 'undefined'
        }
      }

      return false;
		}
	},
	
	/**
	 * @param {baqend.message.Message} message
	 */
	doSend: function(message) {
		var xhr = new XMLHttpRequest();
		
		var url = (this.secure? 'https': 'http') + '://' + this.host + ':' + this.port + message.request.path;

	  xhr.onreadystatechange = this.readyStateChange.bind(this, xhr, message);

		xhr.open(message.request.method, url, true);

		var entity = message.request.entity;
		var headers = message.request.headers;
		for (var name in headers)
			xhr.setRequestHeader(name, headers[name]);

    xhr.withCredentials = message.withCredentials;

		xhr.send(entity);
	},

  /**
   * @param {XMLHttpRequest} xhr
   * @param {baqend.message.Message} message
   */
	readyStateChange: function(xhr, message) {
		if (xhr.readyState == 4) {
			this.doReceive(xhr, message);
		}
	},
	
	doReceive: function(xhr, message) {
		message.response.statusCode = xhr.status;

		var headers = message.response.headers;

    Connector.RESPONSE_HEADERS.forEach(function(name) {
      headers[name] = xhr.getResponseHeader(name);
    });

		message.response.entity = xhr.responseText;
		this.receive(message);
	}
});