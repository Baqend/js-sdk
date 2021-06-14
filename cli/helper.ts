import readline from 'readline';
import { Writable } from 'stream';
import { promisify } from 'util';
import * as fs from 'fs';

export const readDir = promisify(fs.readdir);
export const writeFile = promisify(fs.writeFile);
export const readFile = promisify(fs.readFile);
export const mkdir = promisify(fs.mkdir);

export function isDir(path: string) : Promise<boolean> {
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
 * Creates a direcotry or ensures that it exists.
 *
 * @param {string} dir The path where a directory should exist.
 * @return {Promise<void>} Resolves when the given directory is existing.
 */
export function ensureDir(dir: string): Promise<any> {
  return isDir(dir).then((directory) => {
    if (!directory) {
      return mkdir(dir);
    }
    return Promise.resolve();
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
