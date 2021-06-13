"use strict";
const fs = require('fs');
const glob = require("glob");
const account = require('./account');
const schema = require('./schema');
const handlerTypes = ['update', 'insert', 'delete', 'validate'];
const path = require('path');
const readline = require('readline');

/**
 * @param {string} arg
 * @return {[string, string]}
 */
function splitArg(arg) {
  const index = arg.lastIndexOf(':');
  // Has app and path part?
  if (index >= 0) {
    const app = arg.substring(0, index);
    const path = arg.substring(index + 1);

    // Add www bucket prefix if path is relative
    const absolutePath = path.startsWith('/') ? path : `/www/${path}`;
    if (!absolutePath.match(/^\/\w+\//)) {
      throw new Error('The path must begin with a bucket.');
    }

    return [app, absolutePath];
  }

  // Has local part?
  return [null, arg];
}

/**
 * @param {EntityManager | null} db
 * @param {string} path
 * @return {Promise<boolean>}
 */
function isDirectory(db, path) {
  if (db) {
    return Promise.resolve(path.endsWith('/'));
  }

  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stat) => {
      if (!err) {
        resolve(stat.isDirectory());
      } else if (err.code === 'ENOENT') {
        resolve(false);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * @param {string} path
 * @return {string}
 */
function extractFilename(path) {
  const index = path.lastIndexOf('/');
  if (index >= 0) {
    return path.substring(index + 1);
  }

  return path;
}

/**
 * @param {string} path
 * @return {string}
 */
function removeTrailingSlash(path) {
  if (path.endsWith('/')) {
    return path.substring(0, path.length - 1);
  }

  return path;
}

/**
 * @param {EntityManager | null} sourceDB
 * @param {string} sourcePath
 * @param {EntityManager | null} destDB
 * @param {string} destPath
 */
function normalizeArgs(sourceDB, sourcePath, destDB, destPath) {
  return isDirectory(destDB, destPath).then((isDirectory) => {
    if (isDirectory) {
      const sourceFilename = extractFilename(sourcePath);
      destPath = `${removeTrailingSlash(destPath)}/${sourceFilename}`;
    }

    return [sourcePath, destPath];
  });
}

/**
 *
 * @param {string | null} sourceApp
 * @param {string | null} destApp
 * @return {Promise<[EntityManager | null, EntityManager | null]>}
 */
function login(sourceApp, destApp) {
  if (sourceApp) {
    if (destApp) {
      return Promise.all([account.login({ app: sourceApp }), account.login({ app: destApp })]);
    }
    return Promise.all([account.login({ app: sourceApp }), null]);
  }

  if (destApp) {
    return Promise.all([null, account.login({ app: destApp })]);
  }
  return Promise.resolve([null, null]);
}

/**
 * @param {EntityManager | null} db
 * @param {string} path
 * @return {Promise<[ReadableStream, number]>}
 */
function streamFrom(db, path) {
  if (db) {
    const file = new db.File({ path: path });

    return file.loadMetadata().then(() => {
      return Promise.all([file.download({ type: 'stream' }), file.size]);
    });
  }

  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stat) => {
      if (err) {
        reject(err);
      } else {
        resolve([fs.createReadStream(path), stat.size])
      }
    });
  });
}

/**
 * @param {EntityManager | null} db
 * @param {string} path
 * @param {ReadableStream} rs
 * @param {number} size
 * @return {Promise}
 */
function streamTo(db, path, rs, size) {
  if (db) {
    const file = new db.File({ path: path, data: rs, size: size, type: 'stream' });
    return file.upload({ force: true });
  }

  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(path);
    rs.on('end', resolve);
    rs.on('error', reject);

    rs.pipe(ws);
  });
}

/**
 * Copies from arbitrary location to each other.
 *
 * @param {{ source: string, dest: string }} args
 * @return {Promise<any>}
 */
function copy(args) {
  // TODO: Split arguments with destructure in the future
  const source = splitArg(args.source);
  const sourceApp = source[0];
  const sourcePath = source[1];
  const dest = splitArg(args.dest);
  const destApp = dest[0];
  const destPath = dest[1];

  return login(sourceApp, destApp).then((dbs) => {
    const sourceDB = dbs[0];
    const destDB = dbs[1];

    return normalizeArgs(sourceDB, sourcePath, destDB, destPath).then((paths) => {
      const sourcePath = paths[0];
      const destPath = paths[1];

      return streamFrom(sourceDB, sourcePath).then((args) => {
        const rs = args[0];
        const size = args[1];

        return streamTo(destDB, destPath, rs, size);
      });
    });
  });
}

module.exports = copy;
