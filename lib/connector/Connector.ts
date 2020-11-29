/* eslint-disable no-restricted-globals */

import { PersistentError } from '../error';
import { Message } from './Message';
import { Json, JsonMap, Class } from '../util';

export type Receiver = (response: Response) => void;
export type RequestBody = string | Blob | Buffer | ArrayBuffer | FormData | Json;
export type RequestBodyType = 'json'|'text'|'blob'|'buffer'|'arraybuffer'|'data-url'|'base64'|'form'|'stream';
export type ResponseBodyType = 'json'|'text'|'blob'|'arraybuffer'|'data-url'|'base64'|'stream';
export type Request = {
  method: string, path: string, type?: RequestBodyType, entity?: any, headers: {[headerName: string]: string}
};
export type Response = { status: number, headers: {[headerName: string]: string}, entity?: any, error?: Error};

export abstract class Connector {
  static readonly DEFAULT_BASE_PATH = '/v1';

  static readonly HTTP_DOMAIN = '.app.baqend.com';

  /**
   * An array of all exposed response headers
   */
  static readonly RESPONSE_HEADERS = [
    'baqend-authorization-token',
    'content-type',
    'baqend-size',
    'baqend-acl',
    'etag',
    'last-modified',
    'baqend-created-at',
    'baqend-custom-headers',
  ];

  /**
   * Array of all available connector implementations
   */
  static readonly connectors: (Class<Connector> & typeof Connector)[] = [];

  /**
   * Array of all created connections
   */
  static readonly connections: {[origin: string]: Connector} = {};

  /**
   * Indicates id this connector is usable in the current runtime environment
   * This method must be overwritten in subclass implementations
   * @param host - the host to connect to
   * @param port - the port to connect to
   * @param secure - <code>true</code> for an secure connection
   * @param basePath - The base path of the api endpoint
   * @return <code>true</code> if this connector is usable in the current environment
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static isUsable(host: string, port: number, secure: boolean, basePath: string): boolean {
    return false;
  }

  /**
   * @param host or location
   * @param port
   * @param secure=true <code>true</code> for an secure connection
   * @param basePath The basepath of the api
   * @return
   */
  static create(host: string, port?: number, secure?: boolean, basePath?: string): Connector {
    let h = host;
    let p = port;
    let s = secure;
    let b = basePath;

    if (typeof location !== 'undefined') {
      if (!h) {
        h = location.hostname;
        p = Number(location.port);
      }

      if (s === undefined) {
        s = location.protocol === 'https:';
      }
    }

    // ensure right type, make secure: true the default
    s = s === undefined || !!s;
    if (b === undefined) {
      b = Connector.DEFAULT_BASE_PATH;
    }

    if (h.indexOf('/') !== -1) {
      const matches = /^(https?):\/\/([^/:]+|\[[^\]]+])(:(\d*))?(\/\w+)?\/?$/.exec(h);
      if (matches) {
        s = matches[1] === 'https';
        h = matches[2].replace(/(\[|])/g, '');
        p = Number(matches[4]);
        b = matches[5] || '';
      } else {
        throw new Error(`The connection uri host ${h} seems not to be valid`);
      }
    } else if (h !== 'localhost' && /^[a-z0-9-]*$/.test(h)) {
      // handle app names as hostname
      h += Connector.HTTP_DOMAIN;
    }

    if (!p) {
      p = s ? 443 : 80;
    }

    const url = Connector.toUri(h, p, s, b);
    let connection = this.connections[url];

    if (!connection) {
      // check last registered connector first to simplify registering connectors
      for (let i = this.connectors.length - 1; i >= 0; i -= 1) {
        const ConnectorConstructor = this.connectors[i];
        if (ConnectorConstructor.isUsable && ConnectorConstructor.isUsable(h, p, s, b)) {
          connection = new ConnectorConstructor(h, p, s, b);
          break;
        }
      }

      if (!connection) {
        throw new Error('No connector is usable for the requested connection.');
      }

      this.connections[url] = connection;
    }

    return connection;
  }

  static toUri(host: string, port: number, secure: boolean, basePath: string) {
    let uri = (secure ? 'https://' : 'http://') + (host.indexOf(':') !== -1 ? `[${host}]` : host);
    uri += ((secure && port !== 443) || (!secure && port !== 80)) ? `:${port}` : '';
    uri += basePath;
    return uri;
  }

  /**
   * the origin do not contains the base path
   */
  public readonly origin: string = Connector.toUri(this.host, this.port, this.secure, '');

  /**
   * The connector will detect if gzip is supported.
   * Returns true if supported otherwise false.
   */
  public gzip: boolean = false;

  /**
   * @param host - the host to connect to
   * @param port - the port to connect to
   * @param secure - <code>true</code> for an secure connection
   * @param basePath - The base path of the api endpoint
   */
  constructor(
    public readonly host: string,
    public readonly port: number,
    public readonly secure: boolean,
    public readonly basePath: string,
  ) {}

  /**
   * @param message
   * @return
   */
  send(message: Message): Promise<Response> {
    let response: Response = { status: 0, headers: {} };
    return Promise.resolve()
      .then(() => this.prepareRequest(message))
      .then(() => new Promise<Response>((resolve) => {
        this.doSend(message, message.request, resolve);
      }))
      .then((res) => { response = res; })
      .then(() => this.prepareResponse(message, response))
      .then(() => {
        message.doReceive(response);
        return response;
      })
      .catch((e) => {
        response.entity = null;
        throw PersistentError.of(e);
      });
  }

  /**
   * Handle the actual message send
   * @param message
   * @param request
   * @param receive
   */
  abstract doSend(message: Message, request: Request, receive: Receiver): void;

  /**
   * @param message
   * @return
   */
  prepareRequest(message: Message): Promise<Message> | Message {
    const mimeType = message.mimeType();
    if (!mimeType) {
      const { type } = message.request;
      if (type === 'json') {
        message.mimeType('application/json;charset=utf-8');
      } else if (type === 'text') {
        message.mimeType('text/plain;charset=utf-8');
      }
    }

    this.toFormat(message);

    let accept;
    switch (message.responseType()) {
      case 'json':
        accept = 'application/json';
        break;
      case 'text':
        accept = 'text/*';
        break;
      default:
        accept = 'application/json,text/*;q=0.5,*/*;q=0.1';
    }

    if (!message.accept()) {
      message.accept(accept);
    }

    if (this.gzip) {
      const ifNoneMatch = message.ifNoneMatch();
      if (ifNoneMatch && ifNoneMatch !== '""' && ifNoneMatch !== '*') {
        message.ifNoneMatch(`${ifNoneMatch.slice(0, -1)}--gzip"`);
      }
    }

    const tokenStorage = message.tokenStorage();
    if (message.request.path === '/connect') {
      return tokenStorage!.signPath(this.basePath + message.request.path)
        .then((signedPath) => {
          // eslint-disable-next-line no-param-reassign
          message.request.path = signedPath.substring(this.basePath.length);

          if (message.cacheControl()) {
            // eslint-disable-next-line no-param-reassign
            message.request.path += `${message.request.path.indexOf('?') !== -1 ? '&' : '?'}BCB`;
          }

          return message;
        });
    }

    if (tokenStorage) {
      const { token } = tokenStorage;
      if (token) {
        message.header('authorization', `BAT ${token}`);
      }
    }

    return message;
  }

  /**
   * Convert the message entity to the sendable representation
   * @param message The message to send
   * @return
   */
  protected abstract toFormat(message: Message): void;

  /**
   * @param message
   * @param response The received response headers and data
   * @return
   */
  prepareResponse(message: Message, response: Response): Promise<any> {
    // IE9 returns status code 1223 instead of 204
    response.status = response.status === 1223 ? 204 : response.status;

    let type: ResponseBodyType | null;
    const headers = response.headers || {};
    // some proxies send content back on 204 responses
    const entity = response.status === 204 ? null : response.entity;

    if (entity) {
      type = message.responseType();
      if (!type || response.status >= 400) {
        const contentType = headers['content-type'] || headers['Content-Type'];
        if (contentType && contentType.indexOf('application/json') > -1) {
          type = 'json';
        }
      }
    }

    if (headers.etag) {
      headers.etag = headers.etag.replace('--gzip', '');
    }

    const tokenStorage = message.tokenStorage();
    if (tokenStorage) {
      const token = headers['baqend-authorization-token'] || headers['Baqend-Authorization-Token'];
      if (token) {
        tokenStorage.update(token);
      }
    }

    return new Promise((resolve) => {
      resolve(entity && this.fromFormat(response, entity, type));
    }).then((resultEntity) => {
      response.entity = resultEntity;

      if (message.request.path.indexOf('/connect') !== -1 && resultEntity) {
        this.gzip = !!(resultEntity as JsonMap).gzip;
      }
    }, (e) => {
      throw new Error(`Response was not valid ${type}: ${e.message}`);
    });
  }

  /**
   * Convert received data to the requested response entity type
   * @param response The response object
   * @param entity The received data
   * @param type The requested response format
   * @return
   */
  protected abstract fromFormat(response: Response, entity: any, type: ResponseBodyType | null): any;
}
