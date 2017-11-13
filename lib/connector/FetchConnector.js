'use strict';

const Connector = require('./Connector');

/**
 * @alias connector.FetchConnector
 * @extends connector.Connector
 */
class FetchConnector extends Connector {
  /**
   * Indicates if this connector implementation is usable for the given host and port
   * @param {string} host
   * @param {number} port
   * @param {boolean} secure
   * @returns {boolean}
   */
  static isUsable() {
    return typeof fetch !== 'undefined';
  }

  /**
   * @inheritDoc
   */
  doSend(message, request, receive) {
    const url = this.origin + this.basePath + request.path;
    const method = request.method;
    const headers = request.headers;
    const entity = request.entity;
    const credentials = message.withCredentials ? 'include' : 'same-origin';
    const response = {
      headers: {},
    };

    return fetch(url, {
      method,
      headers,
      body: entity,
      credentials,
    }).then((res) => {
      // console.log(res)
      response.status = res.status;
      Connector.RESPONSE_HEADERS.forEach((name) => {
        response.headers[name] = res.headers.get ? res.headers.get(name) : res.headers[name];
      });

      response.entity = res;

      receive(response);
    });
  }

  /**
   * @inheritDoc
   */
  fromFormat(response, rawEntity, type) {
    if (type === 'json') {
      return rawEntity.json();
    } else if (type === 'blob') {
      return rawEntity.blob();
    } else if (type === 'data-url' || type === 'base64') {
      return rawEntity.blob().then((entity) => {
        const reader = new FileReader();
        reader.readAsDataURL(entity);
        return new Promise((resolve, reject) => {
          reader.onload = resolve;
          reader.onerror = reject;
        }).then(() => {
          let result = reader.result;
          if (type === 'base64') {
            result = result.substring(result.indexOf(',') + 1);
          }
          return result;
        });
      });
    }

    return rawEntity;
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
        case 'data-url': {
          const match = entity.match(/^data:(.+?)(;base64)?,(.*)$/);
          const isBase64 = match[2];
          entity = match[3];

          type = 'blob';
          mimeType = mimeType || match[1];
          if (!isBase64) {
            entity = decodeURIComponent(entity);
            break;
          }
        } // fallthrough
        case 'base64': {
          const binaryStr = atob(entity);
          const len = binaryStr.length;
          const array = new Uint8Array(len);
          for (let i = 0; i < len; ++i) {
            array[i] = binaryStr.charCodeAt(i);
          }
          type = 'blob';
          entity = new Blob([array], {type: mimeType});
          break;
        }
        case 'json': {
          if (typeof entity !== 'string') {
            entity = JSON.stringify(entity);
          }
          break;
        }
        case 'text':
          break;
        default:
          throw new Error('Supported request format:' + type);
      }

      message.entity(entity, type).mimeType(mimeType);
    }
  }
}

Connector.connectors.push(FetchConnector);

module.exports = FetchConnector;
