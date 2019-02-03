'use strict';

var fs, http, https, urlParser;
if (typeof DB === 'undefined') {
  if (typeof window !== 'undefined') {
    window.DB = require('../lib');
  } else if (typeof global !== 'undefined') {
    global.DB = require('../lib');
  }
  fs = require('fs');
  http = require('http');
  https = require('https');
  urlParser = require('url');
}

var helper = {
  modules: {
    Rx: 'https://unpkg.com/@reactivex/rxjs@5.0.0-rc.4/dist/global/Rx.js',
  },
  rootTokenStorage: null,
  makeLogin: function () {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < 10; i += 1) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }

    return 'user-' + text;
  },
  randomize: function (name) {
    var rnd = Math.floor(Math.random() * 1000000);
    return name + '_random_' + rnd;
  },
  sleep: function (time, value) {
    return new Promise(function (success) {
      setTimeout(function () {
        success(value);
      }, time);
    });
  },
  asset: function (src, type) {
    if (fs) {
      return helper.file('spec/assets/' + src).then(function (file) {
        if (type === 'arraybuffer') {
          return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
        } else if (type === 'text') {
          return file.toString();
        }
        return file;
      });
    }
    return helper.req('/spec/assets/' + src, type).then(function (file) {
      return file;
    });
  },
  file: function (path) {
    return new Promise(function (success, error) {
      fs.readFile(path, function (err, data) {
        if (err) error(err);
        success(data);
      });
    });
  },
  req: function (url, responseType) {
    return new Promise(function (resolve, reject) {
      if (urlParser) {
        var options = urlParser.parse(url);
        // If urlParse.parse() is called on Node.js, a single quote character is converted to %27,
        // which normally should not happen
        options.href = options.href.replace(/%27/g, '\'');
        options.path = options.path.replace(/%27/g, '\'');
        options.pathname = options.pathname.replace(/%27/g, '\'');

        options.method = 'GET';
        var ht = options.protocol === 'http:' ? http : https;
        var req = ht.request(options, function (res) {
          var chunks = [];
          res.on('data', function (chunk) {
            chunks.push(chunk);
          });
          res.on('end', function () {
            if (res.statusCode >= 400) {
              reject(new Error({ status: res.statusCode }));
            } else {
              resolve(Buffer.concat(chunks));
            }
          });
        });
        req.on('error', reject);
        req.end();
      } else {
        var oReq = new XMLHttpRequest();
        oReq.open('GET', url, true);
        oReq.responseType = responseType || 'blob';
        oReq.onload = function () {
          if (oReq.status >= 400) {
            reject(new Error({ status: oReq.status }));
          } else {
            resolve(oReq.response);
          }
        };
        oReq.onerror = reject;
        oReq.send();
      }
    });
  },
  load: function (module) {
    return new Promise(function (success) {
      var script = document.createElement('script');
      script.onload = success;
      script.src = helper.modules[module];
      document.getElementsByTagName('head')[0].appendChild(script);
    }).then(function () {
      return window[module];
    });
  },
  isNode: typeof window === 'undefined',
  isPhantomJS: typeof navigator !== 'undefined' && navigator.userAgent.indexOf('PhantomJS') !== -1,
  isIE: typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Trident') !== -1,
  isIE11: typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Trident/7.0') !== -1,
  isIEdge: typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Edge') !== -1,
};

before(function () {
  helper.rootTokenStorage = new DB.util.TokenStorage();
  var emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage });

  return Promise.all([
    emf.createEntityManager(true).ready().then(function (em) {
      return em.User.login('root', 'root');
    }),
    DB.connect(env.TEST_SERVER).then(function (localDb) {
      expect(localDb).equal(DB);
    }),
  ]);
});

if (typeof module !== 'undefined') {
  module.exports = helper;
}

