import { EntityManager } from "../lib";
import {
  Lockable,Json
} from '../lib/util';
import {
  Message, StatusCode, Connector, OAuthMessages, OAuthMessage,
} from '../lib/connector';
import * as message from "../lib/message";

export class EntityManager3 extends EntityManager {

  /**
   * Execute a native sql
   * @param  sql to be executed
   * @param doneCallback The callback is invoked after the sql executed
   * successfully
   * @param  failCallback The callback is invoked if any error is occurred
   * @return  A promise which will be fulfilled when sql is successfully executed
   */
  executeQuery(sql?: string, doneCallback?: any, failCallback?: any): Promise<Json> {

    const sqlMessage = new message.SqlQuery(sql)
      .responseType('json');
    return this.send(sqlMessage, false).then((response) => {
      return response.entity;
    }, (e) => {
      if (e.status === StatusCode.OBJECT_NOT_FOUND) {
        return null;
      }
      throw e;
    }).then(doneCallback, failCallback);
  }
}

export { EntityManager };