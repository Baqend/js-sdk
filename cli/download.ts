/* eslint-disable no-console,@typescript-eslint/no-use-before-define */
import path from 'path';
import * as account from './account';
import { AccountArgs } from './account';
import { EntityManager } from '../lib';
import {
  ensureDir, writeFile,
} from './helper';

export type DownloadArgs = {
  code: boolean,
  codeDir: string,
};

export function download(args: DownloadArgs & AccountArgs) {
  return account.login(args).then((db) => {
    const promises = [];
    if (args.code) {
      promises.push(downloadCode(db, args.codeDir));
    }
    return Promise.all(promises);
  });
}

/**
 * Download all Baqend code.
 *
 * @param db The entity manager to use.
 * @param codePath The path where code should be downloaded to.
 * @return Resolves when downloading has been finished.
 */
function downloadCode(db: EntityManager, codePath: string): Promise<any> {
  return ensureDir(codePath)
    .then(() => db.code.loadModules())
    .then((modules) => Promise.all(modules.map((module) => downloadCodeModule(db, module, codePath))));
}

/**
 * Downloads a single code module.
 *
 * @param {EntityManager} db The entity manager to use.
 * @param {string} module The module to download.
 * @param {string} codePath The path where code should be downloaded to.
 * @return {Promise<void>} Resolves when downloading has been finished.
 */
function downloadCodeModule(db: EntityManager, module: string, codePath: string): Promise<any> {
  const moduleName = module.replace(/^\/code\//, '').replace(/\/module$/, '');
  const fileName = `${moduleName}.js`;
  const filePath = path.join(codePath, fileName);

  return db.code.loadCode(moduleName, 'module', false)
    .then((file) => writeFile(filePath, file, 'utf-8'))
    .then(() => console.log(`Module ${moduleName} downloaded.`));
}
