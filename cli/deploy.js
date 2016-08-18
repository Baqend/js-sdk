"use strict";
const fs = require('fs');
const glob = require("glob");
const account = require('./account');
const defaultGlob = 'www/**/*';

module.exports = function(args) {
  if (!args.app && !args.host) {
    return false;
  } else {
    let pattern = args.glob || defaultGlob;

    account.login({ app: args.app, host: args.host }).then((db) => {
      return new Promise((resolve, reject) => {
        glob(pattern, { nodir: true }, (er, files) => {
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

  let pathPrefix = /^\.?\/?www\//.test('./www/')? '': 'www/';
  path = path.replace(/\.\//g, '');

  var file = new db.File({path: pathPrefix + path, data: fs.createReadStream(path), size: stat.size, type: 'stream'});
  return file.upload().catch(function(e) {
    console.error('Failed to upload file ' + path + ': ' + e.message);
  });
}

