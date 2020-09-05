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

import { EntityManagerFactory } from './EntityManagerFactory';
import { EntityManager } from './EntityManager';
import { Acl } from './Acl';

import { db } from './baqend';
import { deprecated } from './util';

['Permission', 'Metadata', 'TokenStorage', 'Validator', 'PushMessage', 'Code', 'Modules', 'Logger'].forEach((type) => {
  const decorate = deprecated(`intersection.${type}`);
  Object.defineProperty(util, type, decorate('util', type, {
    get(): any {
      return (intersection as any)[type];
    },
  }));
});

const exp = Object.assign(db, {
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
}, {
  metamodel: Object.assign(db.metamodel, metamodel),
});

// @ts-ignore
export = exp;
