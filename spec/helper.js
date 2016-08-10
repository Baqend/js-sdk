var fs, http, https, urlParser;
if (typeof DB == 'undefined') {
  DB = require('../lib');
  fs = require('fs');
  http = require('http');
  https = require('https');
  urlParser = require('url');
}

var helper = {
  rootTokenStorage: null,
  makeLogin: function() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 10; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

    return 'user-' + text;
  },
  randomize: function(name) {
    var rnd = Math.floor(Math.random() * 1000000);
    return name + "_random_" + rnd;
  },
  sleep: function(time, value) {
    return new Promise(function(success) {
      setTimeout(function() {
        success(value);
      }, time);
    });
  },
  asset: function(src, type) {
    if (fs) {
      return helper.file("spec/assets/" + src).then(function(file) {
        if (type == 'arraybuffer') {
          return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
        } else {
          return file;
        }
      });
    } else {
      return helper.req("/spec/assets/" + src).then(function(file) {
        if (type == 'arraybuffer') {
          return new Promise(function(resolve, reject) {
            var fileReader = new FileReader();
            fileReader.onload = function() {
              resolve(this.result);
            };
            fileReader.onerror = reject;
            fileReader.readAsArrayBuffer(file);
          });
        } else {
          return file;
        }
      });
    }
  },
  file: function(path) {
    return new Promise(function(success, error) {
      fs.readFile(path, function(err, data) {
        if (err) error(err);
        success(data);
      });
    });
  },
  req: function(url, responseType) {
    return new Promise(function(resolve, reject) {
      if (urlParser) {
        var options = urlParser.parse(url);
        options.method = 'GET';
        var ht = options.protocol == 'http:'? http: https;
        var req = ht.request(options, function(res) {
          var chunks = [];
          res.on('data', function(chunk) {
            chunks.push(chunk);
          });
          res.on('end', function() {
            if (res.statusCode >= 400) {
              reject({status: res.statusCode})
            } else {
              resolve(Buffer.concat(chunks));
            }
          });
        });
        req.on('error', reject);
        req.end();
      } else {
        var oReq = new XMLHttpRequest();
        oReq.open("GET", url, true);
        oReq.responseType = responseType || 'blob';
        oReq.onload = function() {
          if (oReq.status >= 400) {
            reject({status: oReq.status});
          } else {
            resolve(oReq.response);
          }
        };
        oReq.onerror = reject;
        oReq.send()
      }
    });
  },
  isNode: typeof window == 'undefined',
  isPhantomJS: typeof navigator != 'undefined' && navigator.userAgent.indexOf('PhantomJS') != -1,
  isIE: typeof navigator != 'undefined' && navigator.userAgent.indexOf('Trident') != -1,
  isIEdge: typeof navigator != 'undefined' && navigator.userAgent.indexOf('Edge') != -1
};

before(function() {
  helper.rootTokenStorage = new DB.util.TokenStorage();
  var emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage});
  return emf.createEntityManager(true).ready().then(function(em) {
    return em.User.login('root', 'root');
  });
});

if (typeof module != 'undefined') {
  module.exports = helper;
}

