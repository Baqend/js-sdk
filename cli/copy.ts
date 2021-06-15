import * as fs from 'fs';
import { ReadStream } from 'fs';
import { EntityManager } from 'baqend';
import * as account from './account';
import { isDir } from './helper';

function splitArg(arg: string): [string | null, string] {
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

function isDirectory(db: EntityManager | null, path: string): Promise<boolean> {
  if (db) {
    return Promise.resolve(path.endsWith('/'));
  }

  return isDir(path);
}

function extractFilename(path: string): string {
  const index = path.lastIndexOf('/');
  if (index >= 0) {
    return path.substring(index + 1);
  }

  return path;
}

function removeTrailingSlash(path: string): string {
  if (path.endsWith('/')) {
    return path.substring(0, path.length - 1);
  }

  return path;
}

function normalizeArgs(sourceDB: EntityManager | null, sourcePath: string,
  destDB: EntityManager | null, destPath: string) {
  return isDirectory(destDB, destPath).then((directory) => {
    let destination = destPath;
    if (directory) {
      const sourceFilename = extractFilename(sourcePath);
      destination = `${removeTrailingSlash(destPath)}/${sourceFilename}`;
    }

    return [sourcePath, destination];
  });
}

function login(sourceApp: string | null, destApp: string | null):
Promise<[EntityManager | null, EntityManager | null]> {
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

function streamFrom(db: EntityManager | null, path: string): Promise<[ReadStream, number]> {
  if (db) {
    const file = new db.File({ path });

    return file.loadMetadata().then(() => Promise.all([file.download({ type: 'stream' }) as Promise<ReadStream>, file.size!]));
  }

  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stat) => {
      if (err) {
        reject(err);
      } else {
        resolve([fs.createReadStream(path), stat.size]);
      }
    });
  });
}

function streamTo(db: EntityManager | null, path: string, rs: ReadStream, size: number): Promise<any> {
  if (db) {
    const file = new db.File({
      path, data: rs, size, type: 'stream',
    });
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
 */
export function copy(args: { source: string, dest: string }): Promise<any> {
  // TODO: Split arguments with destructure in the future
  const [sourceApp, sourcePath] = splitArg(args.source);
  const [destApp, destPath] = splitArg(args.dest);

  return login(sourceApp, destApp)
    .then(([sourceDB, destDB]) => normalizeArgs(sourceDB, sourcePath, destDB, destPath)
      .then(([nSourcePath, nDestPath]) => streamFrom(sourceDB, nSourcePath)
        .then(([rs, size]) => streamTo(destDB, nDestPath, rs, size))));
}
