import {
  Connector, Request, Response, ResponseBodyType,
} from './Connector';
import { Message } from './Message';

export class FetchConnector extends Connector {
  /**
   * Indicates if this connector implementation is usable for the given host and port
   * @return
   */
  static isUsable(): boolean {
    return typeof fetch !== 'undefined';
  }

  /**
   * @inheritDoc
   */
  doSend(message: Message, request: Request, receive: (response: Response) => void) {
    const url = this.origin + this.basePath + request.path;
    const { method } = request;
    const { headers } = request;
    const { entity } = request;
    const credentials = message.withCredentials ? 'include' : 'same-origin';

    return fetch(url, {
      method,
      headers,
      body: entity,
      credentials,
    }).then((res) => {
      const responseHeaders: { [headerName: string]: string } = {};
      Connector.RESPONSE_HEADERS.forEach((name) => {
        responseHeaders[name] = res.headers.get ? res.headers.get(name) : (res.headers as any)[name];
      });

      const response: Response = {
        headers: responseHeaders,
        status: res.status,
        entity: res,
      };

      receive(response);
    });
  }

  /**
   * @inheritDoc
   */
  fromFormat(response: Response, rawEntity: any, type: ResponseBodyType | null) {
    if (type === 'json') {
      return rawEntity.json();
    } if (type === 'blob') {
      return rawEntity.blob();
    } if (type === 'data-url' || type === 'base64') {
      return rawEntity.blob().then((entity: Blob) => {
        const reader = new FileReader();
        reader.readAsDataURL(entity);
        return new Promise((resolve, reject) => {
          reader.onload = resolve;
          reader.onerror = reject;
        }).then(() => {
          let result = reader.result as string;
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
        } // fallthrough
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
        case 'json': {
          if (typeof entity !== 'string') {
            entity = JSON.stringify(entity);
          }
          break;
        }
        case 'text':
          break;
        default:
          throw new Error(`Supported request format:${type}`);
      }

      message.entity(entity, type).mimeType(mimeType);
    }
  }
}

Connector.connectors.push(FetchConnector);
