'use strict';

import { Connector } from "./Connector";
import { PersistentError } from "../error";

let http;
let https;

export class NodeConnector extends Connector {
  private cookie: null;
  private http: any;

  static isUsable() {
    if (!http) {
      try {
        // the require call will fail, if we can't require the http module,
        // therefore this connector implementation can't be used
        /* eslint-disable global-require */
        https = import('https');
        http = import('http');
        /* eslint-enable global-require */
      } catch (e) {
        // ignore
      }
    }
    // prevent using when it is shimmed
    return http && http.Server;
  }

  constructor(host, port, secure, basePath) {
    super(host, port, secure, basePath);
    this.cookie = null;
    this.http = secure ? https : http;
  }

  /**
   * @inheritDoc
   */
  doSend(message, request, receive) {
    request.host = this.host;
    request.port = this.port;
    request.path = this.basePath + request.path;

    const entity = request.entity;
    const type = request.type;
    let responseType = message.responseType();

    if (this.cookie && message.withCredentials) {
      request.headers.cookie = this.cookie;
    }

    const req = this.http.request(request, (res) => {
      const cookie = res.headers['set-cookie'];
      if (cookie) {
        // cookie may be an array, convert it to a string
        this.cookie = this.parseCookie(cookie + '');
      }

      const status = res.statusCode;
      if (status >= 400) {
        responseType = 'json';
      }

      if (responseType === 'stream') {
        receive({
          status,
          headers: res.headers,
          entity: res,
        });
        return;
      }

      const binary = responseType && responseType !== 'text' && responseType !== 'json';
      const chunks: (Buffer | string)[] = [];
      if (!binary) {
        res.setEncoding('utf-8');
      }

      res.on('data', (chunk: Buffer | string) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        receive({
          status,
          headers: res.headers,
          entity: binary ? Buffer.concat(chunks as Buffer[]) : chunks.join(''),
        });
      });
    });

    req.on('error', (e) => {
      receive({
        status: 0,
        error: e,
      });
    });

    if (type === 'stream') {
      entity.pipe(req);
    } else if (type === 'buffer') {
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
   * @return {(string|null)}
   */
  parseCookie(header) {
    const parts = header.split(';');

    for (let i = 0, len = parts.length; i < len; i += 1) {
      const part = parts[i];
      if (part.trim().indexOf('Expires=') === 0) {
        const date = Date.parse(part.substring(8));
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
          entity = Buffer.from(entity);
          break;
        case 'data-url': {
          const match = entity.match(/^data:(.+?)(;base64)?,(.*)$/);
          const isBase64 = match[2];
          entity = match[3];

          type = 'buffer';
          mimeType = mimeType || match[1];
          if (isBase64) {
            entity = Buffer.from(entity, 'base64');
          } else {
            entity = Buffer.from(decodeURIComponent(entity), 'utf8');
          }

          break;
        }
        case 'base64':
          type = 'buffer';
          entity = Buffer.from(entity, 'base64');
          break;
        case 'json':
          if (typeof entity !== 'string') {
            entity = JSON.stringify(entity);
          }
          break;
        case 'text':
          break;
        default:
          throw new Error('The request type ' + type + ' is not supported');
      }

      message.entity(entity, type).mimeType(mimeType);
    }
  }

  /**
   * @inheritDoc
   */
  fromFormat(response, entity, type) {
    switch (type) {
      case 'json':
        return JSON.parse(entity);
      case 'data-url':
      case 'base64': {
        const base64 = entity.toString('base64');
        if (type === 'base64') {
          return base64;
        }

        return 'data:' + response.headers['content-type'] + ';base64,' + base64;
      }
      case 'arraybuffer':
        return entity.buffer.slice(entity.byteOffset, entity.byteOffset + entity.byteLength);
      default:
        return entity;
    }
  }
}

Connector.connectors.push(NodeConnector);
