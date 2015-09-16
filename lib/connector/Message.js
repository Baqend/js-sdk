var CommunicationError = require('../error/CommunicationError');

/**
 * @class baqend.connector.Message
 *
 * @param {String} arguments... The path arguments
 */
var Message = Object.inherit(/** @lends baqend.connector.Message.prototype */ {

  /** @lends baqend.connector.Message */
  extend: {
    /**
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

    /**
     * Creates a new message class with the given message specification
     * @param {object} spec
     * @return {Function}
     */
    create: function(spec) {
      var parts = spec.path.split('?');
      var path = parts[0].split(/:\w*/);
      var query = [];
      if (parts[1]) {
        parts[1].split('&').forEach(function(arg) {
          var part = arg.split('=');
          query.push(part[0]);
        });
      }

      spec.path = path;
      spec.query = query;

      return Message.inherit({
        spec: spec
      });
    },

      /**
       * Creates a new message class with the given message specification and a full path
       * @param {object} spec
       * @return {Function}
       */
      createExternal: function(spec) {
        return Message.inherit({
          spec: spec
        });
      }
  },


  /**
   * Message specification
   * @type object
   */
  spec: null,

  /**
   * @type {boolean}
   */
  withCredentials: false,

  initialize: function() {
    var args = arguments;
    var index = 0;
    var path = this.spec.path[0];

    for (var i = 1; i < this.spec.path.length; ++i) {
      path += encodeURIComponent(args[index++]) + this.spec.path[i];
    }

    var query = "";
    for (var i = 0; i < this.spec.query.length; ++i) {
      var arg = args[index++];
      if (arg !== undefined && arg !== null) {
        query += query? '&': '?';
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
  },

  setIfMatch: function(value) {
    if (value != '*')
      value = '"' + value + '"';

    this.request.headers['If-Match'] = value;
  },

  setIfNoneMatch: function(value) {
    if (value != '*')
      value = '"' + value + '"';

    this.request.headers['If-None-Match'] = value;
  },

  setCacheControl: function(value) {
    this.request.headers['Cache-Control'] = value;
  },

  getAuthorizationToken: function() {
    return this.response.headers['Orestes-Authorization-Token'] || this.response.headers['orestes-authorization-token'];
  },

  setAuthorizationToken: function(value) {
    this.request.headers['Authorization'] = 'BAT ' + value;
  },

  /**
   * @param {String=} value
   */
  withAuthorizationToken: function(value) {
    if(value) {
      this.setAuthorizationToken(value);
    } else {
      this.request.withCredentials = true;
    }
  },

  /**
   * Adds the given String to the request path.
   * If the parameter is an object the query string will be created.
   *
   * @param {String|Object} query which will added to the request path
   */
  addQueryString: function(query) {
    if(String.isInstance(query)) {
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
  },

  /**
   * Handle the receive
   */
  doReceive: function() {
    if (this.spec.status.indexOf(this.response.status) == -1) {
      throw new CommunicationError(this);
    }
  }
});

Message.GoogleOAuth = Message.createExternal({
  method: 'OAUTH',
  path: 'https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=&scope=&state=&access_type=online',
  status: [200]
});

Message.GoogleOAuth.prototype.addRedirectOrigin = function(origin) {
  this.addQueryString({
    redirect_uri: origin + '/db/User/OAuth/google'
  });
};

Message.FacebookOAuth = Message.createExternal({
  method: 'OAUTH',
  path: 'https://www.facebook.com/dialog/oauth?response_type=code&client_id=&scope=&state=',
  status: [200]
});

Message.FacebookOAuth.prototype.addRedirectOrigin = function(origin) {
  this.addQueryString({
    redirect_uri: origin + '/db/User/OAuth/facebook'
  });
};

Message.GitHubOAuth = Message.createExternal({
  method: 'OAUTH',
  path: 'https://github.com/login/oauth/authorize?response_type=code&client_id=&scope=&state=&access_type=online',
  status: [200]
});

Message.GitHubOAuth.prototype.addRedirectOrigin = function(origin) {
  this.addQueryString({
    redirect_uri: origin + '/db/User/OAuth/github'
  });
};

Message.LinkedInOAuth = Message.createExternal({
  method: 'OAUTH',
  path: 'https://www.linkedin.com/uas/oauth2/authorization' +
      '?response_type=code&client_id=&scope=&state=&access_type=online',
  status: [200]
});

Message.LinkedInOAuth.prototype.addRedirectOrigin = function(origin) {
  this.addQueryString({
    redirect_uri: origin + '/db/User/OAuth/linkedin'
  });
};

Message.TwitterOAuth = Message.createExternal({
  method: 'OAUTH',
  path: '',
  status: [200]
});

Message.TwitterOAuth.prototype.addRedirectOrigin = function(origin) {
  this.request.path = origin + '/db/User/OAuth1/twitter';
};

module.exports = Message;