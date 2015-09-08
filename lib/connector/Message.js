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

    this.request = {
      method: this.spec.method,
      path: this.spec.params.map(function(param) {
        if (Object(param) instanceof Number) {
          index++;
          return encodeURIComponent(args[param]);
        } else {
          return param;
        }
      }).join(''),
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
    return this.response.headers['Orestes-Authorization-Token'] || this.response.headers['orestes-authorization-token'];
  }

  setAuthorizationToken(value) {
    this.request.headers['Authorization'] = 'BAT ' + value;
  }

  /**
   * @param {String=} value
   */
  withAuthorizationToken(value) {
    if(value) {
      this.setAuthorizationToken(value)
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

Message.GoogleOAuth = Message.create({
  method: 'OAUTH',
  params: [
    'https://accounts.google.com/o/oauth2/auth',
    '?response_type=code',
    '&client_id=', 0,
    '&scope=', 1,
    '&state=', 2,
    '&access_type=online'
  ],
  status: [200]
});

Message.GoogleOAuth.prototype.addRedirectOrigin = function(origin) {
  this.addQueryString({
    redirect_uri: origin + '/db/User/OAuth/google'
  });
};

Message.FacebookOAuth = Message.create({
  method: 'OAUTH',
  params: [
    'https://www.facebook.com/dialog/oauth',
    '?response_type=code',
    '&client_id=', 0,
    '&scope=', 1,
    '&state=', 2
  ],
  status: [200]
});

Message.FacebookOAuth.prototype.addRedirectOrigin = function(origin) {
  this.addQueryString({
    redirect_uri: origin + '/db/User/OAuth/facebook'
  });
};

Message.GitHubOAuth = Message.create({
  method: 'OAUTH',
  params: [
    'https://github.com/login/oauth/authorize',
    '?response_type=code',
    '&client_id=', 0,
    '&scope=', 1,
    '&state=', 2,
    '&access_type=online'
  ],
  status: [200]
});

Message.GitHubOAuth.prototype.addRedirectOrigin = function(origin) {
  this.addQueryString({
    redirect_uri: origin + '/db/User/OAuth/github'
  });
};

Message.LinkedInOAuth = Message.create({
  method: 'OAUTH',
  params: [
    'https://www.linkedin.com/uas/oauth2/authorization',
    '?response_type=code',
    '&client_id=', 0,
    '&scope=', 1,
    '&state=', 2,
    '&access_type=online'
  ],
  status: [200]
});

Message.LinkedInOAuth.prototype.addRedirectOrigin = function(origin) {
  this.addQueryString({
    redirect_uri: origin + '/db/User/OAuth/linkedin'
  });
};

Message.TwitterOAuth = Message.create({
  method: 'OAUTH',
  params: [],
  status: [200]
});

Message.TwitterOAuth.prototype.addRedirectOrigin = function(origin) {
  this.request.path = origin + '/db/User/OAuth1/twitter';
};

module.exports = Message;