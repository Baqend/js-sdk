/* this connector will only be choose in browser compatible environments */
/* eslint no-restricted-globals: ["off", "addEventListener", "removeEventListener"] */

import {
  Connector, Receiver, Request, Response, ResponseBodyType,
} from './Connector';
import { atob } from '../util';
import { Message } from './Message';

export class XMLHttpConnector extends Connector {
  private oAuthHandle?: (msg: Response) => void;

  /**
   * @inheritDoc
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static isUsable(host: string, port: number, secure: boolean, basePath: string) {
    return typeof XMLHttpRequest !== 'undefined';
  }

  /**
   * @inheritDoc
   */
  doSend(message: Message, request: Request, receive: Receiver) {
    if (request.method === 'OAUTH') {
      if (this.oAuthHandle) {
        this.oAuthHandle({ status: 409, headers: {}, entity: '{"message": "A new OAuth request was sent."}' });
      }

      localStorage.removeItem('oauth-response');

      const handler = (event: StorageEvent) => {
        if (event.key === 'oauth-response' && this.oAuthHandle && event.newValue) {
          this.oAuthHandle(JSON.parse(event.newValue));
        }
      };

      this.oAuthHandle = (msg: Response) => {
        receive(msg);
        localStorage.removeItem('oauth-response');
        removeEventListener('storage', handler, false);
      };

      addEventListener('storage', handler, false);
      return;
    }

    const xhr = new XMLHttpRequest();
    const url = this.origin + this.basePath + request.path;
    xhr.onreadystatechange = () => {
      // if we receive an error switch the response type to json
      if (xhr.readyState === 2) {
        if (xhr.responseType && xhr.status >= 400) {
          xhr.responseType = 'text';
        }

        if (xhr.status === 226) {
          xhr.responseType = 'arraybuffer';
        }
      }

      if (xhr.readyState === 4) {
        const response: Response = {
          headers: {},
          status: xhr.status,
          entity: xhr.response || xhr.responseText,
        };

        Connector.RESPONSE_HEADERS.forEach((name) => {
          response.headers[name] = xhr.getResponseHeader(name.toLowerCase()) || '';
        });

        receive(response);
      }
    };

    // Set the message progress callback
    if (xhr.upload && message.progress()) {
      xhr.upload.onprogress = message.progress();
    }

    xhr.open(request.method, url, true);

    const { entity } = request;
    const { headers } = request;

    const headerNames = Object.keys(headers);
    for (let i = 0, len = headerNames.length; i < len; i += 1) {
      const headerName = headerNames[i];
      xhr.setRequestHeader(headerName, headers[headerName]);
    }

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
      default:
        // ignore
    }

    xhr.send(entity);
  }

  /**
   * @inheritDoc
   */
  fromFormat(response: Response, entity: any, type: ResponseBodyType | null) {
    if (type === 'json') {
      return JSON.parse(entity);
    }

    if (type === 'data-url' || type === 'base64') {
      const reader = new FileReader();
      reader.readAsDataURL(entity);

      return new Promise((resolve, reject) => {
        reader.onload = resolve;
        reader.onerror = reject;
      }).then(() => {
        let { result } = reader;

        if (type === 'base64' && typeof result === 'string') {
          result = result.substring(result.indexOf(',') + 1);
        }

        return result;
      });
    }

    return entity;
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
        case 'blob':
          mimeType = mimeType || entity.type;
          break;
        case 'arraybuffer':
        case 'form':
          break;
        case 'data-url': {
          const match = entity.match(/^data:(.+?)(;base64)?,(.*)$/);
          const isBase64 = match[2];
          // eslint-disable-next-line prefer-destructuring
          entity = match[3];

          type = 'blob';
          mimeType = mimeType || match[1];
          if (!isBase64) {
            entity = decodeURIComponent(entity);
            break;
          }
        }
        // fallthrough
        case 'base64': {
          const binaryStr = atob(entity);
          const len = binaryStr.length;
          const array = new Uint8Array(len);
          for (let i = 0; i < len; i += 1) {
            array[i] = binaryStr.charCodeAt(i);
          }
          type = 'blob';
          entity = new Blob([array], { type: mimeType });
          break;
        }
        case 'json':
          if (typeof entity !== 'string') {
            entity = JSON.stringify(entity);
          }
          break;
        case 'text':
          break;
        default:
          throw new Error(`Supported request format:${type}`);
      }

      message.entity(entity, type).mimeType(mimeType);
    }
  }
}

Connector.connectors.push(XMLHttpConnector);
