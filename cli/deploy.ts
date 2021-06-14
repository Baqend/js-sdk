/* eslint-disable @typescript-eslint/no-use-before-define,no-console,no-param-reassign */
import fs from 'fs';
import glob from 'glob';
import { promisify } from 'util';
import { join as pathJoin } from 'path';
import readline from 'readline';
import * as account from './account';
import { uploadSchema } from './schema';
import { AccountArgs } from './account';
import { EntityManager } from '../lib';

const handlerTypes = ['update', 'insert', 'delete', 'validate'];

const readDirectory = promisify(fs.readdir);
const readStat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

export type SchemaArgs = {
  files?: boolean,
  fileDir: string,
  fileGlob: string,
  bucketPath: string,
  code?: boolean,
  codeDir: string,
  schema?: boolean,
};

export function deploy(args: SchemaArgs & AccountArgs) {
  return account.login(args).then((db) => {
    const promises = [];
    if ((!args.code && !args.files) || (args.code && args.files)) {
      promises.push(deployFiles(db, args.bucketPath, args.fileDir, args.fileGlob));
      promises.push(deployCode(db, args.codeDir));
    } else if (args.code) {
      promises.push(deployCode(db, args.codeDir));
    } else if (args.files) {
      promises.push(deployFiles(db, args.bucketPath, args.fileDir, args.fileGlob));
    }
    if (args.schema) {
      promises.push(uploadSchema(db));
    }
    return Promise.all(promises);
  });
}

function deployFiles(db: EntityManager, path: string, cwd: string, pattern: string): Promise<any> {
  while (path.length && path.charAt(0) === '/') path = path.substring(1);

  while (path.length && path.charAt(path.length - 1) === '/') path = path.substring(0, path.length - 1);

  if (!path.length) {
    console.error(`Invalid bucket-path ${path}`);
    return Promise.resolve();
  }

  return (new Promise((resolve, reject) => {
    glob(pattern, { nodir: true, cwd }, (er, files) => {
      if (er) reject(er);
      else resolve(files as string[]);
    });
  }) as Promise<string[]>)
    .then((files) => uploadFiles(db, path, files, cwd))
    .then((result) => {
      if (result && result.length > 0) {
        console.log('File deployment completed.');
      } else {
        console.warn('Your specified upload folder is empty, no files were uploaded.');
      }
    });
}

function deployCode(db: EntityManager, codePath: string) {
  return readDirectory(codePath)
    .then((fileNames) => Promise.all(fileNames
      .map((fileName) => readStat(pathJoin(codePath, fileName))
        .then((stat) => {
          if (stat.isDirectory()) {
            return uploadHandler(db, fileName, codePath);
          }
          return uploadCode(db, fileName, codePath);
        })))
      .then(() => {
        console.log('Code deployment completed.');
      })
      .catch((e) => {
        throw new Error(`Failed to deploy code: ${e.message}`);
      }))
    .catch(() => {
      console.warn('Your specified backend code folder is empty, no backend code was deployed.');
    });
}

function uploadHandler(db: EntityManager, directoryName: string, codePath: string): Promise<any> {
  const bucket = directoryName;

  if (!db[bucket]) return Promise.resolve();

  return readDirectory(pathJoin(codePath, directoryName)).then((fileNames) => Promise.all(
    fileNames
      .filter((fileName) => !fileName.startsWith('.'))
      .map((fileName) => {
        const handlerType = fileName.replace(/.js$/, '');

        if (handlerTypes.indexOf(handlerType) === -1) return Promise.resolve();

        return readFile(pathJoin(codePath, directoryName, fileName), 'utf-8')
          .then((file) => db.code.saveCode(bucket, handlerType, file))
          .then(() => console.log(`${handlerType} handler for ${bucket} deployed.`));
      }),
  ));
}

function uploadCode(db: EntityManager, name: string, codePath: string) {
  if (name.startsWith('.')) return Promise.resolve();

  const moduleName = name.replace(/.js$/, '');
  return readFile(pathJoin(codePath, name), 'utf-8').then((file) => db.code.saveCode(moduleName, 'module', file)).then(() => {
    console.log(`Module ${moduleName} deployed.`);
  });
}

function uploadFiles(db: EntityManager, bucket: string, files: string | string[], cwd: string): Promise<any[]> {
  const isTty = process.stdout.isTTY;
  let index = 0;

  const uploads = [];
  for (let i = 0; i < 10 && i < files.length; i += 1) {
    uploads.push(upload());
  }

  if (!isTty) {
    console.log(`Uploading ${files.length} files.`);
  }

  return Promise.all(uploads);

  function upload(): Promise<any> {
    if (index < files.length) {
      if (isTty) {
        if (index > 0) {
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);
        }
        process.stdout.write(`Uploading file ${(index + 1)} of ${files.length}`);
      }

      const file = files[index += 1];

      if (isTty && index === files.length) {
        console.log(''); // add a final linebreak
      }

      return uploadFile(db, bucket, file, cwd).then(upload);
    }
    return Promise.resolve();
  }
}

function uploadFile(db: EntityManager, bucket: string, filePath: string, cwd: string) {
  const fullFilePath = pathJoin(cwd, filePath);

  const stat = fs.statSync(fullFilePath);

  const file = new db.File({
    path: `/${bucket}/${filePath}`, data: fs.createReadStream(fullFilePath), size: stat.size, type: 'stream',
  });
  return file.upload({ force: true }).catch((e) => {
    throw new Error(`Failed to upload file ${filePath}: ${e.message}`);
  });
}
