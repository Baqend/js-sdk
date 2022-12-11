import readline from 'readline';
import { Writable } from 'stream';
import { promisify } from 'util';
import * as fs from 'fs';

export const readDir = promisify(fs.readdir);
export const writeFile = promisify(fs.writeFile);
export const readFile = promisify(fs.readFile);
export const mkdir = promisify(fs.mkdir);

export const nativeNamespaces = ['logs', 'speedKit', 'rum'];

/**
 * Returns the stats for the given path
 * @param path
 */
export function stat(path: string) : Promise<fs.Stats | null> {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, st) => {
      if (!err) {
        resolve(st);
      } else if (err.code === 'ENOENT') {
        resolve(null);
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Indicates if the given path is a directory
 * @param path
 */
export function isDir(path: string) : Promise<boolean> {
  return stat(path).then((s) => !!s && s.isDirectory());
}

/**
 * Indicates if the given path is a file
 * @param path
 */
export function isFile(path: string) : Promise<boolean> {
  return stat(path).then((s) => !!s && s.isFile());
}

/**
 * Creates a direcotry or ensures that it exists.
 *
 * @param {string} dir The path where a directory should exist.
 * @return {Promise<void>} Resolves when the given directory is existing.
 */
export function ensureDir(dir: string): Promise<void> {
  return isDir(dir).then((directory) => {
    if (!directory) {
      return mkdir(dir, { recursive: true }).then(() => {});
    }
    return undefined;
  });
}

export function readInput(question: string, hidden = false): Promise<string> {
  let muted = false;
  const mutableStdout = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) {
        process.stdout.write(chunk, encoding);
      }
      callback();
    },
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true,
  });

  return new Promise((resolve, reject) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
    rl.on('SIGINT', () => {
      rl.close();
      reject(new Error('Input is aborted.'));
    });
    muted = hidden;
  });
}

export function isNativeClassNamespace(className: string): boolean {
  const [namespace] = className.split('.');
  return nativeNamespaces.includes(namespace);
}

export function readModuleFile(path: string): Promise<string> {
  const filename = require.resolve(path);
  return readFile(filename, 'utf8');
}
