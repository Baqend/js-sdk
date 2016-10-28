"use strict";
const fs = require('fs');
const glob = require("glob");
const account = require('./account');
const handlerTypes = ['update', 'insert', 'delete', 'validate'];
const path = require('path');

module.exports = function(args) {
  if (!args.app && !args.host) {
    return false;
  } else {
    return account.login({app: args.app, host: args.host}).then((db) => {
      if (!args.code && !args.files || args.code && args.files) {
        return Promise.all([
          deployFiles(db, args.fileDir, args.fileGlob),
          deployCode(db, args.codeDir)
        ]);
      } else if (args.code) {
        return deployCode(db, args.codeDir);
      } else if (args.files) {
        return deployFiles(db, args.fileDir, args.fileGlob);
      }
    });
  }
};

function deployFiles(db, cwd, pattern) {
  return new Promise((resolve, reject) => {
    glob(pattern, {nodir: true, cwd}, (er, files) => {
      if (er)
        reject(er);
      else
        resolve(uploadFiles(db, files, cwd));
    });
  }).then((result) => {
    if (result && result.length > 0) {
      console.log('Files upload completed.');
    } else {
      console.error('No files found.');
    }
  })
}

function deployCode(db, codePath) {
  return readDirectory(codePath).then((fileNames) => {
    return Promise.all(fileNames.map((fileName) => {
      return readStat(path.join(codePath, fileName)).then((stat) => {
        if (stat.isDirectory()) {
          return uploadHandler(db, fileName, codePath);
        } else {
          return uploadCode(db, fileName, codePath);
        }
      });
    }));
  }).then(() => {
    console.log('Code deployment completed.');
  }).catch((e) => {
    console.error(`Failed to deploy code: ${e.message}`);
  });
}

function readStat(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stat) => {
      err ? reject(err) : resolve(stat);
    })
  });
}

function readDirectory(filePath) {
  return new Promise((resolve, reject) => {
    fs.readdir(filePath, (err, fileNames) => {
      err ? reject(err) : resolve(fileNames);
    })
  })
}

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, file) => {
      err ? reject(err) : resolve(file);
    })
  });
}

function uploadHandler(db, directoryName, codePath) {
  let bucket = directoryName;

  if (!db[bucket])
    return;

  return readDirectory(path.join(codePath,directoryName)).then((fileNames) => {
    return Promise.all(fileNames.map((fileName) => {
      let handlerType = fileName.replace(/.js$/, '');

      if (handlerTypes.indexOf(handlerType) == -1)
        return;

      return readFile(path.join(codePath, directoryName, fileName))
          .then((file) => db.code.saveCode(bucket, handlerType, file))
          .then(() => console.log(`${handlerType} handler for ${bucket} deployed.`));
    }));
  });
}

function uploadCode(db, name, codePath) {
  let moduleName = name.replace(/.js$/, '');
  return readFile(path.join(codePath, name)).then((file) => {
    return db.code.saveCode(moduleName, 'module', file);
  }).then(() => {
    console.log(`Module ${moduleName} deployed.`);
  });
}

function uploadFiles(db, files, cwd) {
  let index = 0;

  var uploads = [];
  for (let i = 0; i < 10 && i < files.length-1; ++i) {
    uploads.push(upload());
  }

  return Promise.all(uploads);

  function upload() {
    if (index < files.length) {
      console.log(`Uploading file ${(index + 1)} of ${files.length}`);
      var file = files[index++];
      return uploadFile(db, file, cwd).then(upload);
    }
  }
}

function uploadFile(db, filePath, cwd) {
  let fullFilePath = path.join(cwd, filePath);

  let stat = fs.statSync(fullFilePath);

  var file = new db.File({path: `/www/${filePath}`, data: fs.createReadStream(fullFilePath), size: stat.size, type: 'stream'});
  return file.upload({ force: true }).catch(function(e) {
    console.error(`Failed to upload file ${filePath}: ${e.message}`);
  });
}

