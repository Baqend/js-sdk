"use strict";

var Connector = require('./Connector');
var PersistentError = require('../error/PersistentError');
var http;
var https;
var stream;

/**
 * @alias connector.NodeConnector
 * @extends connector.Connector
 */
class NodeConnector extends Connector {
  static isUsable(host, port, secure) {
    if (!http) {
      try {
        http = require('http');
        https = require('https');
        stream = require('stream');
      } catch (e) {}
    }
    //prevent using when it is shimmed
    return http && http.Server;
  }

  constructor(host, port, secure, basePath) {
    super(host, port, secure, basePath);
    this.cookie = null;
    this.http = secure? https: http;
  }

  /**
   * @inheritDoc
   */
  doSend(message, request, receive) {
    request.host = this.host;
    request.port = this.port;
    request.path = this.basePath + request.path;

    let entity = request.entity;
    let type = request.type;
    let responseType = message.responseType();

    if (this.cookie && message.withCredentials)
      request.headers['cookie'] = this.cookie;

    let req = this.http.request(request, (res) => {
      let cookie = res.headers['set-cookie'];
      if (cookie) {
        // cookie may be an array, convert it to a string
        this.cookie = this.parseCookie(cookie + '');
      }

      let status = res.statusCode;
      if (status >= 400)
        responseType = 'json';

      if (responseType == 'stream') {
        receive({
          status: status,
          headers: res.headers,
          entity: res
        });
        return;
      }

      let binary = responseType && responseType != 'text' && responseType != 'json';
      let chunks = [];
      if (!binary) {
        res.setEncoding('utf-8');
      }

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        receive({
          status: status,
          headers: res.headers,
          entity: binary? Buffer.concat(chunks): chunks.join('')
        });
      });
    });

    req.on('error', (e) => {
      receive({
        status: 0,
        error: e
      });
    });

    if (type == 'stream') {
      entity.pipe(req);
    } else if (type == 'buffer') {
      req.end(entity);
    } else if (type) {
      req.end(entity, 'utf8');
    } else {
      req.end();
    }
  }


  /**
   * Parse the cookie header
   * @param {string} header
   */
  parseCookie(header) {
    var parts = header.split(';');

    for (var i = 0, part; part = parts[i]; ++i) {
      if (part.indexOf('Expires=') == 0) {
        var date = Date.parse(part.substring(8));
        if (date < Date.now()) {
          return null;
        }
      }
    }

    return parts[0];
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
        case 'stream':
          if (!message.contentLength()) {
            throw new PersistentError('You must specify a content length while making a stream based upload.');
          }
          break;
        case 'buffer':
          break;
        case 'arraybuffer':
          type = 'buffer';
          entity = new Buffer(entity);
          break;
        case 'data-url':
          let match = entity.match(/^data:(.+?)(;base64)?,(.*)$/);
          let isBase64 = match[2];
          entity = match[3];

          type = 'buffer';
          mimeType = mimeType || match[1];
          if (isBase64) {
            entity = new Buffer(entity, 'base64');
          } else {
            entity = new Buffer(decodeURIComponent(entity), 'utf8');
          }

          break;
        case 'base64':
          type = 'buffer';
          entity = new Buffer(entity, 'base64');
          break;
        case 'json':
          if (typeof entity != 'string') {
            entity = JSON.stringify(entity);
          }
          break;
        case 'text':
          break;
        default:
          throw new Error('The request type ' + type + ' is not supported');
      }

      message.entity(entity, type)
        .mimeType(mimeType);
    }
  }

  /**
   * @inheritDoc
   */
  fromFormat(response, entity, type) {
    if (type == 'json') {
      entity = JSON.parse(entity);
    } else if (type == 'data-url' || type == 'base64') {
      entity = entity.toString('base64');

      if (type == 'data-url') {
        entity = 'data:' + response.headers['content-type'] + ';base64,' + entity;
      }
    } else if (type == 'arraybuffer') {
      entity = entity.buffer.slice(entity.byteOffset, entity.byteOffset + entity.byteLength);
    }

    return entity;
  }
}

Connector.connectors.push(NodeConnector);

module.exports = NodeConnector;