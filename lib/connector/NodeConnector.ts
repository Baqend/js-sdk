import https from 'https';
import http from 'http';
import {
  Connector, Request, Response, ResponseBodyType,
} from './Connector';
import { PersistentError } from '../error';

import { Message } from './Message';

export class NodeConnector extends Connector {
  private cookie: string | null;

  private http: any;

  static isUsable() {
    // prevent using when it is shimmed
    return !!(http && http.Server);
  }

  constructor(host: string, port: number, secure: boolean, basePath: string) {
    super(host, port, secure, basePath);
    this.cookie = null;
    this.http = secure ? https : http;
  }

  /**
   * @inheritDoc
   */
  doSend(message: Message, request: Request, receive: (response: Response) => void) {
    const { entity } = request;
    const { type } = request;
    let responseType = message.responseType();

    if (this.cookie && message.withCredentials) {
      request.headers.cookie = this.cookie;
    }

    const nodeRequest = {
      ...request, host: this.host, port: this.port, path: this.basePath + request.path,
    };
    const req = this.http.request(nodeRequest, (res: http.IncomingMessage) => {
      const cookie = res.headers['set-cookie'];
      if (cookie) {
        // cookie may be an array, convert it to a string
        this.cookie = this.parseCookie(`${cookie}`);
      }

      const status = res.statusCode || 0;
      if (status >= 400) {
        responseType = 'json';
      }

      if (responseType === 'stream') {
        receive({
          status,
          headers: res.headers as {[headerName: string]: string},
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
          headers: res.headers as {[headerName: string]: string},
          entity: binary ? Buffer.concat(chunks as Buffer[]) : chunks.join(''),
        });
      });
    });

    req.on('error', (e: Error) => {
      receive({
        status: 0,
        headers: {},
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
   * @param header
   * @return
   */
  parseCookie(header: string): string | null {
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
  toFormat(message: Message) {
    let { type } = message.request;

    if (type) {
      let { entity } = message.request;
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
          // eslint-disable-next-line prefer-destructuring
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
          throw new Error(`The request type ${type} is not supported`);
      }

      message.entity(entity, type).mimeType(mimeType);
    }
  }

  /**
   * @inheritDoc
   */
  fromFormat(response: Response, entity: any, type: ResponseBodyType | null) {
    switch (type) {
      case 'json':
        return JSON.parse(entity);
      case 'data-url':
      case 'base64': {
        const base64 = entity.toString('base64');
        if (type === 'base64') {
          return base64;
        }

        return `data:${response.headers['content-type']};base64,${base64}`;
      }
      case 'arraybuffer':
        return entity.buffer.slice(entity.byteOffset, entity.byteOffset + entity.byteLength);
      default:
        return entity;
    }
  }
}

Connector.connectors.push(NodeConnector);
