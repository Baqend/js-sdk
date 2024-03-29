/* eslint-disable no-await-in-loop, no-return-await, @typescript-eslint/return-await */
import fs from 'fs';
import glob from 'glob';
import { join as pathJoin } from 'path';
import readline from 'readline';
import { EntityManager, intersection } from 'baqend';
import * as account from './account';
import { uploadSchema } from './schema';
import { AccountArgs } from './account';
import { readDir, readFile, stat } from './helper';

const handlerTypes = ['update', 'insert', 'delete', 'validate'];

export type SchemaArgs = {
  files?: boolean,
  fileDir: string,
  fileGlob: string,
  bucketPath: string,
  createBucket?: boolean,
  code?: boolean,
  codeDir: string,
  schema?: boolean,
};

export function deploy(args: SchemaArgs & AccountArgs) {
  return account.login(args).then((db) => {
    const promises: Promise<any>[] = [];
    if ((!args.code && !args.files) || (args.code && args.files)) {
      promises.push(deployFiles(db, args.bucketPath, args.fileDir, args.fileGlob, args.createBucket));
      promises.push(deployCode(db, args.codeDir));
    } else if (args.code) {
      promises.push(deployCode(db, args.codeDir));
    } else if (args.files) {
      promises.push(deployFiles(db, args.bucketPath, args.fileDir, args.fileGlob, args.createBucket));
    }
    if (args.schema) {
      promises.push(uploadSchema(db));
    }
    return Promise.all(promises);
  });
}

async function deployFiles(db: EntityManager, path: string, cwd: string, pattern: string, createBucket?: boolean):
Promise<void> {
  let bucket = path;
  while (bucket.length && bucket.charAt(0) === '/') bucket = bucket.substring(1);

  while (bucket.length && bucket.charAt(bucket.length - 1) === '/') bucket = bucket.substring(0, bucket.length - 1);

  if (!bucket.length) {
    throw new Error(`Invalid bucket-path ${bucket}`);
  }

  if (createBucket) {
    await ensureRootBucket(db, bucket);
  }

  const files = await (new Promise<string[]>((resolve, reject) => {
    glob(pattern, { nodir: true, cwd }, (er, fileList) => {
      if (er) reject(er);
      else resolve(fileList);
    });
  }));

  const result = await uploadFiles(db, bucket, files, cwd);
  if (result && result.length > 0) {
    console.log('File deployment completed.');
  } else {
    console.warn('Your specified upload folder is empty, no files were uploaded.');
  }
}

function deployCode(db: EntityManager, codePath: string) {
  return readDir(codePath)
    .catch(() => {
      throw new Error(`Your specified backend code folder ${codePath} is empty, no backend code was deployed.`);
    })
    .then((fileNames) => Promise.all(fileNames
      .map((fileName) => stat(pathJoin(codePath, fileName))
        .then((st) => {
          if (st!.isDirectory()) {
            return uploadHandler(db, fileName, codePath);
          }
          return uploadCode(db, fileName, codePath);
        })))
      .then(() => {
        console.log('Code deployment completed.');
      })
      .catch((e) => {
        throw new Error(`Failed to deploy code: ${e.message}`);
      }));
}

function uploadHandler(db: EntityManager, directoryName: string, codePath: string): Promise<any> {
  const bucket = directoryName;

  if (!db[bucket]) return Promise.resolve();

  return readDir(pathJoin(codePath, directoryName)).then((fileNames) => Promise.all(
    fileNames
      .filter((fileName) => !fileName.startsWith('.'))
      .map((fileName) => {
        const handlerType = fileName.replace(/\.(js|es\d*)$/, '');

        if (handlerTypes.indexOf(handlerType) === -1) return Promise.resolve();

        return readFile(pathJoin(codePath, directoryName, fileName), 'utf-8')
          .then((file) => db.code.saveCode(bucket, handlerType, file))
          .then(() => console.log(`${handlerType} handler for ${bucket} deployed.`));
      }),
  ));
}

function uploadCode(db: EntityManager, name: string, codePath: string) {
  if (name.startsWith('.')) return Promise.resolve();

  const moduleName = name.replace(/\.(js|es\d*)$/, '');
  return readFile(pathJoin(codePath, name), 'utf-8').then((file) => db.code.saveCode(moduleName, 'module', file)).then(() => {
    console.log(`Module ${moduleName} deployed.`);
  });
}

function uploadFiles(db: EntityManager, bucket: string, files: string | string[], cwd: string): Promise<any[]> {
  const isTty = process.stdout.isTTY;
  let index = 0;

  const uploads: Promise<any>[] = [];
  for (let i = 0; i < 10 && i < files.length; i += 1) {
    uploads.push(upload());
  }

  if (!isTty) {
    console.log(`Uploading ${files.length} files.`);
  }

  return Promise.all(uploads);

  async function upload(): Promise<any> {
    while (index < files.length) {
      if (isTty) {
        if (index > 0) {
          readline.clearLine(process.stdout, 0);
          readline.cursorTo(process.stdout, 0);
        }
        process.stdout.write(`Uploading file ${(index + 1)} of ${files.length}`);
      }

      const file = files[index];
      index += 1;

      if (isTty && index === files.length) {
        console.log(''); // add a final linebreak
      }

      await uploadFile(db, bucket, file, cwd);
    }
  }
}

async function uploadFile(db: EntityManager, bucket: string, filePath: string, cwd: string): Promise<any> {
  const fullFilePath = pathJoin(cwd, filePath);

  const st = await stat(fullFilePath);
  if (!st || st.isDirectory()) {
    return null;
  }

  for (let retires = 3; ; retires -= 1) {
    try {
      const file = new db.File({
        path: `/${bucket}/${filePath}`, data: fs.createReadStream(fullFilePath), size: st.size, type: 'stream',
      });

      return await file.upload({ force: true });
    } catch (e: any) {
      if (retires <= 0) {
        console.warn(`Failed to upload file ${filePath}. ${retires} retries left.`);
        throw new Error(`Failed to upload file ${filePath}: ${e.message}`);
      }
    }
  }
}

async function ensureRootBucket(db: EntityManager, name: string): Promise<void> {
  try {
    await db.File.loadMetadata(name);
    return;
  } catch (e) {
    // ignored
  }

  const adminPermission = new intersection.Permission().allowAccess('/db/Role/1');
  const publicPermission = new intersection.Permission();

  await db.File.saveMetadata(name, {
    load: publicPermission,
    insert: adminPermission,
    update: adminPermission,
    delete: adminPermission,
    query: adminPermission,
  });
}
