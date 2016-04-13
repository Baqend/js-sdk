"use strict";
var Connector = require('./Connector');

/**
 * @alias baqend.connector.XMLHttpConnector
 * @extends baqend.connector.Connector
 */
class XMLHttpConnector extends Connector {
  /**
   * Indicates if this connector implementation is usable for the given host and port
   * @param {String} host
   * @param {number} port
   * @param {boolean} secure
   * @returns {boolean}
   */
  static isUsable(host, port, secure) {
    return (
        window != 'undefined' &&
        window.location.hostname == host &&
        window.location.port == port &&
        window.location.protocol == (secure ? 'https:' : 'http:') &&
        typeof XMLHttpRequest != 'undefined'
    );
  }

  /**
   * @inheritDoc
   */
  doSend(message, request, receive) {
    if (request.method == 'OAUTH') {
      addEventListener("storage", function handle(event) {
        if (event.key == 'oauth-response') {
          receive(JSON.parse(event.newValue));
          localStorage.removeItem('oauth-response');
          removeEventListener("storage", handle, false);
        }
      }, false);
      return;
    }

    var xhr = new XMLHttpRequest();

    var url = this.origin + this.basePath + request.path;

    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var response = {
          headers: {},
          status: xhr.status,
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

    xhr.withCredentials = message.withCredentials;

    xhr.send(entity);
  }

}

Connector.connectors.push(XMLHttpConnector);

module.exports = XMLHttpConnector;