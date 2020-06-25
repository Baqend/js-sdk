'use strict';

import { EntityManager } from "./EntityManager";
import * as message from "./message";
import { Connector, Message } from "./connector";
import { JsonMap, Lockable } from "./util";
import { TokenStorage, TokenStorageFactory } from "./intersection/TokenStorage";
import { Metamodel } from "./metamodel/Metamodel";
import { Response } from "./connector/Connector";
import { WebSocketConnector } from "./connector/WebSocketConnector";
import { Code } from "./intersection";

const CONNECTED = Symbol('Connected');
const WS = Symbol('WebSocket');

export type ConnectData = {
  bloomFilterRefresh?: number,
  schema?: JsonMap,
  token?: string,
  device?: JsonMap,
  user?: JsonMap,
  bloomFilter?: JsonMap,
  websocket?: string,
}

export class EntityManagerFactory extends Lockable {
  public connection: Connector | null = null;
  public metamodel: Metamodel = this.createMetamodel();
  public code: Code = new Code(this.metamodel, this);
  public tokenStorageFactory: TokenStorageFactory = TokenStorage.WEB_STORAGE || TokenStorage.GLOBAL;
  public tokenStorage: TokenStorage | null = null;
  public staleness: number | null = null;

  public connectData?: ConnectData;

  /**
   * Retrieves the websocket connection if the websocket SDK is available
   */
  get websocket(): WebSocketConnector {
    if (!this[WS]) {
      const secure = this.connection!.secure;
      let url;
      if (this.connectData!.websocket) {
        url = (secure ? 'wss:' : 'ws:') + this.connectData!.websocket;
      } else {
        url = this.connection!.origin.replace(/^http/, 'ws') + this.connection!.basePath + '/events';
      }
      this[WS] = WebSocketConnector.create(url);
    }
    return this[WS];
  }

  /**
   * Creates a new EntityManagerFactory connected to the given destination
   * @param [options] The destination to connect with, or an options object
   * @param [options.host] The destination to connect with
   * @param [options.port=80|443] The optional destination port to connect with
   * @param [options.secure=false] <code>true</code> To use a secure ssl encrypted connection
   * @param [options.basePath="/v1"] The base path of the api
   * @param [options.schema=null] The serialized schema as json used to initialize the metamodel
   * @param [options.tokenStorage] The tokenStorage which should be used by this emf
   * @param [options.tokenStorageFactory] The tokenStorage factory implementation which
   * should be used for token storage
   * @param [options.staleness=60] The maximum staleness of objects that are acceptable while reading cached
   * data
   */
  constructor(options: {
      host?: string,
      port?: number,
      secure?: boolean,
      basePath?: string,
      schema?: JsonMap,
      tokenStorage?: TokenStorage,
      tokenStorageFactory?: TokenStorageFactory,
      staleness?: number
    } | string = {}
  ) {
    super();

    const opt = typeof options === 'string' ? { host: options } : options || {};

    this.configure(opt);

    let isReady = true;
    let ready = new Promise<void>((success) => {
      this[CONNECTED] = success;
    });

    if (opt.host) {
      this.connect(opt.host, opt.port, opt.secure, opt.basePath);
    } else {
      isReady = false;
    }

    if (!this.tokenStorage) {
      isReady = false;
      ready = ready
        .then(() => this.tokenStorageFactory.create(this.connection!.origin))
        .then((tokenStorage) => {
          this.tokenStorage = tokenStorage;
        });
    }

    if (opt.schema) {
      this.connectData = opt;
      this.metamodel.init(opt.schema);
    } else {
      isReady = false;
      ready = ready.then(() => {
        const msg = new message.Connect();
        msg.withCredentials = true; // used for registered devices

        if (this.staleness === 0) {
          msg.noCache();
        }

        return this.send(msg);
      }).then((response: Response) => {
        this.connectData = response.entity as JsonMap;

        if (this.staleness === null) {
          this.staleness = this.connectData.bloomFilterRefresh || 60;
        }

        if (!this.metamodel.isInitialized) {
          this.metamodel.init(this.connectData.schema);
        }

        this.tokenStorage!.update(this.connectData.token as string | null);
      });
    }

    if (!isReady) {
      this.withLock(() => ready, true);
    }
  }

  /**
   * Apply additional configurations to this EntityManagerFactory
   * @param options The additional configuration options
   * @param [options.tokenStorage] The tokenStorage which should be used by this emf
   * @param [options.tokenStorageFactory] The tokenStorage factory implementation which
   * should be used for token storage
   * @param [options.staleness=60] The maximum staleness of objects that are acceptable while reading cached
   * data, <code>0</code> to always bypass the browser cache
   * @return
   */
  configure(options: { tokenStorage?: TokenStorage, tokenStorageFactory?: TokenStorageFactory, staleness?: number }): void {
    if (this.connection) {
      throw new Error('The EntityManagerFactory can only be configured before is is connected.');
    }

    if (options.tokenStorage) {
      this.tokenStorage = options.tokenStorage;
    }

    if (options.tokenStorageFactory) {
      this.tokenStorageFactory = options.tokenStorageFactory;
    }

    if (options.staleness !== undefined) {
      this.staleness = options.staleness;
    }
  }

  /**
   * Connects this EntityManager to the given destination
   * @param hostOrApp The host or the app name to connect with
   * @param [secure=true] <code>true</code> To use a secure connection
   * @param [basePath="/v1"] The base path of the api
   * @return
   */
  connect(hostOrApp: string, secure?: boolean, basePath?: string): Promise<this>;

  /**
   * Connects this EntityManager to the given destination
   * @param hostOrApp The host or the app name to connect with
   * @param [port=80|443] The port to connect to
   * @param [secure=false] <code>true</code> To use a secure connection
   * @param [basePath="/v1"] The base path of the api
   * @return
   */
  connect(hostOrApp: string, port?: number, secure?: boolean, basePath?: string): Promise<this>;

  connect(hostOrApp, port?, secure?, basePath?): Promise<this> {
    if (this.connection) {
      throw new Error('The EntityManagerFactory is already connected.');
    }

    if (typeof port === 'boolean') {
      return this.connect(hostOrApp, 0, port, secure as string);
    }

    this.connection = Connector.create(hostOrApp, port, secure, basePath);

    this[CONNECTED]();
    return this.ready();
  }


  /**
   * Creates a new Metamodel instance, which is not connected
   * @return A new Metamodel instance
   */
  createMetamodel(): Metamodel {
    return new Metamodel(this);
  }

  /**
   * Create a new application-managed EntityManager.
   *
   * @param useSharedTokenStorage The token storage to persist the authorization token, or
   * <code>true</code> To use the shared token storage of the emf.
   * <code>false</code> To use a instance based storage.
   *
   * @return a new entityManager
   */
  createEntityManager(useSharedTokenStorage?: boolean): EntityManager {
    const em = new EntityManager(this);

    if (this.isReady) {
      em.connected(
        this.connection!,
        this.connectData!,
        useSharedTokenStorage ? this.tokenStorage! : new TokenStorage(this.connection!.origin)
      );
    } else {
      em.withLock(() => this.ready().then(() => {
        em.connected(
          this.connection!,
          this.connectData!,
          useSharedTokenStorage ? this.tokenStorage! : new TokenStorage(this.connection!.origin)
        );
      }), true);
    }

    return em;
  }

  send(msg: Message): Promise<Response> {
    if (!msg.tokenStorage) {
      msg.tokenStorage = this.tokenStorage;
    }
    return this.connection!.send(msg);
  }
}

