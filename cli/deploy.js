"use strict";
const fs = require('fs');
const glob = require("glob");
const account = require('./account');
const schema = require('./schema');
const handlerTypes = ['update', 'insert', 'delete', 'validate'];
const path = require('path');
const readline = require('readline');

module.exports = function(args) {

  return account.login({app: args.app, host: args.host}).then((db) => {
    let promises = []
    if (!args.code && !args.files || args.code && args.files) {
      promises.push(deployFiles(db, args.bucketPath, args.fileDir, args.fileGlob))
      promises.push(deployCode(db, args.codeDir))
    } else if (args.code) {
      promises.push(deployCode(db, args.codeDir));
    } else if (args.files) {
      promises.push(deployFiles(db, args.bucketPath, args.fileDir, args.fileGlob));
    }
    if (args.schema) {
      promises.push(schema.uploadSchema(db))
    }
    return Promise.all(promises);
  }).catch(e => console.error(e.message ||e));
};

function deployFiles(db, path, cwd, pattern) {
  while (path.length && path.charAt(0) === '/')
    path = path.substring(1);

  while (path.length && path.charAt(path.length - 1) === '/')
    path = path.substring(0, path.length - 1);

  if (!path.length) {
    console.error('Invalid bucket-path ' + path);
    return;
  }

  return new Promise((resolve, reject) => {
    glob(pattern, {nodir: true, cwd}, (er, files) => {
      if (er)
        reject(er);
      else
        resolve(uploadFiles(db, path, files, cwd));
    });
  }).then((result) => {
    if (result && result.length > 0) {
      console.log('File deployment completed.');
    } else {
      console.warn('Your specified upload folder is empty, no files were uploaded.');
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
    })).then(() => {
      console.log('Code deployment completed.');
    }).catch((e) => {
      console.error(`Failed to deploy code: ${e.message}`);
    });
  }).catch(() => {
    console.warn('Your specified backend code folder is empty, no backend code was deployed.');
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

/**
 * Reads a file from disk.
 *
 * @param {string} filePath The file path to read from.
 * @return {Promise<string>} Resolves with a UTF-8 encoded string of the file contents.
 */
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

function uploadFiles(db, bucket, files, cwd) {
  let isTty = process.stdout.isTTY;
  let index = 0;

  let uploads = [];
  for (let i = 0; i < 10 && i < files.length; ++i) {
    uploads.push(upload());
  }

  if (!isTty) {
    console.log(`Uploading ${files.length} files.`)
  }

  return Promise.all(uploads);

  function upload() {
    if (index < files.length) {
      if (isTty) {
        if (index > 0) {
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);
        }
        process.stdout.write(`Uploading file ${(index + 1)} of ${files.length}`);
      }

      var file = files[index++];

      if (isTty && index == files.length) {
        console.log(''); //add a final linebreak
      }

      return uploadFile(db, bucket, file, cwd).then(upload);
    }
  }
}

function uploadFile(db, bucket, filePath, cwd) {
  let fullFilePath = path.join(cwd, filePath);

  let stat = fs.statSync(fullFilePath);

  let file = new db.File({path: `/${bucket}/${filePath}`, data: fs.createReadStream(fullFilePath), size: stat.size, type: 'stream'});
  return file.upload({ force: true }).catch(function(e) {
    console.error(`Failed to upload file ${filePath}: ${e.message}`);
  });
}
