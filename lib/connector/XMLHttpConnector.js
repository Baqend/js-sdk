"use strict";
var Connector = require('./Connector');

/**
 * @alias connector.XMLHttpConnector
 * @extends connector.Connector
 */
class XMLHttpConnector extends Connector {
  /**
   * Indicates if this connector implementation is usable for the given host and port
   * @param {string} host
   * @param {number} port
   * @param {boolean} secure
   * @returns {boolean}
   */
  static isUsable(host, port, secure) {
    if (typeof window == 'undefined')
      return false;

    let locationSecure = location.protocol == 'https:';
    let locationPort = location.port || (locationSecure? 443: 80);

    return location.hostname == host && locationPort == port && locationSecure == secure;
  }

  /**
   * @inheritDoc
   */
  doSend(message, request, receive) {
    if (request.method == 'OAUTH') {
      if (this.oAuthHandle)
        this.oAuthHandle({status: 409, entity: '{"message": "A new OAuth request was sent."}'});

      localStorage.removeItem('oauth-response');

      var handler = (event) => {
        if (event.key == 'oauth-response') {
          this.oAuthHandle(JSON.parse(event.newValue));
        }
      };

      this.oAuthHandle = (msg) => {
        receive(msg);
        localStorage.removeItem('oauth-response');
        removeEventListener("storage", handler, false);
      };

      addEventListener("storage", handler, false);
      return;
    }

    var xhr = new XMLHttpRequest();

    var url = this.origin + this.basePath + request.path;

    xhr.onreadystatechange = function() {
      //if we receive an error switch the response type to json
      if (xhr.readyState == 2 && xhr.status >= 400)
        xhr.responseType = 'text';

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

    // Set the message progress callback
    xhr.upload.onprogress = message.progress();

    xhr.open(request.method, url, true);

    var entity = request.entity;
    var headers = request.headers;
    for (let name in headers)
      xhr.setRequestHeader(name, headers[name]);

    xhr.withCredentials = message.withCredentials;

    switch (message.responseType()) {
      case 'arraybuffer':
        xhr.responseType = 'arraybuffer';
        break;
      case 'blob':
      case 'data-url':
      case 'base64':
        xhr.responseType = 'blob';
        break;
    }

    xhr.send(entity);
  }

  /**
   * @inheritDoc
   */
  fromFormat(response, entity, type) {
    if (type == 'json') {
      entity = JSON.parse(entity);
    } else if (type == 'data-url' || type == 'base64') {
      let reader = new FileReader();
      reader.readAsDataURL(entity);

      return new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = reject;
      }).then(() => {
        let result = reader.result;

        if (type == 'base64')
          result = result.substring(result.indexOf(',') + 1);

        return result;
      });
    }

    return entity;
  }

  /**
   * @inheritDoc
   */
  toFormat(message) {
    let type = message.request.type;

    if (type) {
      let entity = message.request.entity;
      let mimeType = message.mimeType();
      switch (type) {
        case 'blob':
          mimeType = mimeType || entity.type;
          break;
        case 'arraybuffer':
        case 'form':
          break;
        case 'data-url':
          let match = entity.match(/^data:(.+?)(;base64)?,(.*)$/);
          let isBase64 = match[2];
          entity = match[3];

          type = 'blob';
          mimeType = mimeType || match[1];
          if (!isBase64) {
            entity = decodeURIComponent(entity);
            break;
          }

        //fallthrough
        case 'base64':
          let binaryStr = atob(entity), len = binaryStr.length;
          let array = new Uint8Array(len);
          for (let i = 0; i < len; ++i) {
            array[i] = binaryStr.charCodeAt(i);
          }
          type = 'blob';
          entity = new Blob([array], {type: mimeType});
          break;
        case 'json':
          if (typeof entity != 'string') {
            entity = JSON.stringify(entity);
          }
          break;
        case 'text':
          break;
      }

      message.entity(entity, type)
       .mimeType(mimeType);
    }
  }
}

Connector.connectors.push(XMLHttpConnector);

module.exports = XMLHttpConnector;