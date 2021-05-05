import {
  Json, JsonMap
} from '../lib/util';
import * as message from '../lib/message';
import {
  StatusCode
} from '../lib/connector';

import { EntityManager } from '../lib';
import { Metadata } from "../lib/intersection";

/**
 * Transaction object class
 *
 * @alias binding.Transaction
 */
export class Transaction {
  public db: EntityManager = null as any;

  /**
   * The transaction id
   */
  public tid?: string | null;

  /**
   * Get Transaction Id
   */
  get txid(): string | null {
    if (this.tid) return this.tid;
    return null;
  }

  /**
   * The default constructor for creating Transaction  instance for the given EntityManager
   * @param entityManager - The owning entityManager
   */
  constructor(entityManager: EntityManager) {
    this.db = entityManager;
  }

  /**
   * Begin a transaction by creating a transaction id
   * @param doneCallback The callback is invoked after the sql executed
   * successfully
   * @param  failCallback The callback is invoked if any error occurred
   * @return  A promise which will be fulfilled with a transaction id when successfully executed
   */
  begin(doneCallback?: any, failCallback?: any): Promise<string> {
    if (this.tid) return Promise.reject(Error('Transaction already exist.. Please commit existing transaction first'));

    const txMessage = new message.NewTransaction()
      .responseType('json');
    return this.db.send(txMessage).then((response) => this.tid = response.headers.location.substring(response.headers.location.lastIndexOf('/', response.headers.location.length - 2) + 1), (e) => {
      if (e.status === StatusCode.OBJECT_NOT_FOUND) {
        return null;
      }
      throw e;
    }).then(doneCallback, failCallback);
  }

  /**
   * Commits a transaction with a given transaction id
   * @param doneCallback The callback is invoked after the sql executed
   * successfully
   * @param  failCallback The callback is invoked if any error occurred
   * @return  A promise which will be fulfilled when commit transaction is successfully executed
   */
  commit(doneCallback?: any, failCallback?: any): Promise<Json> {
    if (!this.tid)
    { return Promise.reject(Error('Transaction does not exist.. Please start a new transaction using transaction.begin')); }
    const writeSetList = this.db.transactionalEntities;
    const deleteSetList = this.db.transactionalDeleteEntities;
    let jsonBody = '{';
    let writeSetJson = '';
    let deleteSetJson = '';
    const writeArray = [];
    const deleteArray = [];

    for (const key of Object.keys(writeSetList)) {
      const val = writeSetList[key];
      const state = Metadata.get(val);
      let json: JsonMap;
      // right now we send all the values irrespective whether it changed values or not
      if (state.isAvailable) {
        // getting json will check all collections changes, therefore we must do it before proofing the dirty state
        json = state.type.toJsonValue(state, val, {
          persisting: true,
        }) as JsonMap;
        writeArray.push(JSON.stringify(json));
      }
    }

    if (writeArray.length > 0) {
      writeSetJson += '"writeSet": [';
      const writeSetBody = writeArray.join(',');
      writeSetJson += writeSetBody;
      writeSetJson += ']';
    }

    for (const key of Object.keys(deleteSetList)) {
      const state = Metadata.get(deleteSetList[key]);
      let json;
      if (state.isAvailable) {
        // getting json will check all collections changes, therefore we must do it before proofing the dirty state
        json = state.type.toJsonValue(state, deleteSetList[key], {
          persisting: true,
        });
        deleteArray.push(JSON.stringify(json));
      }
    }

    if (deleteArray.length > 0) {
      writeSetJson += ',';
      deleteSetJson += '"deleteSet": [';
      const deleteSetBody = deleteArray.join(',');
      deleteSetJson += deleteSetBody;
      deleteSetJson += ']';
    }

    jsonBody += `${writeSetJson} ${deleteSetJson}}`;

    console.log(`ResultSet --> ${jsonBody}`);

    this.db.transactionalEntities = {};
    this.db.transactionalDeleteEntities = {};

    const sqlMessage = new message.CommitTransaction(this.tid, jsonBody)
      .responseType('json');
    this.tid = null;
    return this.db.send(sqlMessage).then((response) => response.entity, (e) => {
      if (e.status === StatusCode.OBJECT_NOT_FOUND) {
        return null;
      }
      throw e;
    }).then(doneCallback, failCallback);
  }
}
