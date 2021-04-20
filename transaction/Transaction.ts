import {
  Json
} from '../lib/util';
import * as message from '../lib/message';
import {
  StatusCode
} from '../lib/connector';

import {EntityManager} from '../lib';



/**
 * Creates a NativeQuery object, which executes native sql queries
 * This Query object can  be used to execute sql queries directly in the underlining database
 *
 * @alias binding.Transaction
 */
export class Transaction {

  public db: EntityManager = null as any;

  /**
   * The transaction id
   */
  public tid? : string | null;

  /**
   * The name of the file
   */
  get txid(): string | null {

    if (this.tid) {
        return this.tid.substring(this.tid.lastIndexOf('/', this.tid.length - 2) + 1);
    }
    return null;
  }



  /**
   * Creates a Logger instance for the given EntityManager
   * @param entityManager - Theo owning entityManager
   * @return The created logger instance
   */
  constructor(entityManager: EntityManager) {
    this.db = entityManager;
  }


  /**
   * Begin a transaction by creating a transaction id
   * @param doneCallback The callback is invoked after the sql executed
   * successfully
   * @param  failCallback The callback is invoked if any error is occurred
   * @return  A promise which will be fulfilled when sql is successfully executed
   */
  begin(doneCallback?: any, failCallback?: any): Promise<Json>  {

    const txMessage = new message.NewTransaction()
      .responseType('json');
    return this.db.send(txMessage).then((response) => {
      this.tid = response.headers.location;
    }, (e) => {
      if (e.status === StatusCode.OBJECT_NOT_FOUND) {
        return null;
      }
      throw e;
    }).then(doneCallback, failCallback);
  }

  /**
   * Commits a transaction with a given transaction id
   * @param  tid Transaction id
   * @param doneCallback The callback is invoked after the sql executed
   * successfully
   * @param  failCallback The callback is invoked if any error is occurred
   * @return  A promise which will be fulfilled when sql is successfully executed
   */
  commit(tid?: string, doneCallback?: any, failCallback?: any): Promise<Json>  {

    const sqlMessage = new message.CommitTransaction(tid)
      .responseType('json');
    return this.db.send(sqlMessage).then((response) => {
      return response.entity;
    }, (e) => {
      if (e.status === StatusCode.OBJECT_NOT_FOUND) {
        return null;
      }
      throw e;
    }).then(doneCallback, failCallback);
  }


}
