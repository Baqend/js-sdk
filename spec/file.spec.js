if (typeof DB == 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test file', function() {
  //skip IE9 and node for now
  if (typeof Blob == 'undefined')
    return;

  this.timeout(20 * 1000);

  var flames, rocket, emf, rootDb;
  var dataBase64 = 'data:image/gif;base64,R0lGODlhDAAeALMAAGUJC/SHGvJZI18NDP347fifGeyqlfqqFdjHx/FhIu98HuLY1/NwHvN5G2AMDP///yH5BAAAAAAALAAAAAAMAB4AAARM8MlJ63SWOpzf3t3HVSKolab0qel6mS7LxR6I0OuCw2k9967dj+cYvFAUAJKEGnkKh0OJQggEHgSaRNHoPBheSsJrEIQf5nD6zKZEAAA7';
  var dataSvg = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201%201%22%3E%3Cpath%20d%3D%22m0%2C0v1h1V0%22%2F%3E%3C%2Fsvg%3E';
  var svgBase64 = 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxIDEiPjxwYXRoIGQ9Im0wLDB2MWgxVjAiLz48L3N2Zz4=';
  var html = '<html><head><title>Hallo World</title></head><body>Hallo World</body></html>';
  var json = {
    'Hallo': 'World'
  };
  var arrayBuffer;

  before(function() {
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);

    return Promise.all([helper.asset('flames.png'), helper.asset('rocket.jpg')]).then(function(data) {
      flames = data[0];
      rocket = data[1];
    }).then(function() {
      return emf.createEntityManager().ready().then(function(em) {
        return em.User.login('root', 'root').then(function() {
          rootDb = em;
        });
      });
    }).then(function() {
      return new Promise(function(resolve, reject) {
        var fileReader = new FileReader();
        fileReader.onload = function() {
          arrayBuffer = this.result;
          resolve();
        };
        fileReader.onerror = reject;
        fileReader.readAsArrayBuffer(flames);
      });
    })
  });

  describe('object', function() {
    it('should initialize with default parameters', function() {
      var file = new rootDb.File();
      expect(file.id).eql('/file/www/' + file.key);
      expect(file.key).is.defined;
      expect(file.bucket).eql('www');
      expect(file.folder).eql('/www');
      expect(file.name).eql(file.key);

      expect(function() {
        file.acl;
      }).throw('is not available');

      expect(function() {
        file.lastModified;
      }).throw('is not available');

      expect(function() {
        file.eTag;
      }).throw('is not available');

      expect(function() {
        file.mimeType;
      }).throw('is not available');
    });

    it('should initialize with string parameter', function() {
      var file = new rootDb.File('/file/test/myFile.txt');
      expect(file.id).eql('/file/test/myFile.txt');
      expect(file.key).eql('myFile.txt');
      expect(file.bucket).eql('test');
      expect(file.folder).eql('/test');
      expect(file.name).eql('myFile.txt');

      expect(function() {
        file.acl;
      }).throw('is not available');

      expect(function() {
        file.lastModified;
      }).throw('is not available');

      expect(function() {
        file.eTag;
      }).throw('is not available');

      expect(function() {
        file.mimeType;
      }).throw('is not available');
    });

    it('should initialize with deep path parameter', function() {
      var file = new rootDb.File('/file/test/my/deep/path/myFile.txt');
      expect(file.id).eql('/file/test/my/deep/path/myFile.txt');
      expect(file.key).eql('my/deep/path/myFile.txt');
      expect(file.bucket).eql('test');
      expect(file.folder).eql('/test/my/deep/path');
      expect(file.name).eql('myFile.txt');
    });

    it('should reject invalid path', function() {
      expect(function() {
        new rootDb.File('/file/myFile.txt');
      }).throw('Invalid file reference');

      expect(function() {
        new rootDb.File('/test/bucket/myFile.txt');
      }).throw('Invalid file reference');

      expect(function() {
        new rootDb.File('/file/bucket/');
      }).throw('Invalid file reference');
    });

    it('should initialize with data parameters', function() {
      var file = new rootDb.File({name: 'test.png', data: flames});
      expect(file.id).eql('/file/www/' + file.key);
      expect(file.key).eql('test.png');
      expect(file.bucket).eql('www');
      expect(file.folder).eql('/www');
      expect(file.name).eql('test.png');
      expect(file.acl).is.defined;
      expect(file.acl.isPublicReadAllowed()).be.true;
      expect(file.acl.isPublicWriteAllowed()).be.true;
      expect(file.lastModified).be.undefined;
      expect(file.eTag).be.undefined;
      expect(file.mimeType).eql('image/png');
    });

    it('should initialize with file parameter', function() {
      return helper.asset('flames.png').then(function(f) {
        f.name = 'file.png';
        f.lastModifiedDate = new Date();

        var file = new rootDb.File({data: f});
        expect(file.id).eql('/file/www/' + file.key);
        expect(file.key).eql('file.png');
        expect(file.bucket).eql('www');
        expect(file.folder).eql('/www');
        expect(file.name).eql('file.png');
        expect(file.acl).is.defined;
        expect(file.acl.isPublicReadAllowed()).be.true;
        expect(file.acl.isPublicWriteAllowed()).be.true;
        expect(file.lastModified).be.undefined;
        expect(file.eTag).be.undefined;
        expect(file.mimeType).eql('image/png');
      });
    });

    it('should initialize with base64 parameter', function() {
      var file = new rootDb.File({data: svgBase64, type: 'base64', mimeType: 'image/svg+xml'});
      expect(file.id).eql('/file/www/' + file.key);
      expect(file.key).is.defined;
      expect(file.bucket).eql('www');
      expect(file.folder).eql('/www');
      expect(file.name).eql(file.key);
      expect(file.acl).is.defined;
      expect(file.acl.isPublicReadAllowed()).be.true;
      expect(file.acl.isPublicWriteAllowed()).be.true;
      expect(file.lastModified).be.undefined;
      expect(file.eTag).be.undefined;
      expect(file.mimeType).eql('image/svg+xml');
    });

    it('should initialize with data-url base64 parameter', function() {
      var file = new rootDb.File({data: dataBase64, type: 'data-url'});
      expect(file.id).eql('/file/www/' + file.key);
      expect(file.key).is.defined;
      expect(file.bucket).eql('www');
      expect(file.folder).eql('/www');
      expect(file.name).eql(file.key);
      expect(file.acl).is.defined;
      expect(file.acl.isPublicReadAllowed()).be.true;
      expect(file.acl.isPublicWriteAllowed()).be.true;
      expect(file.lastModified).be.undefined;
      expect(file.eTag).be.undefined;
      expect(file.mimeType).eql('image/gif');
    });

    it('should initialize with data-url parameter', function() {
      var file = new rootDb.File({data: dataSvg, type: 'data-url'});
      expect(file.id).eql('/file/www/' + file.key);
      expect(file.key).is.defined;
      expect(file.bucket).eql('www');
      expect(file.folder).eql('/www');
      expect(file.name).eql(file.key);
      expect(file.acl).is.defined;
      expect(file.acl.isPublicReadAllowed()).be.true;
      expect(file.acl.isPublicWriteAllowed()).be.true;
      expect(file.lastModified).be.undefined;
      expect(file.eTag).be.undefined;
      expect(file.mimeType).eql('image/svg+xml');
    });

    it('should initialize with all parameters', function() {
      return helper.asset('flames.png').then(function(f) {
        f.name = 'file.png';
        f.lastModifiedDate = new Date();

        var acl = new rootDb.Acl();
        acl.allowReadAccess(rootDb.User.me);
        acl.allowWriteAccess(rootDb.User.me);
        
        var date = new Date("01-01-2016");
        
        var file = new rootDb.File({
          data: f,
          type: 'blob',
          name: 'my.png',
          folder: '/www/test',
          mimeType: 'text/html',
          lastModified: date,
          acl: acl,
          eTag: '827598375'
        });

        expect(file.id).eql('/file/www/test/my.png');
        expect(file.key).eql('test/my.png');
        expect(file.bucket).eql('www');
        expect(file.folder).eql('/www/test');
        expect(file.name).eql('my.png');
        expect(file.acl).eql(acl);
        expect(file.lastModified).eq(date);
        expect(file.eTag).eql('827598375');
        expect(file.mimeType).eql('text/html');
      });
    });

    it('should initialize with folder and name parameters', function() {
      var file = new rootDb.File({folder: '/testfolder', name: 'test.png'});
      expect(file.id).eql('/file/testfolder/test.png');
      expect(file.key).eql('test.png');
      expect(file.bucket).eql('testfolder');
      expect(file.folder).eql('/testfolder');
      expect(file.name).eql('test.png');
    });

    it('should initialize with folder and name parameters', function() {
      var file = new rootDb.File({folder: 'testfolder', name: 'test.png'});
      expect(file.id).eql('/file/testfolder/test.png');
      expect(file.key).eql('test.png');
      expect(file.bucket).eql('testfolder');
      expect(file.folder).eql('/testfolder');
      expect(file.name).eql('test.png');
    });

    it('should initialize with folder and name parameters', function() {
      var file = new rootDb.File({folder: '/testfolder/', name: 'test.png'});
      expect(file.id).eql('/file/testfolder/test.png');
      expect(file.key).eql('test.png');
      expect(file.bucket).eql('testfolder');
      expect(file.folder).eql('/testfolder');
      expect(file.name).eql('test.png');
    });

    it('should initialize with deep folder', function() {
      var file = new rootDb.File({folder: '/deep/test/folder/', name: 'test.png'});
      expect(file.id).eql('/file/deep/test/folder/test.png');
      expect(file.key).eql('test/folder/test.png');
      expect(file.bucket).eql('deep');
      expect(file.folder).eql('/deep/test/folder');
      expect(file.name).eql('test.png');
    });

    it('should reject invalid folder', function() {
      expect(function() {
        new rootDb.File({folder: '/', name: 'test.png'});
      }).throw('Invalid folder name');

      var file = new rootDb.File({folder: '', name: 'test.png'});
      expect(file.folder).eql('/www');
    });

    it('should reject invalid file name', function() {
      expect(function() {
        new rootDb.File({folder: '/www', name: '/test.png'});
      }).throw('Invalid file name');

      expect(function() {
        new rootDb.File({folder: '/www', name: 'test/test.png'});
      }).throw('Invalid file name');

      var file = new rootDb.File({folder: '/www', name: ''});
      expect(file.name).not.eql('');
    });
  });

  describe('url', function() {
    var anonymousDB, uploadFile;

    before(function() {
      anonymousDB = emf.createEntityManager();
      return anonymousDB.ready().then(function() {
        var acl = new DB.Acl()
            .allowReadAccess(rootDb.User.me)
            .allowWriteAccess(rootDb.User.me);

        uploadFile = new rootDb.File({folder: "private_bucket", data: flames, acl: acl});
        return uploadFile.upload();
      })
    });

    it('should not contains credentials for anonymous user', function() {
      var file = new anonymousDB.File({name: 'public.png'});
      expect(file.url).eql(env.TEST_SERVER + '/file/www/public.png');
    });

    it('should not contains credentials for anonymous user in none www bucket', function() {
      var file = new anonymousDB.File({folder: '/testfolder/', name: 'private.png'});
      expect(file.url).eql(env.TEST_SERVER + '/file/testfolder/private.png');
    });

    it('should not contains credentials for the www bucket', function() {
      var file = new rootDb.File({name: 'public.png'});
      expect(file.url).eql(env.TEST_SERVER + '/file/www/public.png');
    });

    it('should contains credentials for none www bucket', function() {
      var file = new rootDb.File({folder: '/testfolder/', name: 'private.png'});
      expect(file.url).string(env.TEST_SERVER + '/file/testfolder/private.png?BAT=');
    });

    it('should provide no access for none authorized user', function() {
      var file = new anonymousDB.File(uploadFile.id);
      return expect(helper.req(file.url)).be.rejectedWith({status: 466});
    });

    it('should provide access for authorized user', function() {
      var file = new rootDb.File(uploadFile.id);
      return helper.req(file.url).then(function(data) {
        expect(data).be.eql(flames);
      });
    });
  });

  describe('upload', function() {
    it('should denied for anonymous', function() {
      var file;
      return expect(emf.createEntityManager().ready().then(function(db) {
        file = new db.File({data: flames});
        return file.upload();
      })).rejectedWith('insert permissions are required');
    });

    it('should handle conditional update', function() {
      var file = new rootDb.File({data: flames});
      return file.upload().then(function() {
        return file.upload({data: dataSvg, type: 'data-url'});
      }).then(function() {
        expect(file.mimeType).string('image/svg+xml')
      });
    });

    it('should reject stale insertion', function() {
      var file = new rootDb.File({data: flames});
      return expect(file.upload().then(function() {
        return new rootDb.File(file.id).upload({data: flames});
      })).be.rejectedWith('exists already');
    });

    it('should reject stale update', function() {
      var file = new rootDb.File({data: flames});
      return expect(file.upload().then(function() {
        return new rootDb.File(file.id).upload({data: dataSvg, type: 'data-url', force: true});
      }).then(function() {
        return file.upload({data: dataBase64, type: 'data-url'});
      })).be.rejectedWith('out of date');
    });

    it('should allow stale update with force', function() {
      var file = new rootDb.File({data: flames});
      return file.upload().then(function() {
        return new rootDb.File(file.id).upload({data: dataSvg, type: 'data-url', force: true});
      }).then(function() {
        return file.upload({data: dataBase64, type: 'data-url', force: true});
      }).then(function() {
        expect(file.mimeType).eql('image/gif');
      });
    });

    it('should upload blob format', function() {
      var file = new rootDb.File({data: flames});
      return file.upload().then(function() {
        expect(file.eTag).is.defined;
        expect(file.lastModified).gt(new Date(Date.now() - 5 * 60 * 1000));
        expect(file.lastModified).lt(new Date(Date.now() + 5 * 60 * 1000));
        expect(file.mimeType).eql('image/png');
      });
    });

    it('should upload json format', function() {
      var file = new rootDb.File({data: json});
      return file.upload().then(function() {
        expect(file.mimeType.toLowerCase()).eql('application/json; charset=utf-8');
      });
    });

    it('should upload text format', function() {
      var file = new rootDb.File({data: html, mimeType: 'text/html;charset=utf-8'});
      return file.upload().then(function() {
        expect(file.mimeType.toLowerCase()).eql('text/html; charset=utf-8');
      });
    });

    it('should upload base64 format', function() {
      var file = new rootDb.File({data: svgBase64, type: 'base64', mimeType: 'image/svg+xml'});
      return file.upload().then(function() {
        expect(file.mimeType).string('image/svg+xml');
      });
    });

    it('should upload data-url base64 format', function() {
      var file = new rootDb.File({data: dataBase64, type: 'data-url'});
      return file.upload().then(function() {
        expect(file.mimeType).eql('image/gif');
      });
    });

    it('should upload data-url format', function() {
      var file = new rootDb.File({data: dataSvg, type: 'data-url'});
      return file.upload().then(function() {
        expect(file.mimeType).string('image/svg+xml');
      });
    });

    it('should upload arraybuffer format', function() {
      var file = new rootDb.File({data: arrayBuffer, mimeType: 'image/png'});
      return file.upload().then(function() {
        expect(file.mimeType).eql('image/png');
      });
    });

    it('should upload auto detect data-url format', function() {
      var file = new rootDb.File({data: dataSvg});
      return file.upload().then(function() {
        expect(file.mimeType).string('image/svg+xml');
        return file.download({type: 'base64'})
      }).then(function(data) {
        expect(file.mimeType).string('image/svg+xml');
        expect(data).eql(svgBase64);
      });
    });
  });

  describe('download', function() {
    var pngFile, jsonFile, htmlFile, gifFile, svgFile;

    before(function() {
      pngFile = new rootDb.File({data: flames});
      jsonFile = new rootDb.File({data: json});
      htmlFile = new rootDb.File({data: html, mimeType: 'text/html;charset=utf-8'});
      gifFile = new rootDb.File({data: dataBase64, type: 'data-url'});
      svgFile = new rootDb.File({data: dataSvg, type: 'data-url'});

      return Promise.all([
        pngFile.upload(),
        jsonFile.upload(),
        htmlFile.upload(),
        gifFile.upload(),
        svgFile.upload()
      ]);
    });

    it('should stored under specified name', function() {
      var file = new rootDb.File(pngFile.id);
      return file.download().then(function(data) {
        expect(data).instanceof(Blob);
        expect(file.eTag).eql(pngFile.eTag);
        expect(file.lastModified).gt(new Date(Date.now() - 5 * 60 * 1000));
        expect(file.lastModified).lt(new Date(Date.now() + 5 * 60 * 1000));
        expect(file.mimeType).eql('image/png');
        expect(file.acl.isPublicReadAllowed()).be.true;
        expect(file.acl.isPublicWriteAllowed()).be.true;
      });
    });

    it('should be downloadable as anonymous', function() {
      var file;
      return emf.createEntityManager().ready().then(function(db) {
        file = new db.File(pngFile.id);
        return file.download();
      }).then(function(data) {
        expect(data).instanceof(Blob);
        expect(file.eTag).eql(pngFile.eTag);
        expect(file.lastModified).gt(new Date(Date.now() - 5 * 60 * 1000));
        expect(file.lastModified).lt(new Date(Date.now() + 5 * 60 * 1000));
        expect(file.mimeType).eql('image/png');
        expect(file.acl.isPublicReadAllowed()).be.true;
        expect(file.acl.isPublicWriteAllowed()).be.true;
      });
    });

    it('should download blob format', function() {
      var file = new rootDb.File(pngFile.id);
      return file.download({type: 'blob'}).then(function(data) {
        expect(file.mimeType.toLowerCase()).eql('image/png');
        expect(data).eql(flames);
      });
    });

    it('should download json format', function() {
      var file = new rootDb.File(jsonFile.id);
      return file.download({type: 'json'}).then(function(data) {
        expect(file.mimeType.toLowerCase()).eql('application/json; charset=utf-8');
        expect(data).eql(json);
      });
    });

    it('should download text format', function() {
      var file = new rootDb.File(htmlFile.id);
      return file.download({type: 'text'}).then(function(data) {
        expect(file.mimeType.toLowerCase()).eql('text/html;charset=utf-8');
        expect(data).eql(html);
      });
    });

    it('should download base64 format', function() {
      var file = new rootDb.File(svgFile.id);
      return file.download({type: 'base64'}).then(function(data) {
        expect(file.mimeType).string('image/svg+xml');
        expect(data).eql(svgBase64);
      });
    });

    it('should download data-url base64 format', function() {
      var file = new rootDb.File(gifFile.id);
      return file.download({type: 'data-url'}).then(function(data) {
        expect(file.mimeType).eql('image/gif');
        expect(data).eql(dataBase64);
      });
    });

    it('should download data-url format', function() {
      var file = new rootDb.File(svgFile.id);
      return file.download({type: 'data-url'}).then(function(data) {
        expect(file.mimeType).string('image/svg+xml');
        expect(data).string(svgBase64);
        expect(data).string('data:image/svg+xml');
      });
    });

    it('should download arraybuffer format', function() {
      var file = new rootDb.File(pngFile.id);
      return file.download({type: 'arraybuffer'}).then(function(data) {
        expect(file.mimeType).eql('image/png');
        expect(data).eql(arrayBuffer);
      });
    });
  });

  describe('delete', function() {
    var uploadFile;
    var fileName;

    before(function() {
      fileName = rootDb.util.uuid()
    });

    beforeEach(function() {
      uploadFile = new rootDb.File({name: fileName, data: flames});
      return uploadFile.upload({force: true});
    });

    it('should remove file', function() {
      return uploadFile.delete().then(function() {
        var file = new rootDb.File(uploadFile.id);
        return file.download();
      }).then(function(data) {
        expect(data).be.null;
      });
    });

    it('should remove a removed file', function() {
      var file = new rootDb.File({name: 'unknown'});
      return uploadFile.delete();
    });

    it('should reject a stale deletion', function() {
      var file = new rootDb.File({name: fileName, data: dataSvg, type: 'data-url'});
      return expect(file.upload({force: true}).then(function() {
        return uploadFile.delete();
      })).be.rejectedWith('is out of date');
    });

    it('should remove a stale deletion with force', function() {
      var file = new rootDb.File({name: fileName, data: dataSvg, type: 'data-url'});
      return file.upload({force: true}).then(function() {
        return uploadFile.delete({force: true});
      });
    });
  });

  describe('acl', function() {
    function createUserDb() {
      var em = emf.createEntityManager();
      return em.User.register(helper.makeLogin(), 'secret').then(function() {
        return em;
      });
    }

    var db1, db2, db3;
    before(function() {
      return Promise.all([
        createUserDb(),
        createUserDb(),
        createUserDb()
      ]).then(function(dbs) {
        db1 = dbs[0];
        db2 = dbs[1];
        db3 = dbs[2];
      });
    });

    describe('on bucket', function() {
      var uploadFile, bucket = "js_" + DB.util.uuid().replace(/-/g, '_');

      before(function() {
        return rootDb.File.saveMetadata(bucket, {
          load: new DB.util.Permission().allowAccess(db1.User.me).allowAccess(db2.User.me),
          insert: new DB.util.Permission().allowAccess(db1.User.me),
          update: new DB.util.Permission().allowAccess(db2.User.me),
          delete: new DB.util.Permission().allowAccess(db1.User.me),
          query: new DB.util.Permission().allowAccess(db2.User.me)
        });
      });

      beforeEach(function() {
        uploadFile = new rootDb.File({folder: bucket, data: flames});
        return uploadFile.upload({force: true});
      });

      it('should allow load with load permission', function() {
        var file = new db1.File(uploadFile.id);
        return file.download().then(function(data) {
          expect(file.mimeType).eql('image/png');
          expect(data).eql(flames);
        });
      });

      it('should deny load without load permission', function() {
        var file = new db3.File(uploadFile.id);
        return expect(file.download()).rejectedWith('load permissions are required');
      });

      it('should allow insert with insert permission', function() {
        var file = new db1.File({folder: bucket, data: flames});
        return file.upload().then(function() {
          expect(file.mimeType).eql('image/png');
        });
      });

      it('should deny insert without insert permission', function() {
        var file = new db2.File({folder: bucket, data: flames});
        return expect(file.upload()).rejectedWith('insert permissions are required');
      });

      it('should allow update with update permission', function() {
        var file = new db2.File({folder: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag});
        return file.upload().then(function() {
          expect(file.mimeType).eql('image/png');
        });
      });

      it('should deny update without update permission', function() {
        var file = new db1.File({folder: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag});
        return expect(file.upload()).rejectedWith('update permissions are required');
      });

      it('should allow delete with delete permission', function() {
        var file = new db1.File({folder: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag});
        return file.delete();
      });

      it('should deny delete without delete permission', function() {
        var file = new db2.File({folder: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag});
        return expect(file.delete()).rejectedWith('delete permissions are required');
      });
    });

    describe('on object', function() {
      var uploadFile, bucket = "js_" + DB.util.uuid().replace(/-/g, '_');

      before(function() {
        return rootDb.File.saveMetadata(bucket, {
          load: new DB.util.Permission(),
          insert: new DB.util.Permission().allowAccess(db1.User.me).allowAccess(db2.User.me),
          update: new DB.util.Permission().allowAccess(db1.User.me).allowAccess(db2.User.me),
          delete: new DB.util.Permission().allowAccess(db1.User.me).allowAccess(db2.User.me),
          query: new DB.util.Permission().allowAccess(db1.User.me).allowAccess(db2.User.me)
        });
      });

      beforeEach(function() {
        var acl = new DB.Acl()
          .allowReadAccess(db1.User.me)
          .allowWriteAccess(db1.User.me)
          .allowReadAccess(db2.User.me);

        uploadFile = new rootDb.File({folder: bucket, data: flames, acl: acl});
        return uploadFile.upload({force: true});
      });

      it('should allow load with read permission', function() {
        var file = new db1.File(uploadFile.id);
        return file.download().then(function(data) {
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

      it('should deny load without read Permission', function() {
        var file = new db3.File(uploadFile.id);
        return expect(file.download()).eventually.be.null;
      });

      it('should allow update with write Permission', function() {
        var file = new db1.File({folder: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag});
        return file.upload().then(function() {
          expect(file.mimeType).eql('image/png');
        });
      });

      it('should deny update without write Permission', function() {
        var file = new db2.File({folder: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag});
        return expect(file.upload()).rejectedWith('Write permissions are required');
      });

      it('should allow delete with write Permission', function() {
        var file = new db1.File({folder: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag});
        return file.delete();
      });

      it('should deny delete without write Permission', function() {
        var file = new db2.File({folder: bucket, name: uploadFile.name, data: flames, eTag: uploadFile.eTag});
        return expect(file.delete()).rejectedWith('Write permissions are required');
      });
    });
  });

  describe('client caching', function() {

    // no client caching in node and phantom js
    if (helper.isNode || helper.isPhantomJS) {
      return;
    }

    var uploadFile, db, jsonBlob = new Blob(['{"Hallo":"World"}'], {type: 'application/json'});

    before(function() {
      db = emf.createEntityManager();

      var rootEmf = new DB.EntityManagerFactory({host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage});
      rootEmf.ready().then(function() {
        return rootEmf.code.saveCode('updateFile', 'module', function(module, exports) {
          exports.call = function(db, data) {
            var fileId = data.id;
            var newValue = data.value;
            return new db.File(fileId).upload({type: 'json', data: newValue, force: true});
          }
        });
      }).then(function() {
        return db.ready();
      });

      return rootDb
    });

    beforeEach(function() {
      return db.refreshBloomFilter().then(function() {
        uploadFile = new rootDb.File({data: flames});
        return uploadFile.upload();
      });
    });

    function updateFile(file, newJson) {
      return rootDb.modules.post('updateFile', {id: file.id, value: newJson || json});
    }

    //ie seems not to cache binary resources which are requested via xhr
    if (!helper.isIE && !helper.isIEdge) {
      it('should cache a file', function() {
        var file = new db.File(uploadFile.id);
        return file.download({type: 'blob'}).then(function(data) {
          expect(file.mimeType.toLowerCase()).eql('image/png');
          expect(data).eql(flames);
          return updateFile(file);
        }).then(function() {
          return file.download({type: 'blob'});
        }).then(function(data) {
          expect(file.mimeType.toLowerCase()).eql('image/png');
          expect(data).eql(flames);
        });
      });
    }

    it('should revalidate a file', function() {
      var file = new db.File(uploadFile.id);
      return file.download({type: 'blob'}).then(function(data) {
        expect(file.mimeType.toLowerCase()).eql('image/png');
        expect(data).eql(flames);
        return updateFile(file);
      }).then(function() {
        return db.refreshBloomFilter();
      }).then(function() {
        return file.download({type: 'json'});
      }).then(function(data) {
        expect(file.mimeType.toLowerCase()).string('application/json');
        expect(data).eql(json);
      });
    });

    //ie seems not to cache binary resources which are requested via xhr
    if (!helper.isIE && !helper.isIEdge) {
      it('should cache the url', function() {
        var file = new db.File(uploadFile.id);
        return helper.req(file.url).then(function(data) {
          expect(data.type.toLowerCase()).eql('image/png');
          expect(data).eql(flames);
          return updateFile(file);
        }).then(function() {
          return helper.req(file.url);
        }).then(function(data) {
          expect(data.type.toLowerCase()).eql('image/png');
          expect(data).eql(flames);
        });
      });
    }


    it('should revalidate the url', function() {
      var file = new db.File(uploadFile.id);
      return helper.req(file.url).then(function(data) {
        expect(data.type.toLowerCase()).eql('image/png');
        expect(data).eql(flames);
        return updateFile(file);
      }).then(function() {
        return db.refreshBloomFilter();
      }).then(function() {
        return helper.req(file.url);
      }).then(function(data) {
        expect(data.type.toLowerCase()).string('application/json');
        expect(data.size).eql(jsonBlob.size);
      });
    });

    it('should force revalidate with cache buster', function() {
      var file = new db.File(uploadFile.id);
      return helper.req(file.url).then(function(data) {
        expect(data.type.toLowerCase()).eql('image/png');
        expect(data).eql(flames);
        return updateFile(file);
      }).then(function() {
        return db.refreshBloomFilter();
      }).then(function() {
        return helper.req(file.url);
      }).then(function(data) {
        expect(data.type.toLowerCase()).string('application/json');
        expect(data.size).eql(jsonBlob.size);
        return uploadFile.upload({data: flames, force: true});
      }).then(function() {
        return helper.req(file.url);
      }).then(function(data) {
        expect(data.type.toLowerCase()).eql('image/png');
        expect(data).eql(flames);
      });
    });
  });

});