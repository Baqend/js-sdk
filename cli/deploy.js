"use strict";
const fs = require('fs');
const glob = require("glob");
const account = require('./account');
const codePath = 'code';
const handlerTypes = ['update', 'insert', 'delete', 'validate'];
const defaultFilesGlob = 'www/**/*';

module.exports = function(args) {
  if (!args.app && !args.host) {
    return false;
  } else {

    account.login({app: args.app, host: args.host}).then((db) => {
      if (!args.code && !args.files || args.code && args.files) {
        return Promise.all([
          deployFiles(db, args.glob || defaultFilesGlob),
          deployCode(db)
        ]);
      } else if (args.code) {
        return deployCode(db);
      } else if (args.files) {
        return deployFiles(db, args.glob || defaultFilesGlob)
      }
    }).catch((e) => console.error(e));

  }

  return true;
};

function deployFiles(db, pattern) {
  return new Promise((resolve, reject) => {
    glob(pattern, {nodir: true}, (er, files) => {
      if (er)
        reject(er);
      else
        resolve(uploadFiles(db, files));
    });
  }).then(() => {
    console.log('Files upload completed.');
  })
}

function deployCode(db) {
  return readDirectory(codePath).then((fileNames) => {
    return Promise.all(fileNames.map((fileName) => {
      return readStat(`${codePath}/${fileName}`).then((stat) => {
        if (stat.isDirectory()) {
          return uploadHandler(db, fileName);
        } else {
          return uploadCode(db, fileName);
        }
      });
    }));
  }).then(() => {
    console.log('Code deployment completed.');
  }).catch((e) => {
    if (e.errno === -4058) {
      console.log('Error: Code folder not found.')
    }
  });
}

function readStat(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stat) => {
      err ? reject(err) : resolve(stat);
    })
  });
}

function readDirectory(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, fileNames) => {
      err ? reject(err) : resolve(fileNames);
    })
  })
}

function readFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf-8", (err, file) => {
      err ? reject(err) : resolve(file);
    })
  });
}

function uploadHandler(db, directoryName) {
  let bucket = directoryName;

  if (!db[bucket])
    return;

  return readDirectory(`${codePath}/${directoryName}`).then((fileNames) => {
    return Promise.all(fileNames.map((fileName) => {
      let handlerType = fileName.replace(/.js$/, '');
      if (handlerTypes.indexOf(handlerType) > -1) {
        return readFile(`${codePath}/${directoryName}/${fileName}`)
            .then((file) => {
              return db.code.saveCode(bucket, handlerType, file)
            })
            .then(() => {
              console.log(`${handlerType} handler for ${bucket} deployed.`);
            });
      }
    }));
  });
}

function uploadCode(db, name) {
  let moduleName = name.replace(/.js$/, '');
  return readFile(`${codePath}/${name}`).then((file) => {
    return db.code.saveCode(moduleName, 'module', file);
  }).then(() => {
    console.log(`Module ${moduleName} deployed.`);
  });
}

function uploadFiles(db, files) {
  let index = 0;

  var uploads = [];
  for (let i = 0; i < 10; ++i) {
    uploads.push(upload());
  }

  return Promise.all(uploads);

  function upload() {
    if (index < files.length) {
      console.log(`Uploading file ${(index + 1)} of ${files.length}`);
      var file = files[index++];
      return uploadFile(db, file).then(upload);
    }
  }
}

function uploadFile(db, path) {
  let stat = fs.statSync(path);

  let pathPrefix = /^\.?\/?www\//.test('./www/') ? '' : 'www/';
  path = path.replace(/\.\//g, '');

  var file = new db.File({path: pathPrefix + path, data: fs.createReadStream(path), size: stat.size, type: 'stream'});
  return file.upload().catch(function(e) {
    console.error(`Failed to upload file ${path}: ${e.message}`);
  });
}

