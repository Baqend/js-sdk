'use strict';

var DB;
if (typeof module !== 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test file', function () {
  // Skip IE9 and IE11 multiple file uploads in one session crashes the ie
  if ((typeof Blob === 'undefined' && typeof Buffer === 'undefined') || helper.isIE11) {
    return;
  }

  this.timeout(20 * 1000);

  var flames, emf, rootDb;
  var dataBase64 = 'data:image/gif;base64,R0lGODlhDAAeALMAAGUJC/SHGvJZI18NDP347fifGeyqlfqqFdjHx/FhIu98HuLY1/NwHvN5G2AMDP///yH5BAAAAAAALAAAAAAMAB4AAARM8MlJ63SWOpzf3t3HVSKolab0qel6mS7LxR6I0OuCw2k9967dj+cYvFAUAJKEGnkKh0OJQggEHgSaRNHoPBheSsJrEIQf5nD6zKZEAAA7';
  var dataSvg = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201%201%22%3E%3Cpath%20d%3D%22m0%2C0v1h1V0%22%2F%3E%3C%2Fsvg%3E';
  var dataSvgTotal = 86;
  var svgBase64 = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxwYXRoIGQ9Im0wLDB2MWgxVjAiLz48L3N2Zz4=';
  var html = '<html><head><title>Hallo World</title></head><body>Hallo World</body></html>';
  var json;
  var arrayBuffer;

  before(function () {
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);

    return Promise.all([
      helper.asset('flames.png'),
      helper.asset('rocket.jpg'),
      helper.asset('flames.png', 'arraybuffer'),
      helper.asset('test.json', 'text'),
    ]).then(function (data) {
      flames = data[0];
      arrayBuffer = data[2];
      json = JSON.parse(data[3]);
    }).then(function () {
      return emf.createEntityManager().ready().then(function (em) {
        return em.User.login('root', 'root').then(function () {
          rootDb = em;
        });
      });
    });
  });

  it('parses E-Tags correctly', function () {
    var parseETag = DB.binding.File.parseETag;

    expect(parseETag()).to.be.null;
    expect(parseETag(false)).to.be.null;
    expect(parseETag(null)).to.be.null;
    expect(parseETag(undefined)).to.be.null;

    expect(parseETag('"hello"')).to.eql('hello');
    expect(parseETag('"12345"')).to.eql('12345');
    expect(parseETag('\'hello\'')).to.eql('hello');
    expect(parseETag('\'12345\'')).to.eql('12345');
    expect(parseETag('w/"hello"')).to.eql('hello');
    expect(parseETag('w/"12345"')).to.eql('12345');
    expect(parseETag('w/\'hello\'')).to.eql('hello');
    expect(parseETag('w/\'12345\'')).to.eql('12345');
    expect(parseETag('W/"hello"')).to.eql('hello');
    expect(parseETag('W/"12345"')).to.eql('12345');
    expect(parseETag('W/\'hello\'')).to.eql('hello');
    expect(parseETag('W/\'12345\'')).to.eql('12345');
  });

  describe('object', function () {
    it('should initialize with default parameters', function () {
      var file = new rootDb.File();
      expect(file.id).eql('/file/www/' + file.key);
      expect(file.key).is.defined;
      expect(file.bucket).eql('www');
      expect(file.parent).eql('/www');
      expect(file.name).eql(file.key);

      expect(function () {
        file.acl;
      }).throw('is not available');

      expect(function () {
        file.lastModified;
      }).throw('is not available');

      expect(function () {
        file.eTag;
      }).throw('is not available');

      expect(function () {
        file.mimeType;
      }).throw('is not available');

      expect(function () {
        file.toJSON();
      }).throw('is not available');
    });

    it('should initialize with string parameter', function () {
      var file = new rootDb.File('/file/test/myFile.txt');
      expect(file.id).eql('/file/test/myFile.txt');
      expect(file.key).eql('myFile.txt');
      expect(file.bucket).eql('test');
      expect(file.parent).eql('/test');
      expect(file.name).eql('myFile.txt');

      expect(function () {
        file.acl;
      }).throw('is not available');

      expect(function () {
        file.lastModified;
      }).throw('is not available');

      expect(function () {
        file.eTag;
      }).throw('is not available');

      expect(function () {
        file.mimeType;
      }).throw('is not available');
    });

    it('should initialize with deep path parameter', function () {
      var file = new rootDb.File('/file/test/my/deep/path/myFile.txt');
      expect(file.id).eql('/file/test/my/deep/path/myFile.txt');
      expect(file.path).eql('/test/my/deep/path/myFile.txt');
      expect(file.key).eql('my/deep/path/myFile.txt');
      expect(file.bucket).eql('test');
      expect(file.parent).eql('/test/my/deep/path');
      expect(file.name).eql('myFile.txt');
    });

    it('should initialize with actual path parameter', function () {
      var file = new rootDb.File({ path: 'test/my/deep/path/myFile.txt' });
      expect(file.id).eql('/file/test/my/deep/path/myFile.txt');
      expect(file.key).eql('my/deep/path/myFile.txt');
      expect(file.bucket).eql('test');
      expect(file.parent).eql('/test/my/deep/path');
      expect(file.name).eql('myFile.txt');
    });

    it('should initialize with parent parameter', function () {
      var file = new rootDb.File({ parent: '/test/my/deep/path/', name: 'myFile.txt' });
      expect(file.id).eql('/file/test/my/deep/path/myFile.txt');
      expect(file.key).eql('my/deep/path/myFile.txt');
      expect(file.bucket).eql('test');
      expect(file.parent).eql('/test/my/deep/path');
      expect(file.name).eql('myFile.txt');
    });

    it('should reject invalid path', function () {
      expect(function () {
        new rootDb.File('/file/myFile.txt');
      }).throw('Invalid file reference');

      expect(function () {
        new rootDb.File('/test/bucket/myFile.txt');
      }).throw('Invalid file reference');
    });

    it('should initialize with blob/buffer parameters', function () {
      var file;
      if (helper.isNode) {
        file = new rootDb.File({ name: 'test.png', data: flames, mimeType: 'image/png' });
      } else {
        file = new rootDb.File({ name: 'test.png', data: flames });
      }

      expect(file.id).eql('/file/www/' + file.key);
      expect(file.key).eql('test.png');
      expect(file.bucket).eql('www');
      expect(file.parent).eql('/www');
      expect(file.name).eql('test.png');
      expect(file.acl).is.defined;
      expect(file.acl.isPublicReadAllowed()).be.true;
      expect(file.acl.isPublicWriteAllowed()).be.true;
      expect(file.lastModified).be.undefined;
      expect(file.eTag).be.undefined;
      expect(file.mimeType).eql('image/png');
    });

    if (!helper.isNode) {
      it('should initialize with file parameter', function () {
        return helper.asset('flames.png').then(function (f) {
          f.name = 'file.png';
          f.lastModifiedDate = new Date();

          var file = new rootDb.File({ data: f });
          expect(file.id).eql('/file/www/' + file.key);
          expect(file.key).eql('file.png');
          expect(file.bucket).eql('www');
          expect(file.parent).eql('/www');
          expect(file.name).eql('file.png');
          expect(file.acl).is.defined;
          expect(file.acl.isPublicReadAllowed()).be.true;
          expect(file.acl.isPublicWriteAllowed()).be.true;
          expect(file.lastModified).be.undefined;
          expect(file.eTag).be.undefined;
          expect(file.mimeType).eql('image/png');
        });
      });
    }

    if (helper.isNode) {
      it('should initialize with stream parameters', function () {
        var fs = require('fs');

        var file = new rootDb.File({
          name: 'test.png',
          data:
            fs.createReadStream('spec/asset/flames.png'),
          type: 'stream',
          mimeType: 'image/png',
        });

        expect(file.id).eql('/file/www/' + file.key);
        expect(file.key).eql('test.png');
        expect(file.bucket).eql('www');
        expect(file.parent).eql('/www');
        expect(file.name).eql('test.png');
        expect(file.acl).is.defined;
        expect(file.acl.isPublicReadAllowed()).be.true;
        expect(file.acl.isPublicWriteAllowed()).be.true;
        expect(file.lastModified).be.undefined;
        expect(file.eTag).be.undefined;
        expect(file.mimeType).eql('image/png');
      });
    }

    it('should initialize with base64 parameter', function () {
      var file = new rootDb.File({ data: svgBase64, type: 'base64', mimeType: 'image/svg+xml' });
      expect(file.id).eql('/file/www/' + file.key);
      expect(file.key).is.defined;
      expect(file.bucket).eql('www');
      expect(file.parent).eql('/www');
      expect(file.name).eql(file.key);
      expect(file.acl).is.defined;
      expect(file.acl.isPublicReadAllowed()).be.true;
      expect(file.acl.isPublicWriteAllowed()).be.true;
      expect(file.lastModified).be.undefined;
      expect(file.eTag).be.undefined;
      expect(file.mimeType).eql('image/svg+xml');
    });

    it('should initialize with data-url base64 parameter', function () {
      var file = new rootDb.File({ data: dataBase64, type: 'data-url' });
      expect(file.id).eql('/file/www/' + file.key);
      expect(file.key).is.defined;
      expect(file.bucket).eql('www');
      expect(file.parent).eql('/www');
      expect(file.name).eql(file.key);
      expect(file.acl).is.defined;
      expect(file.acl.isPublicReadAllowed()).be.true;
      expect(file.acl.isPublicWriteAllowed()).be.true;
      expect(file.lastModified).be.undefined;
      expect(file.eTag).be.undefined;
      expect(file.mimeType).eql('image/gif');
    });

    it('should initialize with data-url parameter', function () {
      var file = new rootDb.File({ data: dataSvg, type: 'data-url' });
      expect(file.id).eql('/file/www/' + file.key);
      expect(file.key).is.defined;
      expect(file.bucket).eql('www');
      expect(file.parent).eql('/www');
      expect(file.name).eql(file.key);
      expect(file.acl).is.defined;
      expect(file.acl.isPublicReadAllowed()).be.true;
      expect(file.acl.isPublicWriteAllowed()).be.true;
      expect(file.lastModified).be.undefined;
      expect(file.eTag).be.undefined;
      expect(file.mimeType).eql('image/svg+xml');
    });

    it('should initialize with all parameters', function () {
      return helper.asset('flames.png').then(function (f) {
        f.name = 'file.png';
        f.lastModifiedDate = new Date();

        var acl = new rootDb.Acl();
        acl.allowReadAccess(rootDb.User.me);
        acl.allowWriteAccess(rootDb.User.me);

        var date = new Date('2016-01-01');

        var file = new rootDb.File({
          data: f,
          type: 'blob',
          name: 'my.png',
          parent: '/www/test',
          mimeType: 'text/html',
          lastModified: date,
          acl: acl,
          eTag: '827598375',
        });

        expect(file.id).eql('/file/www/test/my.png');
        expect(file.key).eql('test/my.png');
        expect(file.bucket).eql('www');
        expect(file.parent).eql('/www/test');
        expect(file.name).eql('my.png');
        expect(file.acl).eql(acl);
        expect(file.lastModified).gte(date);
        expect(file.lastModified).lte(date);
        expect(file.eTag).eql('827598375');
        expect(file.mimeType).eql('text/html');
      });
    });

    it('should initialize with folder and name parameters', function () {
      var file = new rootDb.File({ parent: '/testfolder', name: 'test.png' });
      expect(file.id).eql('/file/testfolder/test.png');
      expect(file.key).eql('test.png');
      expect(file.bucket).eql('testfolder');
      expect(file.parent).eql('/testfolder');
      expect(file.name).eql('test.png');
    });

    it('should initialize with folder and name parameters', function () {
      var file = new rootDb.File({ parent: 'testfolder', name: 'test.png' });
      expect(file.id).eql('/file/testfolder/test.png');
      expect(file.key).eql('test.png');
      expect(file.bucket).eql('testfolder');
      expect(file.parent).eql('/testfolder');
      expect(file.name).eql('test.png');
    });

    it('should initialize with folder and name parameters', function () {
      var file = new rootDb.File({ parent: '/testfolder/', name: 'test.png' });
      expect(file.id).eql('/file/testfolder/test.png');
      expect(file.key).eql('test.png');
      expect(file.bucket).eql('testfolder');
      expect(file.parent).eql('/testfolder');
      expect(file.name).eql('test.png');
    });

    it('should initialize with deep folder', function () {
      var file = new rootDb.File({ parent: '/deep/test/folder/', name: 'test.png' });
      expect(file.id).eql('/file/deep/test/folder/test.png');
      expect(file.key).eql('test/folder/test.png');
      expect(file.bucket).eql('deep');
      expect(file.parent).eql('/deep/test/folder');
      expect(file.name).eql('test.png');
    });

    it('should reject invalid folder', function () {
      expect(function () {
        new rootDb.File({ parent: '/', name: 'test.png' });
      }).throw('Invalid parent name');

      var file = new rootDb.File({ parent: '', name: 'test.png' });
      expect(file.parent).eql('/www');
    });

    it('should reject invalid file name', function () {
      expect(function () {
        new rootDb.File({ parent: '/www', name: '/test.png' });
      }).throw('Invalid path');

      var file = new rootDb.File({ parent: '/www', name: '' });
      expect(file.name).not.eql('');
    });

    it('should serialize all properties to json', function () {
      var acl = new rootDb.Acl();
      acl.allowReadAccess(rootDb.User.me);
      acl.allowWriteAccess(rootDb.User.me);

      var date = new Date('2016-01-01');

      var file = new rootDb.File({
        data: dataBase64,
        type: 'data-url',
        name: 'my.png',
        parent: '/www/test',
        mimeType: 'text/html',
        createdAt: date,
        lastModified: date,
        acl: acl,
        eTag: '827598375',
        size: 12345,
        headers: {
          'test-header': 'value',
        },
      });

      var jsonOfFile = file.toJSON();
      expect(jsonOfFile).eql({
        id: '/file/www/test/my.png',
        mimeType: 'text/html',
        createdAt: date.toISOString(),
        lastModified: date.toISOString(),
        size: 12345,
        acl: {
          read: {
            '/db/User/1': 'allow',
          },
          write: {
            '/db/User/1': 'allow',
          },
        },
        eTag: '827598375',
        headers: {
          'test-header': 'value',
        },
      });
      expect(jsonOfFile.data).is.undefined;
      expect(jsonOfFile.type).is.undefined;
    });

    it('should deserialize all properties from json', function () {
      var acl = new rootDb.Acl();
      acl.allowReadAccess(rootDb.User.me);
      acl.allowWriteAccess(rootDb.User.me);

      var date = new Date('2016-01-01');

      var file = rootDb.File.fromJSON({
        id: '/file/www/test/my.png',
        mimeType: 'text/html',
        createdAt: date.toISOString(),
        lastModified: date.toISOString(),
        size: 12345,
        acl: {
          read: {
            '/db/User/1': 'allow',
          },
          write: {
            '/db/User/1': 'allow',
          },
        },
        eTag: '827598375',
        headers: {
          'test-header': 'value',
        },
      });

      expect(file.id).eql('/file/www/test/my.png');
      expect(file.key).eql('test/my.png');
      expect(file.bucket).eql('www');
      expect(file.parent).eql('/www/test');
      expect(file.name).eql('my.png');
      expect(file.acl).eql(acl);
      expect(file.lastModified).gte(date);
      expect(file.lastModified).lte(date);
      expect(file.createdAt).gte(date);
      expect(file.createdAt).lte(date);
      expect(file.eTag).eql('827598375');
      expect(file.mimeType).eql('text/html');
      expect(file.headers).eql({ 'test-header': 'value' });
    });

    it('should not deserialize json to a wrong file instance', function () {
      var date = new Date('2016-01-01');
      var file = new rootDb.File('/file/www/test/other.png');

      expect(function () {
        file.fromJSON({
          id: '/file/www/test/my.png',
          mimeType: 'text/html',
          createdAt: date.toISOString(),
          lastModified: date.toISOString(),
          contentLength: 12345,
          acl: {},
          eTag: '827598375',
        });
      }).throws('does not match the given json id');
    });
  });

  describe('url', function () {
    var anonymousDB,
      uploadFile;

    before(function () {
      anonymousDB = emf.createEntityManager();
      return anonymousDB.ready().then(function () {
        var acl = new DB.Acl()
          .allowReadAccess(rootDb.User.me)
          .allowWriteAccess(rootDb.User.me);

        return rootDb.File.saveMetadata('private_bucket', {
          load: new DB.util.Permission().allowAccess(rootDb.User.me),
          insert: new DB.util.Permission().allowAccess(rootDb.User.me),
          update: new DB.util.Permission().allowAccess(rootDb.User.me),
          delete: new DB.util.Permission().allowAccess(rootDb.User.me),
          query: new DB.util.Permission().allowAccess(rootDb.User.me),
        }).then(function () {
          uploadFile = new rootDb.File({ parent: 'private_bucket', data: flames, acl: acl });
          return uploadFile.upload();
        });
      });
    });

    it('should not contains credentials for anonymous user', function () {
      var file = new anonymousDB.File({ name: 'public.png' });
      expect(file.url).eql(env.TEST_SERVER + '/file/www/public.png');
    });

    it('should not contains credentials for anonymous user in none www bucket', function () {
      var file = new anonymousDB.File({ parent: '/testfolder/', name: 'private.png' });
      expect(file.url).eql(env.TEST_SERVER + '/file/testfolder/private.png');
    });

    it('should not contains credentials for the www bucket', function () {
      var file = new rootDb.File({ name: 'public.png' });
      expect(file.url).eql(env.TEST_SERVER + '/file/www/public.png');
    });

    it('should contains credentials for none www bucket', function () {
      var file = new rootDb.File({ parent: '/testfolder/', name: 'private.png' });
      expect(file.url).string(env.TEST_SERVER + '/file/testfolder/private.png?BAT=');
    });

    it('should provide no access for none authorized user', function () {
      var file = new anonymousDB.File(uploadFile.id);
      return expect(helper.req(file.url)).be.rejectedWith({ status: 466 });
    });

    it('should provide access for authorized user', function () {
      var file = new rootDb.File(uploadFile.id);
      return helper.req(file.url).then(function (data) {
        expect(data).be.eql(flames);
      });
    });
  });

  describe('upload', function () {
    before(function () {
      return rootDb.File.loadMetadata('www').then(function (acls) {
        acls.update = new rootDb.util.Permission().allowAccess(rootDb.User.me);
        acls.insert = new rootDb.util.Permission().allowAccess(rootDb.User.me);
        return rootDb.File.saveMetadata('www', acls);
      });
    });

    it('should maintain createdAt', function () {
      var file = new rootDb.File({ data: flames });
      var creationDate;
      return file.upload().then(function () {
        creationDate = file.lastModified;
        expect(file.createdAt).is.defined;
        expect(file.createdAt).eql(creationDate);
        return helper.sleep(2000);
      }).then(function () {
        return file.upload({ data: dataSvg, type: 'data-url' });
      }).then(function () {
        expect(file.createdAt.getTime()).equal(creationDate.getTime());
        expect(file.createdAt.getTime()).not.equal(file.lastModified.getTime());
      });
    });

    it('should denied for anonymous', function () {
      var file;
      return expect(emf.createEntityManager().ready().then(function (db) {
        file = new db.File({ data: flames });
        return file.upload();
      })).rejectedWith('insert permissions are required');
    });

    it('should handle conditional update', function () {
      var file = new rootDb.File({ data: flames });
      return file.upload().then(function () {
        return file.upload({ data: dataSvg, type: 'data-url' });
      }).then(function () {
        expect(file.mimeType).string('image/svg+xml');
      });
    });

    it('should reject stale insertion', function () {
      var file = new rootDb.File({ data: flames });
      return expect(file.upload().then(function () {
        return new rootDb.File(file.id).upload({ data: flames });
      })).be.rejectedWith('exists already');
    });

    it('should reject stale update', function () {
      var file = new rootDb.File({ data: flames });
      return expect(file.upload().then(function () {
        return new rootDb.File(file.id).upload({ data: dataSvg, type: 'data-url', force: true });
      }).then(function () {
        return file.upload({ data: dataBase64, type: 'data-url' });
      })).be.rejectedWith('out of date');
    });

    it('should allow stale update with force', function () {
      var file = new rootDb.File({ data: flames });
      return file.upload().then(function () {
        return new rootDb.File(file.id).upload({ data: dataSvg, type: 'data-url', force: true });
      }).then(function () {
        return file.upload({ data: dataBase64, type: 'data-url', force: true });
      }).then(function () {
        expect(file.mimeType).eql('image/gif');
      });
    });

    it('should upload blob/buffer format', function () {
      var file = new rootDb.File({ data: flames });
      return file.upload().then(function () {
        expect(file.eTag).is.defined;
        expect(file.lastModified).gt(new Date(Date.now() - 5 * 60 * 1000));
        expect(file.lastModified).lt(new Date(Date.now() + 5 * 60 * 1000));
        expect(file.mimeType).eql('image/png');
        expect(file.size).eql(flames.size || flames.length);
      });
    });

    if (helper.isNode) {
      it('should upload stream format', function () {
        var fs = require('fs');

        var file = new rootDb.File({
          data: fs.createReadStream('spec/assets/flames.png'),
          type: 'stream',
          mimeType: 'image/png',
          size: fs.statSync('spec/assets/flames.png').size,
        });

        return file.upload().then(function () {
          expect(file.eTag).is.defined;
          expect(file.lastModified).gt(new Date(Date.now() - 5 * 60 * 1000));
          expect(file.lastModified).lt(new Date(Date.now() + 5 * 60 * 1000));
          expect(file.mimeType).eql('image/png');
        });
      });

      it('should reject stream format', function () {
        var fs = require('fs');

        var file = new rootDb.File({
          data: fs.createReadStream('spec/assets/flames.png'),
          type: 'stream',
          mimeType: 'image/png',
        });

        return expect(file.upload()).rejectedWith('');
      });
    }

    it('should upload json format', function () {
      var file = new rootDb.File({ data: json });
      return file.upload().then(function () {
        expect(file.mimeType.toLowerCase()).eql('application/json; charset=utf-8');
      });
    });

    it('should upload text format', function () {
      var file = new rootDb.File({ data: html, mimeType: 'text/html;charset=utf-8' });
      return file.upload().then(function () {
        expect(file.mimeType.toLowerCase()).eql('text/html; charset=utf-8');
      });
    });

    it('should upload base64 format', function () {
      var file = new rootDb.File({ data: svgBase64, type: 'base64', mimeType: 'image/svg+xml' });
      return file.upload().then(function () {
        expect(file.mimeType).string('image/svg+xml');
      });
    });

    it('should upload data-url base64 format', function () {
      var file = new rootDb.File({ data: dataBase64, type: 'data-url' });
      return file.upload().then(function () {
        expect(file.mimeType).eql('image/gif');
      });
    });

    it('should upload data-url format', function () {
      var file = new rootDb.File({ data: dataSvg, type: 'data-url' });
      return file.upload().then(function () {
        expect(file.mimeType).string('image/svg+xml');
      });
    });

    it('should upload arraybuffer format', function () {
      var file = new rootDb.File({ data: arrayBuffer, mimeType: 'image/png' });
      return file.upload().then(function () {
        expect(file.mimeType).eql('image/png');
      });
    });

    it('should upload auto detect data-url format', function () {
      var file = new rootDb.File({ data: dataSvg });
      return file.upload().then(function () {
        expect(file.mimeType).string('image/svg+xml');
        return file.download({ type: 'base64' });
      }).then(function (data) {
        expect(file.mimeType).string('image/svg+xml');
        expect(data).eql(svgBase64);
      });
    });

    if (!helper.isNode) {
      it('should have a progress callback which gets called', function () {
        var calls = 0;
        var file = new rootDb.File({ data: dataSvg });
        var cb = function (event) {
          expect(event.lengthComputable).to.be.true;
          expect(event.loaded).to.be.within(0, dataSvgTotal);
          expect(event.total).to.equal(dataSvgTotal);
          calls += 1;
        };
        return file.upload({ progress: cb }).then(function () {
          expect(calls).to.be.above(0);
        });
      });
    }
  });

  describe('download', function () {
    var pngFile,
      jsonFile,
      htmlFile,
      gifFile,
      svgFile;

    before(function () {
      pngFile = new rootDb.File({ data: flames });
      jsonFile = new rootDb.File({ data: json, mimeType: 'application/json' });
      htmlFile = new rootDb.File({ data: html, mimeType: 'text/html;charset=utf-8' });
      gifFile = new rootDb.File({ data: dataBase64, type: 'data-url' });
      svgFile = new rootDb.File({ data: dataSvg, type: 'data-url' });

      return Promise.all([
        pngFile.upload(),
        jsonFile.upload(),
        htmlFile.upload(),
        gifFile.upload(),
        svgFile.upload(),
      ]);
    });

    it('should load createdAt', function () {
      var file = new rootDb.File({ data: flames });
      var creationDate;
      var loadedFile;
      return file.upload().then(function () {
        creationDate = file.lastModified;
        expect(file.createdAt.getTime()).equal(creationDate.getTime());
        loadedFile = new rootDb.File(file.id);
        return loadedFile.download();
      }).then(function () {
        expect(loadedFile.createdAt.getTime()).equal(creationDate.getTime());
      });
    });

    it('should stored under specified name', function () {
      var file = new rootDb.File(pngFile.id);
      return file.download().then(function (data) {
        expect(data).instanceof(helper.isNode ? Buffer : Blob);
        expect(file.eTag).eql(pngFile.eTag);
        expect(file.lastModified).gt(new Date(Date.now() - 5 * 60 * 1000));
        expect(file.lastModified).lt(new Date(Date.now() + 5 * 60 * 1000));
        expect(file.mimeType).eql('image/png');
        expect(file.size).eql(pngFile.size);
        expect(file.acl.isPublicReadAllowed()).be.true;
        expect(file.acl.isPublicWriteAllowed()).be.true;
      });
    });

    it('should be downloadable as anonymous', function () {
      var file;
      return emf.createEntityManager().ready().then(function (db) {
        file = new db.File(pngFile.id);
        return file.download();
      }).then(function (data) {
        expect(data).instanceof(helper.isNode ? Buffer : Blob);
        expect(file.eTag).eql(pngFile.eTag);
        expect(file.lastModified).gt(new Date(Date.now() - 5 * 60 * 1000));
        expect(file.lastModified).lt(new Date(Date.now() + 5 * 60 * 1000));
        expect(file.mimeType).eql('image/png');
        expect(file.size).eql(pngFile.size);
        expect(file.acl.isPublicReadAllowed()).be.true;
        expect(file.acl.isPublicWriteAllowed()).be.true;
      });
    });

    it('should download blob/buffer format', function () {
      var file = new rootDb.File(pngFile.id);
      return file.download({ type: 'blob' }).then(function (data) {
        expect(file.mimeType.toLowerCase()).eql('image/png');
        expect(data).eql(flames);
      });
    });

    it('should allow in URI reserved characters in signed url', function () {
      var acl = new DB.Acl()
        .allowReadAccess(rootDb.User.me)
        .allowWriteAccess(rootDb.User.me);

      return rootDb.File.saveMetadata('testfolder', {})
        .then(function () {
          var file = new rootDb.File({
            name: ';,/?:@&=+$#' + rootDb.util.uuid() + '.png', data: flames, acl: acl, parent: '/testfolder',
          });
          return file.upload();
        })
        .then(function (file) {
          return helper.req(file.url);
        });
    });

    it('should allow in URI unreserved characters in signed url', function () {
      var acl = new DB.Acl()
        .allowReadAccess(rootDb.User.me)
        .allowWriteAccess(rootDb.User.me);

      return rootDb.File.saveMetadata('testfolder', {})
        .then(function () {
          var file = new rootDb.File({
            name: '-_.!~*\'()' + rootDb.util.uuid() + '.png', data: flames, acl: acl, parent: '/testfolder',
          });
          return file.upload();
        })
        .then(function (file) {
          return helper.req(file.url);
        });
    });

    it('should allow in alphanumeric characters + spaces in signed url', function () {
      var acl = new DB.Acl()
        .allowReadAccess(rootDb.User.me)
        .allowWriteAccess(rootDb.User.me);

      return rootDb.File.saveMetadata('testfolder', {})
        .then(function () {
          var file = new rootDb.File({
            name: 'ABC abc 123' + rootDb.util.uuid() + '.png', data: flames, acl: acl, parent: '/testfolder',
          });
          return file.upload();
        })
        .then(function (file) {
          return helper.req(file.url);
        });
    });


    if (helper.isNode) {
      it('should upload stream format', function () {
        var file = new rootDb.File(pngFile.id);
        return file.download({ type: 'stream' }).then(function (stream) {
          expect(file.mimeType.toLowerCase()).eql('image/png');

          return new Promise(function (resolve) {
            var chunks = [];
            stream.on('data', function (chunk) {
              chunks.push(chunk);
            });
            stream.on('end', function () {
              resolve(Buffer.concat(chunks));
            });
          });
        }).then(function (data) {
          expect(data).eql(flames);
        });
      });
    }

    it('should download json format', function () {
      var file = new rootDb.File(jsonFile.id);
      return file.download({ type: 'json' }).then(function (data) {
        expect(file.mimeType.toLowerCase().replace(' ', '')).eql('application/json;charset=utf-8');
        expect(data).eql(json);
      });
    });

    it('should download text format', function () {
      var file = new rootDb.File(htmlFile.id);
      return file.download({ type: 'text' }).then(function (data) {
        expect(file.mimeType.toLowerCase()).eql('text/html;charset=utf-8');
        expect(data).eql(html);
      });
    });

    it('should download base64 format', function () {
      var file = new rootDb.File(svgFile.id);
      return file.download({ type: 'base64' }).then(function (data) {
        expect(file.mimeType).string('image/svg+xml');
        expect(data).eql(svgBase64);
      });
    });

    it('should download data-url base64 format', function () {
      var file = new rootDb.File(gifFile.id);
      return file.download({ type: 'data-url' }).then(function (data) {
        expect(file.mimeType).eql('image/gif');
        expect(data).eql(dataBase64);
      });
    });

    it('should download data-url format', function () {
      var file = new rootDb.File(svgFile.id);
      return file.download({ type: 'data-url' }).then(function (data) {
        expect(file.mimeType).string('image/svg+xml');
        expect(data).string(svgBase64);
        expect(data).string('data:image/svg+xml');
      });
    });

    it('should download arraybuffer format', function () {
      var file = new rootDb.File(pngFile.id);
      return file.download({ type: 'arraybuffer' }).then(function (data) {
        expect(file.mimeType).eql('image/png');
        expect(data.byteLength).eql(arrayBuffer.byteLength);
      });
    });
  });

  describe('metadata', function () {
    var bucket = 'metadataTest';
    var pngFile;
    var jsonFile;

    before(function () {
      var cHeads = {
        hello: 'World',
        schmukey: 'Schmu',
      };
      pngFile = new rootDb.File({ parent: bucket, data: flames, headers: cHeads });
      jsonFile = new rootDb.File({ data: json, mimeType: 'application/json', headers: cHeads });

      return rootDb.File.saveMetadata(bucket, {}).then(function () {
        return Promise.all([
          pngFile.upload(),
          jsonFile.upload(),
        ]);
      });
    });

    it('should be loaded', function () {
      var file = new rootDb.File(pngFile.id);
      return file.loadMetadata().then(function () {
        expect(file !== pngFile).to.be.true;
        expect(file.eTag).eql(pngFile.eTag);
        expect(file.lastModified).gt(new Date(Date.now() - 5 * 60 * 1000));
        expect(file.lastModified).lt(new Date(Date.now() + 5 * 60 * 1000));
        expect(file.createdAt).gt(new Date(Date.now() - 5 * 60 * 1000));
        expect(file.createdAt).lt(new Date(Date.now() + 5 * 60 * 1000));
        expect(file.mimeType).eql('image/png');
        expect(file.size).eql(pngFile.size);
        expect(file.headers.hello).eql('World');
        expect(file.headers.schmukey).eql('Schmu');
        expect(file.acl.isPublicReadAllowed()).be.true;
        expect(file.acl.isPublicWriteAllowed()).be.true;
      });
    });

    it('should be loaded by download', function () {
      var file = new rootDb.File(jsonFile.id);
      return file.download().then(function () {
        expect(file !== jsonFile).to.be.true;
        expect(file.eTag).not.contains('--gzip');
        expect(file.eTag).eql(jsonFile.eTag);
        expect(file.lastModified).gt(new Date(Date.now() - 5 * 60 * 1000));
        expect(file.lastModified).lt(new Date(Date.now() + 5 * 60 * 1000));
        expect(file.createdAt).gt(new Date(Date.now() - 5 * 60 * 1000));
        expect(file.createdAt).lt(new Date(Date.now() + 5 * 60 * 1000));
        expect(file.mimeType.toLowerCase().replace(' ', '')).eql('application/json;charset=utf-8');
        expect(file.size).eql(jsonFile.size);
        expect(file.headers.hello).eql('World');
        expect(file.headers.schmukey).eql('Schmu');
        expect(file.acl.isPublicReadAllowed()).be.true;
        expect(file.acl.isPublicWriteAllowed()).be.true;
      });
    });

    it('should be updated', function () {
      var testAcls = new rootDb.Acl()
        .allowReadAccess(rootDb.User.me)
        .allowWriteAccess(rootDb.User.me);
      var file = new rootDb.File(pngFile.id);
      var creationDate;

      return file.loadMetadata().then(function () {
        creationDate = file.createdAt;
        file.acl.allowReadAccess(rootDb.User.me)
          .allowWriteAccess(rootDb.User.me);
        file.headers.hello = 'No';
        file.headers.schmu = 'SchmuSchmu';
        return helper.sleep(2000);
      }).then(function () {
        return file.saveMetadata();
      }).then(function () {
        expect(file.acl).eql(testAcls);
        expect(file.createdAt.getTime()).equal(creationDate.getTime());
        expect(file.createdAt.getTime()).not.equal(file.lastModified.getTime());
        expect(file.headers.hello).equal('No');
        expect(file.headers.schmu).equal('SchmuSchmu');
      });
    });

    it('should allow file acls in www bucket', function () {
      var testAcls = new rootDb.Acl()
        .allowReadAccess(rootDb.User.me)
        .allowWriteAccess(rootDb.User.me);

      var file = new rootDb.File(jsonFile.id);

      return file.loadMetadata().then(function () {
        file.acl.allowReadAccess(rootDb.User.me)
          .allowWriteAccess(rootDb.User.me);
        return file.saveMetadata();
      }).then(function () {
        expect(file.acl).eql(testAcls);
      });
    });
  });


  describe('delete', function () {
    var uploadFile;
    var fileName;

    before(function () {
      fileName = 'test/' + rootDb.util.uuid();
    });

    beforeEach(function () {
      uploadFile = new rootDb.File({ name: fileName, data: flames });
      return uploadFile.upload({ force: true });
    });

    it('should remove file', function () {
      return uploadFile.delete().then(function () {
        var file = new rootDb.File(uploadFile.id);
        return file.download();
      }).then(function (data) {
        expect(data).be.null;
      });
    });

    it('should remove a removed file', function () {
      var parent = new rootDb.File('/file' + uploadFile.parent + '/');
      expect(parent.name).be.equal('test/');

      return parent.delete().then(function (files) {
        expect(files).length(1);
        expect(files[0].id).equal(uploadFile.id);

        var file = new rootDb.File(uploadFile.id);
        return file.download();
      }).then(function (data) {
        expect(data).be.null;
      });
    });

    it('should remove a removed file', function () {
      new rootDb.File({ name: 'unknown' });
      return uploadFile.delete();
    });

    it('should reject a stale deletion', function () {
      var file = new rootDb.File({ name: fileName, data: dataSvg, type: 'data-url' });
      return expect(file.upload({ force: true }).then(function () {
        return uploadFile.delete();
      })).be.rejectedWith('is out of date');
    });

    it('should remove a stale deletion with force', function () {
      var file = new rootDb.File({ name: fileName, data: dataSvg, type: 'data-url' });
      return file.upload({ force: true }).then(function () {
        return uploadFile.delete({ force: true });
      });
    });
  });

  describe('acl', function () {
    function createUserDb() {
      var em = emf.createEntityManager();
      return em.ready(function () {
        return em.User.register(helper.makeLogin(), 'secret');
      }).then(function () {
        return em;
      });
    }

    var db1,
      db2,
      db3;
    before(function () {
      return Promise.all([
        createUserDb(),
        createUserDb(),
        createUserDb(),
      ]).then(function (dbs) {
        db1 = dbs[0];
        db2 = dbs[1];
        db3 = dbs[2];
      });
    });

    describe('on bucket', function () {
      var uploadFile,
        bucket = 'js_' + DB.util.uuid().replace(/-/g, '_');
      var bucketAcls;

      before(function () {
        bucketAcls = {
          load: new DB.util.Permission().allowAccess(db1.User.me).allowAccess(db2.User.me),
          insert: new DB.util.Permission().allowAccess(db1.User.me),
          update: new DB.util.Permission().allowAccess(db2.User.me),
          delete: new DB.util.Permission().allowAccess(db1.User.me),
          query: new DB.util.Permission().allowAccess(db2.User.me),
        };

        return rootDb.File.saveMetadata(bucket, bucketAcls);
      });

      beforeEach(function () {
        uploadFile = new rootDb.File({ parent: bucket, data: flames });
        return uploadFile.upload({ force: true });
      });

      it('should load the bucket acls', function () {
        return rootDb.File.loadMetadata(bucket).then(function (data) {
          expect(data).eql(bucketAcls);
        });
      });

      it('should allow setting www bucket access', function () {
        return rootDb.File.saveMetadata('www', {}).then(function () {
          return rootDb.File.loadMetadata('www');
        }).then(function (acls) {
          acls.load = new rootDb.util.Permission();
          acls.insert = new rootDb.util.Permission();
          acls.delete = new rootDb.util.Permission();
          acls.query = new rootDb.util.Permission();
          acls.update = new rootDb.util.Permission();
          return rootDb.File.saveMetadata('www', acls);
        }).then(function () {
          return rootDb.File.loadMetadata('www');
        })
          .then(function (acls) {
            expect(acls.load.isPublicAllowed()).to.be.true;
            expect(acls.insert.isPublicAllowed()).to.be.true;
            expect(acls.delete.isPublicAllowed()).to.be.true;
            expect(acls.query.isPublicAllowed()).to.be.true;
            expect(acls.update.isPublicAllowed()).to.be.true;
          })
          .then(function () {
            return rootDb.File.loadMetadata('www');
          })
          .then(function (acls) {
            acls.load = new rootDb.util.Permission().allowAccess(rootDb.User.me);
            acls.insert = new rootDb.util.Permission().allowAccess(rootDb.User.me);
            acls.delete = new rootDb.util.Permission().allowAccess(rootDb.User.me);
            acls.query = new rootDb.util.Permission().allowAccess(rootDb.User.me);
            acls.update = new rootDb.util.Permission().allowAccess(rootDb.User.me);
            return rootDb.File.saveMetadata('www', acls);
          })
          .then(function () {
            return rootDb.File.loadMetadata('www');
          })
          .then(function (acls) {
            expect(acls.load.isPublicAllowed()).to.be.false;
            expect(acls.insert.isPublicAllowed()).to.be.false;
            expect(acls.delete.isPublicAllowed()).to.be.false;
            expect(acls.query.isPublicAllowed()).to.be.false;
            expect(acls.update.isPublicAllowed()).to.be.false;
          })
          .then(function () {
            return rootDb.File.saveMetadata('www', {});
          });
      });

      it('should allow load with load permission', function () {
        var file = new db1.File(uploadFile.id);
        return file.download().then(function (data) {
          expect(file.mimeType).eql('image/png');
          expect(data).eql(flames);
        });
      });

      it('should deny load without load permission', function () {
        var file = new db3.File(uploadFile.id);
        return expect(file.download()).rejectedWith('load permissions are required');
      });

      it('should allow insert with insert permission', function () {
        var file = new db1.File({ parent: bucket, data: flames });
        return file.upload().then(function () {
          expect(file.mimeType).eql('image/png');
        });
      });

      it('should deny insert without insert permission', function () {
        var file = new db2.File({ parent: bucket, data: flames });
        return expect(file.upload()).rejectedWith('insert permissions are required');
      });

      it('should allow update with update permission', function () {
        var file = new db2.File({
          parent: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag,
        });
        return file.upload().then(function () {
          expect(file.mimeType).eql('image/png');
        });
      });

      it('should deny update without update permission', function () {
        var file = new db1.File({
          parent: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag,
        });
        return expect(file.upload()).rejectedWith('update permissions are required');
      });

      it('should allow delete with delete permission', function () {
        var file = new db1.File({
          parent: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag,
        });
        return file.delete();
      });

      it('should deny delete without delete permission', function () {
        var file = new db2.File({
          parent: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag,
        });
        return expect(file.delete()).rejectedWith('delete permissions are required');
      });
    });

    describe('on object', function () {
      var uploadFile,
        bucket = 'js_' + DB.util.uuid().replace(/-/g, '_');

      before(function () {
        return rootDb.File.saveMetadata(bucket, {
          load: new DB.util.Permission(),
          insert: new DB.util.Permission().allowAccess(db1.User.me).allowAccess(db2.User.me),
          update: new DB.util.Permission().allowAccess(db1.User.me).allowAccess(db2.User.me),
          delete: new DB.util.Permission().allowAccess(db1.User.me).allowAccess(db2.User.me),
          query: new DB.util.Permission().allowAccess(db1.User.me).allowAccess(db2.User.me),
        });
      });

      beforeEach(function () {
        var acl = new DB.Acl()
          .allowReadAccess(db1.User.me)
          .allowWriteAccess(db1.User.me)
          .allowReadAccess(db2.User.me);

        uploadFile = new rootDb.File({ parent: bucket, data: flames, acl: acl });
        return uploadFile.upload({ force: true });
      });

      it('should allow load with read permission', function () {
        var file = new db1.File(uploadFile.id);
        return file.download().then(function (data) {
          expect(file.mimeType).eql('image/png');
          expect(data).eql(flames);
          expect(file.acl.isPublicReadAllowed()).be.false;
          expect(file.acl.isPublicWriteAllowed()).be.false;
          expect(file.acl.isReadAllowed(db1.User.me)).be.true;
          expect(file.acl.isReadAllowed(db2.User.me)).be.true;
          expect(file.acl.isReadAllowed(db3.User.me)).be.false;
          expect(file.acl.isWriteAllowed(db1.User.me)).be.true;
          expect(file.acl.isWriteAllowed(db2.User.me)).be.false;
          expect(file.acl.isWriteAllowed(db3.User.me)).be.false;
        });
      });

      it('should deny load without read Permission', function () {
        var file = new db3.File(uploadFile.id);
        return expect(file.download()).eventually.be.null;
      });

      it('should allow update with write Permission', function () {
        var file = new db1.File({
          parent: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag,
        });
        return file.upload().then(function () {
          expect(file.mimeType).eql('image/png');
        });
      });

      it('should deny update without write Permission', function () {
        var file = new db2.File({
          parent: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag,
        });
        return expect(file.upload()).rejectedWith('Write permissions are required');
      });

      it('should allow delete with write Permission', function () {
        var file = new db1.File({
          parent: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag,
        });
        return file.delete();
      });

      it('should deny delete without write Permission', function () {
        var file = new db2.File({
          parent: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag,
        });
        return expect(file.delete()).rejectedWith('Write permissions are required');
      });
    });
  });

  describe('listing files', function () {
    before(function () {
      return rootDb.File.saveMetadata('wwww', {});
    });

    it('should list files in a folder', function () {
      var file1 = new rootDb.File({ parent: '/wwww', name: 'test.png', data: flames });
      var file2 = new rootDb.File({ parent: '/wwww/images', name: 'test1.png', data: flames });
      var file3 = new rootDb.File({ parent: '/wwww/images', name: 'test2.png', data: flames });

      return Promise.all([
        file1.upload().catch(function () {
        }),
        file2.upload().catch(function () {
        }),
        file3.upload().catch(function () {
        }),
      ]).then(function () {
        var folder = new rootDb.File('/file/wwww/');
        return rootDb.File.listFiles(folder);
      }).then(function (files) {
        expect(files.length).eql(2);
        expect(files[0].name).eql('images/');
        expect(files[1].name).eql('test.png');

        var folder = new rootDb.File('/file/wwww/images/');
        return rootDb.File.listFiles(folder);
      }).then(function (files) {
        expect(files.length).eql(2);
        expect(files[0].name).eql('test1.png');
        expect(files[1].name).eql('test2.png');

        var folder = new rootDb.File('/file/wwww/images/');
        return rootDb.File.listFiles(folder, null, 1);
      })
        .then(function (files) {
          expect(files.length).eql(1);
          expect(files[0].name).eql('test1.png');

          var folder = new rootDb.File('/file/wwww/images/');

          return rootDb.File.listFiles(folder, files[0], 1);
        })
        .then(function (files) {
          expect(files.length).eql(1);
          expect(files[0].name).eql('test2.png');
        });
    });


    it('should list buckets', function () {
      return rootDb.File.listBuckets().then(function () {
        return rootDb.File.saveMetadata('listBucketTest', {
          load: new rootDb.util.Permission().allowAccess(rootDb.User.me),
          insert: new rootDb.util.Permission().allowAccess(rootDb.User.me),
          update: new rootDb.util.Permission().allowAccess(rootDb.User.me),
          delete: new rootDb.util.Permission().allowAccess(rootDb.User.me),
          query: new rootDb.util.Permission().allowAccess(rootDb.User.me),
        });
      }).then(function () {
        return rootDb.File.listBuckets();
      }).then(function (buckets) {
        // expect(buckets.length).eql(intialBucketCount + 1);
        expect(buckets.some(function (bucket) {
          return bucket.bucket === 'listBucketTest';
        })).to.be.true;
      });
    });
  });

  describe('client caching', function () {
    // no client caching in node and phantom js
    if (helper.isNode || helper.isPhantomJS) {
      return;
    }

    var uploadFile,
      db,
      jsonBlob;

    before(function () {
      db = emf.createEntityManager();
      jsonBlob = new Blob([JSON.stringify(json)], { type: 'application/json' });

      var rootEmf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage });
      rootEmf.ready().then(function () {
        return rootEmf.code.saveCode('updateFile', 'module', function (module, exports) {
          exports.call = function (codeDb, data) {
            var fileId = data.id;
            var newValue = data.value;
            return new codeDb.File(fileId).upload({ type: 'json', data: newValue, force: true });
          };
        });
      }).then(function () {
        return db.ready();
      });

      return rootDb;
    });

    beforeEach(function () {
      return db.refreshBloomFilter().then(function () {
        uploadFile = new rootDb.File({ data: flames });
        return uploadFile.upload();
      });
    });

    function updateFile(file, newJson) {
      return rootDb.modules.post('updateFile', { id: file.id, value: newJson || json });
    }

    // ie seems not to cache binary resources which are requested via xhr
    if (!helper.isIE && !helper.isIEdge) {
      it('should cache a file', function () {
        var file = new db.File(uploadFile.id);
        return file.download({ type: 'blob' }).then(function (data) {
          expect(file.mimeType.toLowerCase()).eql('image/png');
          expect(data).eql(flames);
          return updateFile(file);
        }).then(function () {
          return file.download({ type: 'blob' });
        }).then(function (data) {
          expect(file.mimeType.toLowerCase()).eql('image/png');
          expect(data).eql(flames);
        });
      });
    }

    it('should revalidate a file', function () {
      var file = new db.File(uploadFile.id);
      return file.download({ type: 'blob' }).then(function (data) {
        expect(file.mimeType.toLowerCase()).eql('image/png');
        expect(data).eql(flames);
        return updateFile(file);
      }).then(function () {
        return db.refreshBloomFilter();
      }).then(function () {
        return file.download({ type: 'json' });
      })
        .then(function (data) {
          expect(file.mimeType.toLowerCase()).string('application/json');
          expect(data).eql(json);
        });
    });

    // ie seems not to cache binary resources which are requested via xhr
    if (!helper.isIE && !helper.isIEdge) {
      it('should cache the url', function () {
        var file = new db.File(uploadFile.id);
        return helper.req(file.url).then(function (data) {
          expect(data.type.toLowerCase()).eql('image/png');
          expect(data).eql(flames);
          return updateFile(file);
        }).then(function () {
          return helper.req(file.url);
        }).then(function (data) {
          expect(data.type.toLowerCase()).eql('image/png');
          expect(data).eql(flames);
        });
      });
    }


    it('should revalidate the url', function () {
      var file = new db.File(uploadFile.id);
      return helper.req(file.url).then(function (data) {
        expect(data.type.toLowerCase()).eql('image/png');
        expect(data).eql(flames);
        return updateFile(file);
      }).then(function () {
        return db.refreshBloomFilter();
      }).then(function () {
        file = new db.File(uploadFile.id);
        return helper.req(file.url);
      })
        .then(function (data) {
          expect(data.type.toLowerCase()).string('application/json');
          expect(data.size).eql(jsonBlob.size);
        });
    });

    it('should force revalidate with cache buster', function () {
      var file = new db.File(uploadFile.id);
      return helper.req(file.url).then(function (data) {
        expect(data.type.toLowerCase()).eql('image/png');
        expect(data).eql(flames);
        return updateFile(file);
      }).then(function () {
        return db.refreshBloomFilter();
      }).then(function () {
        file = new db.File(uploadFile.id);
        return helper.req(file.url);
      })
        .then(function (data) {
          expect(data.type.toLowerCase()).string('application/json');
          expect(data.size).eql(jsonBlob.size);
          return uploadFile.upload({ data: flames, force: true });
        })
        .then(function () {
          return helper.req(file.url);
        })
        .then(function (data) {
          expect(data.type.toLowerCase()).eql('image/png');
          expect(data).eql(flames);
        });
    });
  });
});
