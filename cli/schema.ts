/* eslint-disable no-console */
import { join as pathJoin } from 'path';
import * as account from './account';
import * as helper from './helper';
import { EntityManager, message } from '../lib';
import { JsonMap } from '../lib/util';
import { AccountArgs } from './account';
import {
  ensureDir, readDir, readFile, writeFile,
} from './helper';

const SCHEMA_FILE_PATH = './baqend/schema/';

export type SchemaArgs = {
  command: 'upload' | 'download',
  force?: boolean,
};

export function uploadSchema(db: EntityManager, args: { force?: boolean } = {}): Promise<any> {
  return readDir(SCHEMA_FILE_PATH)
    .then((fileNames) => Promise.all(
      fileNames.map((fileName) => readFile(pathJoin(SCHEMA_FILE_PATH, fileName), 'utf-8').then((file) => JSON.parse(file) as JsonMap)),
    ).then((schemas: JsonMap[]) => {
      if (args.force) {
        return helper.readInput('This will delete ALL your App data. Are you sure you want to continue? (yes/no)')
          .then((answer: string) => {
            if (answer.toLowerCase() === 'yes') {
              schemas.forEach((schemaDescriptor: JsonMap) => {
                console.log(`Replacing ${(schemaDescriptor.class as string).replace('/db/', '')} Schema`);
              });
              return db.send(new message.ReplaceAllSchemas(schemas)) as Promise<any>;
            }
            return Promise.resolve();
          });
      }
      schemas.forEach((schemaDescriptor) => {
        console.log(`Updating ${(schemaDescriptor.class as string).replace('/db/', '')} Schema`);
      });
      return db.send(new message.UpdateAllSchemas(schemas));
    }));
}

export function downloadSchema(db: EntityManager) {
  return db.send(new message.GetAllSchemas()).then((res) => Promise.all(
    res.entity.map((schemaDescriptor: JsonMap) => {
      const classname = (schemaDescriptor.class as string).replace('/db/', '');
      const filename = `baqend/schema/${classname}.json`;

      if (!classname.match(/logs\./) && classname !== 'Object') {
        return writeFile(filename, JSON.stringify(schemaDescriptor, null, 2), 'utf-8').then(() => {
          console.log(`Downloaded ${classname} Schema`);
        });
      }
      return Promise.resolve();
    }),
  ));
}

export function schema(args: SchemaArgs & AccountArgs) {
  return account.login(args).then((db) => ensureDir(SCHEMA_FILE_PATH).then(() => {
    switch (args.command) {
      case 'upload':
        return uploadSchema(db, args).then((deployed) => {
          console.log('---------------------------------------');
          if (deployed) {
            console.log(`The schema was successfully ${args.force ? 'replaced' : 'updated'}`);
          } else {
            console.log('The schema update was aborted');
          }
        });
      case 'download':
        return downloadSchema(db).then(() => {
          console.log('---------------------------------------');
          console.log('Your schema was successfully downloaded');
        });
      default:
        throw new Error(`Invalid command: "${args.command}". Please use one of ["upload", "download"].`);
    }
  }));
}
