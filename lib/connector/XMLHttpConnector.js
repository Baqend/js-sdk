var Connector = require('./Connector');

/**
 * @class baqend.connector.XMLHttpConnector
 * @extends baqend.connector.Connector
 */
var XMLHttpConnector = module.exports = Connector.inherit(/** @lends baqend.connector.XMLHttpConnector.prototype */ {
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
	 * @param {Object} request
	 * @param {Function} receive
	 */
	doSend: function(request, receive) {
		var xhr = new XMLHttpRequest();
		
		var url = (this.secure? 'https': 'http') + '://' + this.host + ':' + this.port + request.path;

	  xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var response = {
					headers: {},
					statusCode: xhr.status,
					entity: xhr.response || xhr.responseText
				};

				Connector.RESPONSE_HEADERS.forEach(function(name) {
					response.headers[name] = xhr.getResponseHeader(name);
				});

				receive(response);
			}
		};

		xhr.open(request.method, url, true);

		var entity = request.entity;
		var headers = request.headers;
		for (var name in headers)
			xhr.setRequestHeader(name, headers[name]);

    xhr.withCredentials = request.withCredentials;

		xhr.send(entity);
	}
});