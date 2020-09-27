"use strict";
const fs = require('fs');
const glob = require("glob");
const account = require('./account');
const schema = require('./schema');
const handlerTypes = ['update', 'insert', 'delete', 'validate'];
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

let IS_TTY = process.stdout.isTTY;

module.exports = function(args) {
  return account.login(args).then((db) => {
    let promises = []
    if (!args.code && !args.files || args.code && args.files) {
      promises.push(deployFiles(db, args.bucketPath, args.fileDir, args.fileGlob, args.cleanUp, args.uploadLimit))
      promises.push(deployCode(db, args.codeDir))
    } else if (args.code) {
      promises.push(deployCode(db, args.codeDir));
    } else if (args.files) {
      promises.push(deployFiles(db, args.bucketPath, args.fileDir, args.fileGlob, args.cleanUp, args.uploadLimit));
    }
    if (args.schema) {
      promises.push(schema.uploadSchema(db))
    }
    return Promise.all(promises);
  });
};

function deployFiles(db, path, cwd, pattern, cleanUp, uploadLimit) {
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
        resolve(uploadFiles(db, path, files, cwd, cleanUp, uploadLimit));
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
      throw new Error(`Failed to deploy code: ${e.message}`);
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

  return readDirectory(path.join(codePath, directoryName)).then((fileNames) => {
    return Promise.all(
      fileNames
        .filter((fileName) => !fileName.startsWith("."))
        .map((fileName) => {
          let handlerType = fileName.replace(/.js$/, '');

          if (handlerTypes.indexOf(handlerType) === -1)
            return;

          return readFile(path.join(codePath, directoryName, fileName))
            .then((file) => db.code.saveCode(bucket, handlerType, file))
            .then(() => console.log(`${handlerType} handler for ${bucket} deployed.`));
        })
    );
  });
}

function uploadCode(db, name, codePath) {
  if (name.startsWith(".")) return Promise.resolve();

  let moduleName = name.replace(/.js$/, '');
  return readFile(path.join(codePath, name)).then((file) => {
    return db.code.saveCode(moduleName, 'module', file);
  }).then(() => {
    console.log(`Module ${moduleName} deployed.`);
  });

}

// ####

// Generator

function* Generator(entries, func) {
  let count = 0;
  const totalCount = entries.length;
  while (entries.length > 0) {
      yield Promise.resolve(entries.shift()).then((value) => {
          count++
          return func(value, count / totalCount);
      })
  }
}

function runGenerator(generator, parallel = 2, totalResults = []) {
  const run = function (){
      return Promise.resolve(generator.next().value).then(result => {
          if (result !== undefined) {                
              totalResults.push(result);
              return run();
          }
          return totalResults;
      })
  };
  const resolves = [];
  for (let i = 0; i < parallel; i++) {
      resolves.push(run());
  }
  return Promise.all(resolves).then(() => totalResults);
}

// ####

function listAllFiles(db, dir, start = 0, offset = 1000){
  return db.File.listFiles(dir, start, offset).then(files => {
    if (files.length > 0){
      return listAllFiles(db, dir, files[files.length - 1], offset).then(nextFiles => files.concat(nextFiles));
    }
    return [];
  })
}

function getFilesFromBucket(db, dir){
  return listAllFiles(db, dir).then(files => Promise.all(files.map(file => {
      if (file.isFolder){
        return getFilesFromBucket(db, file);
      } else {
        return Promise.resolve(file);
      }
    })).then(files => [].concat.apply([],files)));
}

// ####

function uploadFiles(db, bucket, files, cwd, cleanUp, uploadLimit) {

  return readBucket(db,bucket)
  .then(bucketFiles => prepareUploadFiles(cwd, files).then(files => ({files, bucketFiles})))
  .then(({bucketFiles, files}) => {

    const existFilePathMap = bucketFiles.reduce((result, file) => {
      result.set(file.path, file)
      return result;
    }, new Map());

    let resolve = Promise.resolve(existFilePathMap);
  
    resolve = resolve.then(upload(db, bucket, files, cwd, uploadLimit));
      
    if (cleanUp){
      resolve = resolve.then(cleanUpBucket);
    }
    
    return resolve;

  })
}


function prepareUploadFiles(cwd, files){
  const totalCount = files.length;

  if (!IS_TTY) {
    console.log(`Preparing ${totalCount} upload files.`);
  }
  
  return runGenerator(Generator(files, function (filePath, progress) {     
    if (progress > 0) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
    }
    IS_TTY && process.stdout.write(`Preparing upload file ${(Math.ceil(progress * totalCount))} of ${totalCount}`);
   
    return getFileHash(path.join(cwd, filePath)).then(hash => ({
      path: filePath,
      eTag: hash
    }));
   }), 4);
}

function readBucket(db, bucket){

  if (!IS_TTY) {
    console.log(`Read Bucket...`)
  }

  IS_TTY && process.stdout.write('Read Bucket...');
 
  return getFilesFromBucket(db, bucket)
}

function upload (db, bucket, files, cwd, uploadLimit) {
  return (existFilePathMap) => {

    const totalCount = files.length;

    if (!IS_TTY) {
      console.log(`Uploading ${totalCount} files.`);
    }
    return runGenerator(Generator(files, function (filePath, progress) {    
      if (progress > 0) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
      }
      IS_TTY && process.stdout.write(`Uploading file ${(Math.ceil(progress * totalCount))} of ${totalCount}`);
      if (IS_TTY && progress === 1) {
          console.log(''); //add a final linebreak
      }
      return uploadFile(db, bucket, filePath, cwd, existFilePathMap).then(() => existFilePathMap);
    }), uploadLimit || 2).then((result) => ({result, existFilePathMap}));
  }
}

function cleanUpBucket ({result, existFilePathMap})  {
  const files = Array.from(existFilePathMap.values());
  const totalCount = files.length;

  if (!IS_TTY) {
    console.log(`Deleting ${totalCount} files.`);
  }

  return runGenerator(Generator(files, function (file, progress) {    
    if (progress > 0) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
    }
    IS_TTY && process.stdout.write(`Deleting file ${(Math.ceil(progress * totalCount))} of ${totalCount}`);
    if (IS_TTY && progress === 1) {
        console.log(''); //add a final linebreak
    }
    return file.delete({force: true});
  }), 4).then(() => result);
}
  

function uploadFile(db, bucket, file, cwd, existFilePathMap) {

  const fullFilePath = path.join(cwd, file.path);
  const bucketFilePath = `/${bucket}/${file.path}`;

  const existingFile = existFilePathMap.get(bucketFilePath) 

  const stat = fs.statSync(fullFilePath);

  existingFile && existFilePathMap.delete(bucketFilePath);
  // exists map has logic for large files (hash)
  
  if (!existingFile || file.eTag !== existingFile.eTag){       
    const file = new db.File({path: bucketFilePath, data: fs.createReadStream(fullFilePath), size: stat.size, type: 'stream'});
    return file.upload({ force: true }).catch(function(e) {
      console.log(e)
      throw new Error(`Failed to upload file ${file.path}: ${e.message}`);
    });  
  } else {
    return Promise.resolve();
  }
}

const MAX_INCREMENTAL_UPLOAD_SIZE = 5242880;

function getFileHash(filepath) {
  return new Promise(resolve => {
    // exclude files over 5mb, for force upload
    // TODO: get file hash for >5mb file
    const stat = fs.statSync(filepath);
    if (stat.size < MAX_INCREMENTAL_UPLOAD_SIZE){
      fs.readFile(filepath, (err, data) => {
        if (err) {
          throw err;
        }
        resolve(crypto.createHash('md5').update(data).digest("hex"))
      })
    } else {
      resolve(null);
    }
  })
}
