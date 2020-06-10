'use strict';

import * as binding from "./binding";
import * as connector from "./connector";
import * as error from "./error";
import * as message from "./message";
import * as metamodel from "./metamodel";
import * as util from "./util";
import * as caching from "./caching";
import * as query from "./query";
import * as partialupdate from "./partialupdate";

import { EntityManagerFactory } from "./EntityManagerFactory";
import { EntityManager} from "./EntityManager";
import { Acl } from "./Acl";
import { TokenStorage } from "./util";
import { TokenStorageFactory } from "./util/TokenStorage";

export * as binding from "./binding";
export * as connector from "./connector";
export * as error from "./error";
export * as message from "./message";
export * as metamodel from "./metamodel";
export * as util from "./util";
export * as caching from "./caching";
export * as query from "./query";
export * as partialupdate from "./partialupdate";

export { EntityManagerFactory } from "./EntityManagerFactory";
export { EntityManager } from "./EntityManager";
export { Acl } from "./Acl";

export interface baqend extends EntityManager {
  /**
   * Configures the DB with additional config options
   * @param options The additional configuration options
   * @param [options.tokenStorage] The tokenStorage which should be used by this emf
   * @param [options.tokenStorageFactory] The tokenStorage factory implementation which should
   * be used for token storage
   * @param [options.staleness=60] The maximum staleness of objects that are acceptable while reading cached
   * data, <code>0</code> to always bypass the browser cache
   */
  configure(options: {tokenStorage?: TokenStorage, tokenStorageFactory?: TokenStorageFactory, staleness?: number}): this;

  /**
   * Connects the DB with the server and calls the callback on success
   * @param hostOrApp The host or the app name to connect with
   * @param [secure=false] <code>true</code> To use a secure connection
   * @param doneCallback The callback, called when a connection is established and the
   * SDK is ready to use
   * @param failCallback When an error occurred while initializing the SDK
   * @return    */
  connect(hostOrApp: string, secure: boolean, doneCallback?, failCallback?): Promise<EntityManager>;
}

// export all subpackages as instance properties on the DB instance
Object.assign(EntityManager.prototype, {
  binding,
  connector,
  error,
  message,
  metamodel,
  util,
  caching,
  query,
  partialupdate,

  EntityManager,
  EntityManagerFactory,
  Acl,
});

const db = function() {
  const emf = new EntityManagerFactory();
  const db = emf.createEntityManager(true);

  Object.assign(db, {
    configure(this: baqend, options) {
      emf.configure(options);
      return this;
    },

    connect(this: baqend, hostOrApp, secure, doneCallback, failCallback) {
      if (secure instanceof Function) {
        return this.connect(hostOrApp, undefined, secure, doneCallback);
      }

      emf.connect(hostOrApp, secure);
      return this.ready(doneCallback, failCallback);
    },
  } as Partial<baqend>);

  return db as baqend;
}();

export { db }
export default db;
