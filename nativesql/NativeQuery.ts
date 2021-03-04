import {
  Class,
  Json
} from '../lib/util';
import * as message from '../lib/message';
import {
  StatusCode
} from '../lib/connector';

import {EntityManager} from '../lib/EntityManager';



/**
 * Creates a NativeQuery object, which executes native sql queries
 * This Query object can  be used to execute sql queries directly in the underlining database
 *
 * @alias binding.NativeQuery
 */
export class NativeQuery {

  public db: EntityManager = null as any;



  /**
   * Creates a Logger instance for the given EntityManager
   * @param entityManager - Theo owning entityManager
   * @return The created logger instance
   */
  constructor(entityManager: EntityManager) {
    this.db = entityManager;
  }


  /**
   * Execute a native sql
   * @param  sql to be executed
   * @param doneCallback The callback is invoked after the sql executed
   * successfully
   * @param  failCallback The callback is invoked if any error is occurred
   * @return  A promise which will be fulfilled when sql is successfully executed
   */
  execute(sql?: string, doneCallback?: any, failCallback?: any): Promise<Json>  {

    const sqlMessage = new message.SqlQuery(sql)
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
