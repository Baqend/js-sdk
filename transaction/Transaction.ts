import {
  Json, JsonMap
} from '../lib/util';
import * as message from '../lib/message';
import {
  StatusCode, Message
} from '../lib/connector';

import {EntityManager} from '../lib';
import {Metadata} from "../lib/intersection";
import { ManagedType } from "../lib/metamodel";
import {Entity} from '../lib/binding';
import { EntityPartialUpdateBuilder} from '../lib/partialupdate'

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
 * All entity instances that participate in this transaction
 * @type Map<String,Entity>
 */
  public entities: { [id: string]: Entity } = {};

  /**
  * All entity instances that are to be deleted by this transaction
  * @type Map<String,Entity>
  */
  public deleteEntities: { [id: string]: Entity } = {};

  /**
   * All partial updates that are to be performec by this transaction
   */
  public partialUpdates: EntityPartialUpdateBuilder<Entity>[] = [];
 
  /**
   * The default constructor for creating Transaction  instance for the given EntityManager
   * @param entityManager - The owning entityManager
   */
  constructor(entityManager: EntityManager) {
    this.db = entityManager;
  }

  /**
   * Begin a transaction by creating a transaction id
   * @param doneCallback The callback is invoked after the transaction was completed
   * successfully
   * @param  failCallback The callback is invoked if any error occurred
   * @return  A promise which will be fulfilled with a transaction id when successfully executed
   */
  async begin(doneCallback?: any, failCallback?: any): Promise<string> {
    if (this.tid) return Promise.reject(new Error('Transaction already exist.. Please commit existing transaction first'));

    const txMessage = new message.NewTransaction()
      .responseType('json');
    return this.db.send(txMessage).then((response) => {
        const loc = response.headers.location;
        const pos = loc.lastIndexOf('/', loc.length - 2) + 1;
        this.tid = loc.substring(pos), (e: { status: number; }) =>
            {
              if (e.status === StatusCode.OBJECT_NOT_FOUND) {
                return null;
              }
              throw e;
            }}).then(doneCallback, failCallback);
  }

  /**
   * Commits a transaction with a given transaction id
   * @param doneCallback The callback is invoked after the transaction committed executed
   * successfully
   * @param  failCallback The callback is invoked if any error occurred
   * @return  A promise which will be fulfilled when commit transaction is successfully executed
   */
  async commit(doneCallback?: any, failCallback?: any): Promise<Json> {
    if (!this.tid) {
      return Promise.reject(new Error('Transaction does not exist.. Please start a new transaction using transaction.begin'));
    }

    const writeSetArray = [];
    const deleteSetArray = [];
    const partialUpdateArray = [];

    for (const key of Object.keys(this.entities)) {
      const val = this.entities[key];
      const state = Metadata.get(val);
      let json: JsonMap;
      // right now we send all the values irrespective whether it changed values or not
      if (state.isAvailable) {
        // getting json will check all collections changes, therefore we must do it before proofing the dirty state
          json = state.type.toJsonValue(state, val, {
            persisting: true,
          }) as JsonMap;
          writeSetArray.push(json);
      }
    }

    for (const id of Object.keys(this.deleteEntities)) {
      const state = Metadata.get(this.deleteEntities[id]);
      if (state.isAvailable != null && state.type instanceof ManagedType) {
          const json: {[attr: string]: any} = {};
          json[id] = state.version;
          deleteSetArray.push(json);
      }
    }

    for (let partialUpdate of this.partialUpdates) {
      const state = Metadata.get(partialUpdate.entity);
      var partialUpdateObject = {
        ref: state.id,
        operations: partialUpdate
      }
      partialUpdateArray.push(partialUpdateObject);
    }

    var jsonObj = {
      writeSet: writeSetArray,
      deleteSet: deleteSetArray,
      partialUpdates: partialUpdateArray
    }

    var jsonBody = JSON.stringify(jsonObj);

    const commitMessage = new message.CommitTransaction(this.tid, jsonBody)
      .responseType('json');

    for (const id of Object.keys(this.deleteEntities)) {
      this.db.detach(this.deleteEntities[id]);
    }

    this.clear();

    let commitResult = await this.getResult(commitMessage);
    if (commitResult) {
      const entries = Object.entries(commitResult);
      for(let idx=0; idx < entries.length; idx ++){
        let entityJSonObj = entries[idx][1];
        for(var id in entityJSonObj){
          var entity = this.db.entityById(id);
          if(entity){
            var newVersion: number = +entityJSonObj[id];
            const state = Metadata.get(entity);
            if(state){
              state.version = newVersion;
            }
          }
        }
      }

    }
    return Promise.resolve(commitResult).then(doneCallback,failCallback);
 }


  async getResult(sqlMessage: Message ) : Promise<Json>{
    let result = await this.db.send(sqlMessage).then((response) =>
        response.entity
      , (e) => {
        if (e.status === StatusCode.OBJECT_NOT_FOUND) {
          return null;
        }
        throw e;
      });
    return result;
  }

  rollback() {
    this.clear();
  }

  clear(){
    this.tid = null;
    this.entities = {};
    this.deleteEntities = {};
    this.partialUpdates = [];
  }

}
