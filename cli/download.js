"use strict";
const fs = require('fs');
const account = require('./account');
const handlerTypes = ['update', 'insert', 'delete', 'validate'];
const path = require('path');

/**
 * @param {object} args
 * @param {boolean} args.code
 * @param {boolean} args.files
 * @param {string} args.bucketPath
 * @param {string} args.fileDir
 * @param {string} args.codeDir
 */
function download(args) {
  return account.login(args).then((db) => {
    const promises = [];
    if (args.code) {
      promises.push(downloadCode(db, args.codeDir));
    }
    return Promise.all(promises);
  }).catch(e => console.error(e.message ||e));
}

/**
 * Download all Baqend code.
 *
 * @param {EntityManager} db The entity manager to use.
 * @param {string} codePath The path where code should be downloaded to.
 * @return {Promise<void>} Resolves when downloading has been finished.
 */
function downloadCode(db, codePath) {
  return mkdir(codePath)
    .then(() => db.code.loadModules())
    .then((modules) => Promise.all(modules.map(module => downloadCodeModule(db, module, codePath))));
}

/**
 * Downloads a single code module.
 *
 * @param {EntityManager} db The entity manager to use.
 * @param {string} module The module to download.
 * @param {string} codePath The path where code should be downloaded to.
 * @return {Promise<void>} Resolves when downloading has been finished.
 */
function downloadCodeModule(db, module, codePath) {
  const moduleName = module.replace(/^\/code\//, '').replace(/\/module$/, '');
  const fileName = `${moduleName}.js`;
  const filePath = path.join(codePath, fileName);

  return db.code.loadCode(moduleName, 'module', false)
    .then((file) => writeFile(filePath, file))
    .then(() => console.log(`Module ${moduleName} downloaded.`));
}

/**
 * Creates a direcotry or ensures that it exists.
 *
 * @param {string} dir The path where a directory should exist.
 * @return {Promise<void>} Resolves when the given directory is existing.
 */
function mkdir(dir) {
  return new Promise((resolve, reject) => {
    fs.lstat(dir, (err, stats) => {
      // Resolve, when already is directory
      if (!err) return stats.isDirectory() ? resolve() : reject(new Error(`${dir} is not a direcotry.`));
      // Try to create directory
      fs.mkdir(dir, (err) => {
        err ? reject(err) : resolve();
      });
    })
  })
}

/**
 * Writes a file to disk.
 *
 * @param {string} filePath The file path to write to.
 * @param {string} contents A UTF-8 encoded string of the file contents.
 * @return {Promise<void>} Resolves when the file has been written successfully.
 */
function writeFile(filePath, contents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, contents, 'utf-8', (err, file) => {
      err ? reject(err) : resolve();
    })
  });
}

module.exports = download;
