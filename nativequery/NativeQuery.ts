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
 * A NativeQuery object, to execute queries that are native to the used backend, like SQL.
 * See the documentation of the {@link NativeQuery.execute} method.
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
   * Executes a native query, native to the backend that is used. For JDBC, plain SQL can be used. 
   * The execute function returns a Promise that resolves to a Json Array once retrieval has completed.
   * The first element in the JSon Array will contain header information of the respective column types. 
   * Subsequent elements of the Json Array will contain the rows of the data retrieved, as JSON. An example:
   * <pre>const response = await entityManager.nativeQuery.execute('select * from Stocks where name = \'Apple\' ');
   * const retrievedName = response[1]["row"]["Stocks:name"]);
   * </pre>
   *
   * @param  nativeQuery The native query to be executed.
   * @param doneCallback This callback is invoked after the native query executed
   * successfully.
   * @param  failCallback This callback is invoked if any error is occurred.
   * @return  A promise which will be fulfilled when the native query is successfully executed.
   */
  execute(nativeQuery?: string, doneCallback?: any, failCallback?: any): Promise<Json>  {

    const nativeQueryMsg = new message.NativeQueryMsg(nativeQuery)
      .responseType('json');
    return this.db.send(nativeQueryMsg).then((response) => {
      return response.entity;
    }, (e) => {
      if (e.status === StatusCode.OBJECT_NOT_FOUND) {
        return null;
      }
      throw e;
    }).then(doneCallback, failCallback);
  }
}
