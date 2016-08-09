"use strict";
const fs = require('fs');
const baqend = require('../lib/baqend');
const glob = require("glob");

module.exports = function(args) {
  if (!args.app || !args.secret || !args.glob) {
    return false;
  } else {
    const factory = new baqend.EntityManagerFactory({host: args.app, secure: true, tokenStorageFactory: {
      create(origin) {
        return new baqend.util.TokenStorage(origin, args.secret);
      }
    }});

    factory.createEntityManager(true).ready().then((db) => {
      return new Promise((resolve, reject) => {
        glob(args.glob, {nodir: true}, (er, files) => {
          if (er)
            reject(er);
          else
            resolve(uploadFiles(db, files));
        });
      }).then(() => {
        console.log('Upload completed.');
      })
    }).catch((e) => console.error(e));
  }

  return true;
};

function uploadFiles(db, files) {
  let index = 0;

  var uploads = [];
  for (let i = 0; i < 10; ++i) {
    uploads.push(upload());
  }

  return Promise.all(uploads);

  function upload() {
    if (index < files.length) {
      console.log('Uploading file ' + (index + 1) + ' of ' + files.length);
      var file = files[index++];
      return uploadFile(db, file).then(upload);
    }
  }
}

function uploadFile(db, path) {
  let stat = fs.statSync(path);

  var file = new db.File({path: "/www/" + path, data: fs.createReadStream(path), size: stat.size, type: 'stream'});
  return file.upload().catch(function(e) {
    console.error('Failed to upload file ' + path + ': ' + e.message);
  });
}