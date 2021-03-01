import {
  Json
} from '../lib/util';
import * as message from '../lib/message';
import {
  StatusCode
} from '../lib/connector';

import {EntityManager} from '../lib/EntityManager';


/**
 * Creates a NativeSQL object, which executes native sql queries
 * This Query object can  be used to execute sql queries directly in the underlining database
 *
 * @alias binding.NativeSQL
 */
export class NativeSQL {


  /**
   * The database connection to use
   */
  public db: EntityManager = null as any; // is lazy initialized and never null


  constructor(db: EntityManager) {
    this.db = db;
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
