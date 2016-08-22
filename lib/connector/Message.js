"use strict";

var CommunicationError = require('../error/CommunicationError');

/**
 * Checks whether the user uses google chrome.
 */
const isChrome = typeof window != 'undefined' && ((!!window.chrome && /google/i.test(navigator.vendor)) || (/cros i686/i.test(window.navigator.platform)));

/**
 * @alias connector.Message
 */
class Message {
  /**
   * Creates a new message class with the given message specification
   * @param {Object} specification
   * @return {Class<Message>}
   */
  static create(specification) {
    var parts = specification.path.split('?');
    var path = parts[0].split(/[:\*]\w*/);

    var query = [];
    if (parts[1]) {
      parts[1].split('&').forEach(function(arg) {
        var part = arg.split('=');
        query.push(part[0]);
      });
    }

    specification.dynamic = specification.path.indexOf('*') != -1;
    specification.path = path;
    specification.query = query;

    return class extends Message {
      get spec() {
        return specification;
      }
    };
  }

  /**
   * Creates a new message class with the given message specification and a full path
   * @param {Object} specification
   * @param {Object} members additional members applied to the created message
   * @return {Class<Message>}
   */
  static createExternal(specification, members) {
    specification.path = [specification.path];

    /**
     * @ignore
     */
    const cls = class extends Message {
      get spec() {
        return specification;
      }
    };

    Object.assign(cls.prototype, members);

    return cls;
  }

  get isBinary() {
    return this.request.type in Message.BINARY || this._responseType in Message.BINARY;
  }

  /**
   * @param {string} arguments... The path arguments
   */
  constructor() {
    /** @type boolean */
    this.withCredentials = false;

    /** @type util.TokenStorage */
    this.tokenStorage = null;

    var args = arguments;
    var index = 0;
    var path = this.spec.path;
    if (Object(path) instanceof Array) {
      path = this.spec.path[0];
      let len = this.spec.path.length;
      for (let i = 1; i < len; ++i) {
        if (this.spec.dynamic && len - 1 == i) {
          path += args[index++].split('/').map(encodeURIComponent).join('/');
        } else {
          path += encodeURIComponent(args[index++]) + this.spec.path[i];
        }
      }
    }

    var query = "";
    for (let i = 0; i < this.spec.query.length; ++i) {
      let arg = args[index++];
      if (arg !== undefined && arg !== null) {
        query += (query || ~path.indexOf("?"))? "&": "?";
        query += this.spec.query[i] + '=' + encodeURIComponent(arg);
      }
    }

    this.request = {
      method: this.spec.method,
      path: path + query,
      entity: null,
      headers: {}
    };

    if (args[index]) {
      this.entity(args[index], 'json');
    }
    
    this.responseType('json');
  }

  /**
   * Get/Sets the value of a the specified request header
   * @param {string} name The header name
   * @param {string=} value The header value if omitted the value will be returned
   * @return {connector.Message|string} This message object
   */
  header(name, value) {
    if (value !== undefined) {
      this.request.headers[name] = value;
      return this;
    } else {
      return this.request.headers[name];
    }
  }

  /**
   * sets the entity type
   * @param {any} data The data to send
   * @param {string} [type="json"] the type of the data one of 'json'|'text'|'blob'|'arraybuffer' defaults to 'json'
   * @return {connector.Message} This message object
   */
  entity(data, type) {
    if (!type) {
      if (typeof data === 'string') {
        if (/^data:(.+?)(;base64)?,.*$/.test(data)) {
          type = 'data-url';
        } else {
          type = 'text';
        }
      } else if (typeof Blob != 'undefined' && data instanceof Blob) {
        type = 'blob';
      } else if (typeof Buffer != 'undefined' && data instanceof Buffer) {
        type = 'buffer';
      } else if (typeof ArrayBuffer != 'undefined' && data instanceof ArrayBuffer) {
        type = 'arraybuffer';
      } else if (typeof FormData != 'undefined' && data instanceof FormData) {
        type = 'form';
      } else {
        type = 'json';
      }
    }

    this.request.type = type;
    this.request.entity = data;
    return this;
  }
    
  /**
   * Get/Sets the mimeType
   * @param {string=} mimeType the mimeType of the data
   * @return {connector.Message} This message object
   */
  mimeType(mimeType) {
    return this.header('content-type', mimeType);
  }

  /**
   * Get/Sets the contentLength
   * @param {number=} contentLength the content length of the data
   * @return {connector.Message} This message object
   */
  contentLength(contentLength) {
    return this.header('content-length', contentLength);
  }

  /**
   * Get/Sets the request conditional If-Match header
   * @param {string=} eTag the If-Match ETag value
   * @return {connector.Message} This message object
   */
  ifMatch(eTag) {
    return this.header('If-Match', this._formatETag(eTag));
  }

  /**
   * Get/Sets the request a ETag based conditional header
   * @param {string=} eTag The ETag value
   * @return {connector.Message} This message object
   */
  ifNoneMatch(eTag) {
    return this.header('If-None-Match', this._formatETag(eTag));
  }

  /**
   * Get/Sets the request date based conditional header
   * @param {Date=} date The date value
   * @return {connector.Message} This message object
   */
  ifUnmodifiedSince(date) {
    //IE 10 returns UTC strings and not an RFC-1123 GMT date string
    return this.header('if-unmodified-since', date && date.toUTCString().replace('UTC','GMT'));
  }

  /**
   * Indicates that the request should not be served by a local cache
   */
  noCache() {
    if (!isChrome) {
      this.ifMatch('') // is needed for firefox or safari (but forbidden for chrome)
          .ifNoneMatch('-'); // is needed for edge and ie (but forbidden for chrome)
    }

    return this.cacheControl('max-age=0, no-cache');
  }

  /**
   * Get/Sets the cache control header
   * @param {string=} value The cache control flags
   * @return {connector.Message} This message object
   */
  cacheControl(value) {
    return this.header('cache-control', value);
  }
  
  /**
   * Get/Sets and encodes the acl of a file into the Baqend-Acl header
   * @param {Acl=} acl the file acls
   * @return {connector.Message} This message object
   */
  acl(acl) {
    return this.header('baqend-acl', acl && JSON.stringify(acl));
  }

  /**
   * Get/Sets the request accept header
   * @param {string=} accept the accept header value
   * @return {connector.Message} This message object
   */
  accept(accept) {
    return this.header('accept', accept);
  }

  /**
   * Get/Sets the response type which should be returned
   * @param {string=} type The response type one of 'json'|'text'|'blob'|'arraybuffer' defaults to 'json'
   * @return {connector.Message} This message object
   */
  responseType(type) {
    if (type !== undefined) {
      this._responseType = type;
      return this;
    } else {
      return this._responseType;
    }
  }

  /**
   * Adds the given String to the request path.
   * If the parameter is an object the query string will be created.
   *
   * @param {string|Object} query which will added to the request path
   */
  addQueryString(query) {
    if(Object(query) instanceof String) {
      this.request.path += query;
    } else if(query) {
      var sep = ~this.request.path.indexOf("?")? "&": "?";
      Object.keys(query).forEach((key, i) => {
        this.request.path += sep + key + "=" + encodeURIComponent(query[key]);
        if(i == 0) {
          sep = "&";
        }
      });
    }
    return this;
  }

  _formatETag(eTag) {
    if (eTag && eTag != '*') {
      eTag = '' + eTag;
      if (eTag.indexOf('"') == -1)
        eTag = '"' + eTag + '"';
    }

    return eTag;
  }

  /**
   * Handle the receive
   * @param {Object} response The received response headers and data
   */
  doReceive(response) {
    if (this.spec.status.indexOf(response.status) == -1) {
      throw new CommunicationError(this, response);
    }
  }
}

/**
 * The message specification
 * @name spec
 * @memberOf connector.Message.prototype
 * @type {Object}
 */

Object.assign(Message, {
  /**
   * @alias connector.Message.StatusCode
   * @enum {number}
   */
  StatusCode: {
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
    SCRIPT_ABORTION: 475
  },

  BINARY: {
    blob: true,
    buffer: true,
    stream: true,
    arraybuffer: true,
    'data-url': true,
    'base64': true
  },

  GoogleOAuth: Message.createExternal({
    method: 'OAUTH',
    path: 'https://accounts.google.com/o/oauth2/auth?response_type=code&access_type=online',
    query: ["client_id", "scope", "state"],
    status: [200]
  }, {
    addRedirectOrigin(baseUri) {
      this.addQueryString({
        redirect_uri: baseUri + '/db/User/OAuth/google'
      });
    }
  }),

  FacebookOAuth: Message.createExternal({
    method: 'OAUTH',
    path: 'https://www.facebook.com/dialog/oauth?response_type=code',
    query: ["client_id", "scope", "state"],
    status: [200]
  }, {
    addRedirectOrigin(baseUri) {
      this.addQueryString({
        redirect_uri: baseUri + '/db/User/OAuth/facebook'
      });
    }
  }),

  GitHubOAuth: Message.createExternal({
    method: 'OAUTH',
    path: 'https://github.com/login/oauth/authorize?response_type=code&access_type=online',
    query: ["client_id", "scope", "state"],
    status: [200]
  }, {
    addRedirectOrigin(baseUri) {
      this.addQueryString({
        redirect_uri: baseUri + '/db/User/OAuth/github'
      });
    }
  }),

  LinkedInOAuth: Message.createExternal({
    method: 'OAUTH',
    path: 'https://www.linkedin.com/uas/oauth2/authorization?response_type=code&access_type=online',
    query: ["client_id", "scope", "state"],
    status: [200]
  }, {
    addRedirectOrigin(baseUri) {
      this.addQueryString({
        redirect_uri: baseUri + '/db/User/OAuth/linkedin'
      });
    }
  }),

  TwitterOAuth: Message.createExternal({
    method: 'OAUTH',
    path: '',
    query: [],
    status: [200]
  }, {
    addRedirectOrigin(baseUri) {
      this.request.path = baseUri + '/db/User/OAuth1/twitter';
    }
  })
});

module.exports = Message;