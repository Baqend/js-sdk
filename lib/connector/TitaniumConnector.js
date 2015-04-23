var Connector = require('./Connector');

/**
 * @class baqend.connector.TitaniumConnector
 * @extends baqend.connector.Connector
 */
var TitaniumConnector = Connector.inherit(/** @lends baqend.connector.TitaniumConnector.prototype */ {
  /** @lends baqend.connector.TitaniumConnector */
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
      return typeof Ti != 'undefined' && Ti.Network;
		}
	},

  constructor: function TitaniumConnector() {
    Connector.apply(this, arguments);
  },
	
	/**
	 * @inheritDoc
	 */
	doSend: function(request, receive) {
		var xhr = Ti.Network.createHTTPClient();
		var url = this.origin + request.path;

	  xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				var response = {
					headers: {},
					statusCode: xhr.status,
					entity:  xhr.responseText
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

module.exports = TitaniumConnector;