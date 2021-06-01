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
 * A NativeQuery object, to execute queries that are native to the backend, like SQL.
 * See the documentation of the {@link NativeQuery.execute} method.
 *
 * @alias binding.NativeQuery
 */
export class NativeQuery {

  public db: EntityManager = null as any;

  /**
   * Creates a NativeQuery instance for the given EntityManager
   * @param entityManager - The owning entityManager
   * @return The created NativeQuery instance
   */
  constructor(entityManager: EntityManager) {
    this.db = entityManager;
  }


  /**
   * Executes a native query and returns a Promise that resolves to a
   * {@link NativeQueryResponse} once retrieval has completed. An example:
   * <pre>const response = await entityManager.nativeQuery.execute('select * from Stocks where name = \'Apple\' ');
   * const retrievedName = response.data(0, "Stocks:name");
   * </pre>
   *
   * @param nativeQuery The native query to be executed.
   * @param doneCallback This callback is invoked after the native query executed
   * successfully.
   * @param failCallback This callback is invoked if any error is occurred.
   * @return A promise that resolves to a {@link NativeQueryResponse}.
   */
  execute(nativeQuery?: string, doneCallback?: any, failCallback?: any): Promise<NativeQueryResponse>  {

    const nativeQueryMsg = new message.NativeQueryMsg(nativeQuery)
      .responseType('json');
    return this.db.send(nativeQueryMsg).then((response) => {
      return new NativeQueryResponse(response);
    }, (e) => {
      throw e;
    }).then(doneCallback, failCallback);
  }
}

/**
 * A NativeQueryResponse object, that is returned in a promise from {@link NativeQuery.execute}.
 *
 * @alias binding.NativeQueryResponse
 */
export class NativeQueryResponse {

  private response: Response;
  
  constructor(response: Response) {
    this.response = response;
  }

  /**
   * @returns true if the NativeQuery was executed successfully, false otherwise.
   */
  ok() : boolean {
    return this.response != null && this.response.status == 200;
  }

  private checkOk(){
    if(! this.ok){
      throw new Error("Response not ok. Status code: " + this.status());
    }
    if(this.response.entity == null){
      throw new Error("No JSon response present.");
    }
  }

  /**
   * @returns the REST status code returned from executing the NativeQuery.
   */
  status() : number {
    if(this.response == null){
      return 500;
    }
    return this.response.status;
  }

  /**
   * @returns an error message, if it is present, or an empty string.
   */
  errorMsg() : string {
    if(this.ok()){
      return "";
    }
    if(this.response == null){
      return "No Response";
    }
    return this.response.entity;
  }

  /**
   * @returns the number of rows in this NativeQueryResponse.
   */
  size() : number {
    this.checkOk();
    const result : number = this.response.entity.length;
    if(result === 0){
      return 0;
    }
    return result -1;
  }

  /**
   * This method is to be called to get the actual data in the NativeQueryResponse.
   * @param row the row of the response that you would like to get - 0 is the first row
   * @param columnName the name of the column that you would like to get
   * @returns 
   */
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

  /**
   * This method can be used to get the column names of the columns in the NativeQueryResponse.
   * It only returns the information about the columns if at least one row was retrieved.
   * @returns the header as a Json array.
   */
  header() : Json {
    this.checkOk();
    if(this.size() < 1){
      return "Zero rows retrieved. If there are no rows, there is no header.";
    }
    return this.response.entity[0]["header"]["columnDefinitions"];
  }
  
}