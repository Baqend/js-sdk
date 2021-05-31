import {
  Class,
  Json
} from '../lib/util';
import * as message from '../lib/message';
import {
  StatusCode
} from '../lib/connector';

import {EntityManager} from '../lib/EntityManager';
import {Response} from '../lib/connector';


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
   * Executes a native query, native to the backend that is used. For a JDBC backend, plain SQL can be used. 
   * The execute function returns a Promise that resolves to a Json Array once retrieval has completed.
   * The first element in the JSon Array will contain header information of the respective column types. 
   * Subsequent elements of the Json Array will contain the rows of the data retrieved, as JSON. An example:
   * <pre>const response = await entityManager.nativeQuery.execute('select * from Stocks where name = \'Apple\' ');
   * const retrievedName = response[1]["row"]["Stocks:name"]);
   * </pre>
   *
   * @param nativeQuery The native query to be executed.
   * @param doneCallback This callback is invoked after the native query executed
   * successfully.
   * @param failCallback This callback is invoked if any error is occurred.
   * @return A promise that resolves to a JSON Array with header and rows when the native query is successfully executed.
   */
  execute(nativeQuery?: string, doneCallback?: any, failCallback?: any): Promise<NativeQueryResponse>  {

    const nativeQueryMsg = new message.NativeQueryMsg(nativeQuery)
      .responseType('json');
    return this.db.send(nativeQueryMsg).then((response) => {
      return new NativeQueryResponse(response);
    }, (e) => {
/*      if (e.status === StatusCode.OBJECT_NOT_FOUND) {
        return null;
      }
      */
      throw e;
    }).then(doneCallback, failCallback);
  }
}

export class NativeQueryResponse {

  private response: Response;
  
  constructor(response: Response) {
    this.response = response;
  }

  ok() : boolean {
    return this.response != null && this.response.status == 200;
  }

  checkOk(){
    if(! this.ok){
      throw new Error("Response not ok. Status code: " + this.status());
    }
    if(this.response.entity == null){
      throw new Error("No JSon response present.");
    }
  }

  status() : number {
    if(this.response == null){
      return 500;
    }
    return this.response.status;
  }

  errorMsg() : string {
    if(this.ok()){
      return "";
    }
    if(this.response == null){
      return "No Response";
    }
    return this.response.entity;
  }

  size() : number {
    this.checkOk();
    const result : number = this.response.entity.length;
    if(result === 0){
      return 0;
    }
    return result -1;
  }

  data(row : number, columnName : string) : any {
    if(row < 0){
      throw new Error("Row can't be negative but is: " + row);
    }
    if( this.size() == 0){
      throw new Error("ResultSet is empty");
    }
    if(row + 1 > this.size()){
      throw new Error("Row must be between 0 and " + (this.size() - 1) + " but is: " + row);
    }
    return this.response.entity[row + 1]["row"][columnName];
  }
  
}