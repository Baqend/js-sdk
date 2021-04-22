import {
  Json
} from '../lib/util';
import * as message from '../lib/message';
import {
  StatusCode
} from '../lib/connector';

import {EntityManager} from '../lib';



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
  public tid? : string | null;

  /**
   * Get Transaction Id
   */
  get txid(): string | null {
    if (this.tid != null)
      return this.tid;
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
  begin(doneCallback?: any, failCallback?: any): Promise<Json>  {

    if(this.tid)
      throw new Error(`Transaction already exist.. Please commit existing transaction first`);

    const txMessage = new message.NewTransaction()
      .responseType('json');
    return this.db.send(txMessage).then((response) => {
      this.tid = response.headers.location.substring(response.headers.location.lastIndexOf('/', response.headers.location.length - 2) + 1);
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
   * @param  failCallback The callback is invoked if any error occurred
   * @return  A promise which will be fulfilled when commit transaction is successfully executed
   */
  commit(tid?: string, doneCallback?: any, failCallback?: any): Promise<Json>  {

    const sqlMessage = new message.CommitTransaction(tid)
      .responseType('json');
    return this.db.send(sqlMessage).then((response) => {
      this.tid = null;
      return response.entity;
    }, (e) => {
      if (e.status === StatusCode.OBJECT_NOT_FOUND) {
        return null;
      }
      throw e;
    }).then(doneCallback, failCallback);
  }


}
