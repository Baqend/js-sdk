import * as binding from './binding';
import * as connector from './connector';
import * as error from './error';
import * as message from './message';
import * as util from './util';
import * as caching from './caching';
import * as query from './query';
import * as partialupdate from './partialupdate';
import * as intersection from './intersection';
import * as metamodel from './metamodel';

import {
  Permission, Metadata, TokenStorage, Validator, PushMessage, Code, Modules, Logger,
} from './intersection';
import { Metamodel } from './metamodel';
import { EntityManagerFactory } from './EntityManagerFactory';
import { EntityManager } from './EntityManager';
import { Acl } from './Acl';

import { db } from './baqend';
import { deprecated } from './util';

function deprecateExports(target: object, targetName: string, newImportSignature: string, exports: {
  [exported: string]: any
}) {
  Object.keys(exports).forEach((exported) => {
    const decorate = deprecated(newImportSignature.replace('$export', exported));
    Object.defineProperty(target, exported, decorate(targetName, exported, {
      get(): any {
        return (exports as any)[exported];
      },
    }));
  });
}

deprecateExports(util, 'util', 'intersection.$export', {
  Permission, Metadata, TokenStorage, Validator, PushMessage, Code, Modules, Logger,
});

deprecateExports(EntityManager.prototype, 'db', 'import { $export } from \'baqend\'', {
  db,
  binding,
  connector,
  error,
  message,
  util,
  caching,
  query,
  partialupdate,
  intersection,

  EntityManagerFactory,
  EntityManager,
  Acl,
});

deprecateExports(Metamodel.prototype, 'metamodel', 'import { metamodel } from \'baqend\';', metamodel);

export function configure() {
  throw new Error('Please use Baqend.db.configure() or import { db } from \'baqend\' instead.');
}

export function connect() {
  throw new Error('Please use Baqend.db.connect() or import { db } from \'baqend\' instead.');
}
