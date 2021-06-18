// eslint-disable-next-line max-classes-per-file
import type {
  Request, RequestBody, RequestBodyType, Response, ResponseBodyType,
} from './Connector';
import { CommunicationError } from '../error';
import { Acl } from '../Acl';
import { TokenStorage } from '../intersection/TokenStorage';

export type RestSpecification = {
  method: string;
  status: number[];
  path: string;
};

export type MessageSpec = {
  status: number[];
  dynamic: boolean;
  method: string;
  path: string[];
  query: string[];
};

/**
 * The progress callback is called, when you send a message to the server and a progress is noticed
 * @param event The Progress Event
 * @return unused
 */
export type ProgressListener = (event: ProgressEvent) => any;

/**
 * Checks whether the user uses a browser which does support revalidation.
 */
// @ts-ignore
const REVALIDATION_SUPPORTED = typeof navigator === 'undefined' || (typeof chrome !== 'undefined' && /google/i.test(navigator.vendor)) || (/cros i686/i.test(navigator.platform));

export const StatusCode = {
  NOT_MODIFIED: 304,
  BAD_CREDENTIALS: 460,
  BUCKET_NOT_FOUND: 461,
  INVALID_PERMISSION_MODIFICATION: 462,
  INVALID_TYPE_VALUE: 463,
  OBJECT_NOT_FOUND: 404,
  OBJECT_OUT_OF_DATE: 412,
  PERMISSION_DENIED: 466,
  QUERY_DISPOSED: 467,
  QUERY_NOT_SUPPORTED: 468,
  SCHEMA_NOT_COMPATIBLE: 469,
  SCHEMA_STILL_EXISTS: 470,
  SYNTAX_ERROR: 471,
  TRANSACTION_INACTIVE: 472,
  TYPE_ALREADY_EXISTS: 473,
  TYPE_STILL_REFERENCED: 474,
  SCRIPT_ABORTION: 475,
};

/**
 * Appends the given query parameters to the url
 * @param url - on which the parameters will be appended
 * @param queryParams - The Query parameters which should be appended
 * @return The URL with the appended parameters
 */
export function appendQueryParams(url: string, queryParams: string | {[key: string]: string | undefined}) {
  const queryString = typeof queryParams === 'string' ? queryParams : Object.entries(queryParams)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
    .join('&');

  if (!queryString) {
    return url;
  }

  const sep = url.indexOf('?') >= 0 ? '&' : '?';
  return url + sep + queryString;
}

export abstract class Message {
  static readonly StatusCode = StatusCode;

  static readonly BINARY = {
    blob: true,
    buffer: true,
    stream: true,
    arraybuffer: true,
    'data-url': true,
    base64: true,
  };

  public withCredentials: boolean = false;

  public progressCallback: null | ProgressListener = null;

  public request: Request;

  private _tokenStorage: TokenStorage | null = null;

  private _responseType: ResponseBodyType | null = null;

  /**
   * Returns the specification of this message
   */
  public get spec(): MessageSpec { return null as any; }

  /**
   * Creates a new message class with the given message specification
   * @return A created message object for the specification
   */
  static create<T>(specification: RestSpecification): T {
    const parts = specification.path.split('?');
    const path = parts[0].split(/[:*]\w*/);

    const query: string[] = [];
    if (parts[1]) {
      parts[1].split('&').forEach((arg) => {
        const part = arg.split('=');
        query.push(part[0]);
      });
    }

    const spec: MessageSpec = {
      path,
      query,
      status: specification.status,
      method: specification.method,
      dynamic: specification.path.indexOf('*') !== -1,
    };

    return class extends Message {
      get spec() {
        return spec;
      }
    } as any as T;
  }

  get isBinary() {
    return (this.request.type && this.request.type in Message.BINARY) || this._responseType!! in Message.BINARY;
  }

  /**
   * @param args The path arguments
   */
  constructor(...args: string[]) {
    let index = 0;
    let path = this.spec.path[0];
    const len = this.spec.path.length;
    for (let i = 1; i < len; i += 1) {
      if (this.spec.dynamic && len - 1 === i) {
        path += args[index].split('/').map(encodeURIComponent).join('/');
      } else {
        path += encodeURIComponent(args[index]) + this.spec.path[i];
      }
      index += 1;
    }

    const queryParams: {[key: string]: string} = {};
    for (let i = 0; i < this.spec.query.length; i += 1) {
      const arg = args[index];
      index += 1;
      if (arg !== undefined && arg !== null) {
        queryParams[this.spec.query[i]] = arg;
      }
    }

    this.request = {
      method: this.spec.method,
      path: appendQueryParams(path, queryParams),
      entity: null,
      headers: {},
    };

    if (args[index]) {
      this.entity(args[index], 'json');
    }

    this.responseType('json');
  }

  /**
   * Gets the tokenStorage which stored credentials are used to authorize this message
   * @return The header value
   */
  tokenStorage(): TokenStorage | null;

  /**
   * Sets the tokenStorage which stored credentials are used to authorize this message
   * @param value The new tokenStorage used to authorize this message
   * @return This message object
   */
  tokenStorage(value: TokenStorage | null): this;

  tokenStorage(value?: TokenStorage | null): this | TokenStorage | null {
    if (value === undefined) {
      return this._tokenStorage;
    }

    this._tokenStorage = value;
    return this;
  }

  /**
   * Gets the request path
   * @return The path of the message value
   */
  path(): string;

  /**
   * Sets the request path
   * @param path The new path value, any query parameters provided with the path will be merged with the
   * exiting query params
   * @return This message object
   */
  path(path: string): this;

  path(path?: string): this | string {
    if (path !== undefined) {
      const queryIndex = this.request.path.indexOf('?') + 1;
      this.request.path = path + (queryIndex > 0 ? (path.indexOf('?') > -1 ? '&' : '?') + this.request.path.substring(queryIndex) : '');
      return this;
    }

    return this.request.path;
  }

  /**
   * Gets the value of a the specified request header
   * @param name The header name
   * @return The header value
   */
  header(name: string): string;

  /**
   * Sets the value of a the specified request header
   * @param name The header name
   * @param value The header value if omitted the value will be returned
   * @return This message object
   */
  header(name: string, value: string | null): this;

  header(name: string, value?: string | null): this | string;

  header(name: string, value?: string | null): this | string {
    if (value === null) {
      delete this.request.headers[name];
      return this;
    }

    if (value !== undefined) {
      this.request.headers[name] = value;
      return this;
    }

    return this.request.headers[name];
  }

  /**
   * Sets the entity type
   * @param data - The data to send
   * @param type - the type of the data one of 'json'|'text'|'blob'|'arraybuffer'
   * defaults detect the type based on the body data
   * @return This message object
   */
  entity(data: RequestBody, type?: RequestBodyType): this {
    let requestType = type;
    if (!requestType) {
      if (typeof data === 'string') {
        if (/^data:(.+?)(;base64)?,.*$/.test(data)) {
          requestType = 'data-url';
        } else {
          requestType = 'text';
        }
      } else if (typeof Blob !== 'undefined' && data instanceof Blob) {
        requestType = 'blob';
      } else if (typeof Buffer !== 'undefined' && data instanceof Buffer) {
        requestType = 'buffer';
      } else if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
        requestType = 'arraybuffer';
      } else if (typeof FormData !== 'undefined' && data instanceof FormData) {
        requestType = 'form';
      } else {
        requestType = 'json';
      }
    }

    this.request.type = requestType;
    this.request.entity = data;
    return this;
  }

  /**
   * Get the mimeType
   * @return This message object
   */
  mimeType(): string;

  /**
   * Sets the mimeType
   * @param mimeType the mimeType of the data
   * @return This message object
   */
  mimeType(mimeType: string | null): this;

  mimeType(mimeType?: string | null): this | string {
    return this.header('content-type', mimeType);
  }

  /**
   * Gets the contentLength
   * @return
   */
  contentLength(): number;

  /**
   * Sets the contentLength
   * @param contentLength the content length of the data
   * @return This message object
   */
  contentLength(contentLength: number): this;

  contentLength(contentLength?: number): this | number {
    if (contentLength !== undefined) {
      return this.header('content-length', `${contentLength}`);
    }
    return Number(this.header('content-length'));
  }

  /**
   * Gets the request conditional If-Match header
   * @return This message object
   */
  ifMatch(): string;

  /**
   * Sets the request conditional If-Match header
   * @param eTag the If-Match ETag value
   * @return This message object
   */
  ifMatch(eTag: string | number | null): this;

  ifMatch(eTag?: string | number | null): this | string {
    return this.header('If-Match', this.formatETag(eTag));
  }

  /**
   * Gets the request a ETag based conditional header
   * @return
   */
  ifNoneMatch(): string;

  /**
   * Sets the request a ETag based conditional header
   * @param eTag The ETag value
   * @return This message object
   */
  ifNoneMatch(eTag: string): this;

  ifNoneMatch(eTag?: string): this | string {
    return this.header('If-None-Match', this.formatETag(eTag));
  }

  /**
   * Gets the request date based conditional header
   * @return
   */
  ifUnmodifiedSince(): string;

  /**
   * Sets the request date based conditional header
   * @param date The date value
   * @return This message object
   */
  ifUnmodifiedSince(date: Date): this;

  ifUnmodifiedSince(date?: Date): this | string {
    // IE 10 returns UTC strings and not an RFC-1123 GMT date string
    return this.header('if-unmodified-since', date && date.toUTCString().replace('UTC', 'GMT'));
  }

  /**
   * Indicates that the request should not be served by a local cache
   * @return
   */
  noCache(): this {
    if (!REVALIDATION_SUPPORTED) {
      this.ifMatch('') // is needed for firefox or safari (but forbidden for chrome)
        .ifNoneMatch('-'); // is needed for edge and ie (but forbidden for chrome)
    }

    return this.cacheControl('max-age=0, no-cache');
  }

  /**
   * Gets the cache control header
   * @return
   */
  cacheControl(): string;

  /**
   * Sets the cache control header
   * @param value The cache control flags
   * @return This message object
   */
  cacheControl(value: string): this;

  cacheControl(value?: string): this | string {
    return this.header('cache-control', value);
  }

  /**
   * Gets the ACL of a file into the Baqend-Acl header
   * @return
   */
  acl(): string;

  /**
   * Sets and encodes the ACL of a file into the Baqend-Acl header
   * @param acl the file ACLs
   * @return This message object
   */
  acl(acl: Acl): this;

  acl(acl?: Acl): this | string {
    return this.header('baqend-acl', acl && JSON.stringify(acl));
  }

  /**
   * Gets and encodes the custom headers of a file into the Baqend-Custom-Headers header
   * @return
   */
  customHeaders(): string;

  /**
   * Sets and encodes the custom headers of a file into the Baqend-Custom-Headers header
   * @param customHeaders the file custom headers
   * @return This message object
   */
  customHeaders(customHeaders: { [headers: string]: string }): this;

  customHeaders(customHeaders?: { [headers: string]: string }): this | string {
    return this.header('baqend-custom-headers', customHeaders && JSON.stringify(customHeaders));
  }

  /**
   * Gets the request accept header
   * @return
   */
  accept(): string;

  /**
   * Sets the request accept header
   * @param accept the accept header value
   * @return This message object
   */
  accept(accept: string): this;

  accept(accept?: string): this | string {
    return this.header('accept', accept);
  }

  /**
   * Gets the response type which should be returned
   * @return This message object
   */
  responseType(): ResponseBodyType | null;

  /**
   * Sets the response type which should be returned
   * @param type The response type one of 'json'|'text'|'blob'|'arraybuffer' defaults to 'json'
   * @return This message object
   */
  responseType(type: ResponseBodyType | null): this;

  responseType(type?: ResponseBodyType | null): this | ResponseBodyType | null {
    if (type !== undefined) {
      this._responseType = type;
      return this;
    }

    return this._responseType;
  }

  /**
   * Gets the progress callback
   * @return The callback set
   */
  progress(): ProgressListener | null;

  /**
   * Sets the progress callback
   * @param callback
   * @return This message object
   */
  progress(callback: ProgressListener | null): this;

  progress(callback?: ProgressListener | null): this | ProgressListener | null {
    if (callback !== undefined) {
      this.progressCallback = callback;
      return this;
    }

    return this.progressCallback;
  }

  /**
   * Adds the given string to the request path
   *
   * If the parameter is an object, it will be serialized as a query string.
   *
   * @param query which will added to the request path
   * @return
   */
  addQueryString(query: string | { [key: string]: string}): this {
    this.request.path = appendQueryParams(this.request.path, query);
    return this;
  }

  formatETag(eTag?: string | number | null): string | undefined | null {
    if (eTag === null || eTag === undefined || eTag === '*') {
      return eTag;
    }

    let tag = `${eTag}`;
    if (tag.indexOf('"') === -1) {
      tag = `"${tag}"`;
    }
    return tag;
  }

  /**
   * Handle the receive
   * @param response The received response headers and data
   * @return
   */
  doReceive(response: Response) {
    if (this.spec.status.indexOf(response.status) === -1) {
      throw new CommunicationError(this, response);
    }
  }
}

export class OAuthMessage extends Message {
  get spec() {
    return {
      method: 'OAUTH',
      dynamic: false,
      path: [''],
      query: [],
      status: [200],
    };
  }
}
