var Connector = require('./Connector');

/**
 * @class baqend.connector.XMLHttpConnector
 * @extends baqend.connector.Connector
 */
var XMLHttpConnector = Connector.inherit(/** @lends baqend.connector.XMLHttpConnector.prototype */ {
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
      return (
        window != 'undefined' &&
        window.location.hostname == host &&
        window.location.port == port &&
        window.location.protocol == (secure? 'https:': 'http:') &&
        typeof XMLHttpRequest != 'undefined'
      );
		}
	},

  constructor: function XMLHttpConnector() {
    Connector.apply(this, arguments);
  },
	
	/**
	 * @inheritDoc
	 */
	doSend: function(request, receive) {
		var xhr = new XMLHttpRequest();
		
		var url = this.origin + request.path;

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

module.exports = XMLHttpConnector;