import { join as pathJoin } from 'path';
import { EntityManager, message, util } from 'baqend';
import * as account from './account';
import * as helper from './helper';
import { AccountArgs } from './account';
import {
  ensureDir, isNativeClassNamespace, readDir, readFile, writeFile,
} from './helper';

type JsonMap = util.JsonMap;

const SCHEMA_FILE_PATH = './baqend/schema/';

export type SchemaArgs = {
  command: 'upload' | 'download' | 'push' | 'pull'
  force?: boolean,
};

export async function uploadSchema(db: EntityManager, args: { force?: boolean } = {}): Promise<boolean> {
  let fileNames;
  try {
    fileNames = await readDir(SCHEMA_FILE_PATH);
  } catch (e) {
    throw new Error('Your schema folder baqend is empty, no schema changes were deployed.');
  }

  const schemas: JsonMap[] = await Promise.all(
    fileNames.map(async (fileName) => {
      const file = await readFile(pathJoin(SCHEMA_FILE_PATH, fileName), 'utf-8');
      return JSON.parse(file) as JsonMap;
    }),
  );

  if (args.force) {
    const answer: string = await helper.readInput('This will delete ALL your App data. Are you sure you want to continue? (yes/no)');
    if (answer.toLowerCase() !== 'yes') {
      return false;
    }

    schemas.forEach((schemaDescriptor: JsonMap) => {
      console.log(`Replacing ${(schemaDescriptor.class as string).replace('/db/', '')} Schema`);
    });
    await db.send(new message.ReplaceAllSchemas(schemas));
    return true;
  }

  const acls = schemas.map((schemaDescriptor) => {
    console.log(`Updating ${(schemaDescriptor.class as string).replace('/db/', '')} Schema`);
    return { operation: 'updateClassAcl', bucket: schemaDescriptor.class, acl: schemaDescriptor.acl };
  });

  try {
    // We need to update acls separately, since they are not changed by an additive update
    // Deploy schemas first to ensure all schemas exists
    await db.send(new message.UpdateAllSchemas(schemas));
    await db.send(new message.UpdateAllSchemas(acls));
    return true;
  } catch (e: any) {
    console.error(`Schema update failed with error: ${e.message}`);
    return false;
  }
}

export function downloadSchema(db: EntityManager) {
  return db.send(new message.GetAllSchemas()).then((res) => Promise.all(
    res.entity.map((schemaDescriptor: JsonMap) => {
      const classname = (schemaDescriptor.class as string).replace('/db/', '');
      const filename = `baqend/schema/${classname}.json`;

      if (!isNativeClassNamespace(classname) && classname !== 'Object') {
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
      case 'push':
        return uploadSchema(db, args).then((deployed) => {
          console.log('---------------------------------------');
          if (deployed) {
            console.log(`The schema was successfully ${args.force ? 'replaced' : 'updated'}`);
          } else {
            console.log('The schema update was aborted');
          }
        });
      case 'download':
      case 'pull':
        return downloadSchema(db).then(() => {
          console.log('---------------------------------------');
          console.log('Your schema was successfully downloaded');
        });
      default:
        throw new Error(`Invalid command: "${args.command}". Please use one of ["upload", "download"].`);
    }
  }));
}
