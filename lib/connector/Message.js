"use strict";

var CommunicationError = require('../error/CommunicationError');

/**
 * @class baqend.connector.Message
 *
 * @param {String} arguments... The path arguments
 */
class Message {
  /**
   * Creates a new message class with the given message specification
   * @param {object} specification
   * @return {Function}
   */
  static create(specification) {
    var parts = specification.path.split('?');
    var path = parts[0].split(/:\w*/);
    var query = [];
    if (parts[1]) {
      parts[1].split('&').forEach(function(arg) {
        var part = arg.split('=');
        query.push(part[0]);
      });
    }

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
   * @param {object} specification
   * @return {Function}
   */
  static createExternal(specification, query) {
    specification.path = [specification.path];

    return class extends Message {
      get spec() {
        return specification;
      }
    };
  }

  constructor() {
    /** @type boolean */
    this.withCredentials = false;

    var args = arguments;
    var index = 0;
    var path = this.spec.path;
    if (Object(path) instanceof Array) {
      path = this.spec.path[0];
      for (var i = 1; i < this.spec.path.length; ++i) {
        path += encodeURIComponent(args[index++]) + this.spec.path[i];
      }
    }

    var query = "";
    for (var i = 0; i < this.spec.query.length; ++i) {
      var arg = args[index++];
      if (arg !== undefined && arg !== null) {
        query += (query || ~path.indexOf("?"))? "&": "?";
        query += this.spec.query[i] + '=' + encodeURIComponent(arg);
      }
    }

    this.request = {
      method: this.spec.method,
      path: path + query,
      headers: {
        'accept': 'application/json, text/*;q=0.1'
      },
      entity: args[index] || null
    };

    this.response = {
      status: 0,
      headers: {},
      entity: null
    };
  }

  setIfMatch(value) {
    if (value != '*')
      value = '"' + value + '"';

    this.request.headers['If-Match'] = value;
  }

  setIfNoneMatch(value) {
    if (value != '*')
      value = '"' + value + '"';

    this.request.headers['If-None-Match'] = value;
  }

  setCacheControl(value) {
    this.request.headers['Cache-Control'] = value;
  }

  getAuthorizationToken() {
    return this.response.headers['Baqend-Authorization-Token'] || this.response.headers['baqend-authorization-token'];
  }

  setAuthorizationToken(value) {
    this.request.headers['Authorization'] = 'BAT ' + value;
  }

  /**
   * @param {String=} value
   */
  withAuthorizationToken(value) {
    if(value) {
      this.setAuthorizationToken(value);
    } else {
      this.request.withCredentials = true;
    }
  }

  /**
   * Adds the given String to the request path.
   * If the parameter is an object the query string will be created.
   *
   * @param {String|Object} query which will added to the request path
   */
  addQueryString(query) {
    if(Object(query) instanceof String) {
      this.request.path += query;
    } else if(query) {
      var sep = ~this.request.path.indexOf("?")? "&": "?";
      Object.keys(query).forEach(function(key, i) {
        this.request.path += sep + key + "=" + encodeURIComponent(query[key]);
        if(i == 0) {
          sep = "&";
        }
      }.bind(this));
    }
  }

  /**
   * Handle the receive
   */
  doReceive() {
    if (this.spec.status.indexOf(this.response.status) == -1) {
      throw new CommunicationError(this);
    }
  }
}

/**
 * The message specification
 * @name spec
 * @memberOf baqend.connector.Message.prototype
 * @type {Object}
 */
Message.prototype.spec = null;

/**
 * @enum {number}
 */
Message.StatusCode = {
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
};

Message.GoogleOAuth = Message.createExternal({
  method: 'OAUTH',
  path: 'https://accounts.google.com/o/oauth2/auth?response_type=code&access_type=online',
  query: ["client_id", "scope", "state"],
  status: [200]
});

Message.GoogleOAuth.prototype.addRedirectOrigin = function(baseUri) {
  this.addQueryString({
    redirect_uri: baseUri + '/db/User/OAuth/google'
  });
};

Message.FacebookOAuth = Message.createExternal({
  method: 'OAUTH',
  path: 'https://www.facebook.com/dialog/oauth?response_type=code',
  query: ["client_id", "scope", "state"],
  status: [200]
});

Message.FacebookOAuth.prototype.addRedirectOrigin = function(baseUri) {
  this.addQueryString({
    redirect_uri: baseUri + '/db/User/OAuth/facebook'
  });
};

Message.GitHubOAuth = Message.createExternal({
  method: 'OAUTH',
  path: 'https://github.com/login/oauth/authorize?response_type=code&access_type=online',
  query: ["client_id", "scope", "state"],
  status: [200]
});

Message.GitHubOAuth.prototype.addRedirectOrigin = function(baseUri) {
  this.addQueryString({
    redirect_uri: baseUri + '/db/User/OAuth/github'
  });
};

Message.LinkedInOAuth = Message.createExternal({
  method: 'OAUTH',
  path: 'https://www.linkedin.com/uas/oauth2/authorization?response_type=code&access_type=online',
  query: ["client_id", "scope", "state"],
  status: [200]
});

Message.LinkedInOAuth.prototype.addRedirectOrigin = function(baseUri) {
  this.addQueryString({
    redirect_uri: baseUri + '/db/User/OAuth/linkedin'
  });
};

Message.TwitterOAuth = Message.createExternal({
  method: 'OAUTH',
  path: '',
  query: [],
  status: [200]
});

Message.TwitterOAuth.prototype.addRedirectOrigin = function(baseUri) {
  this.request.path = baseUri + '/db/User/OAuth1/twitter';
};

module.exports = Message;