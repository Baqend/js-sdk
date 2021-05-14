import {
  Json, JsonMap
} from '../lib/util';
import * as message from '../lib/message';
import {
  StatusCode, Message
} from '../lib/connector';

import {EntityManager} from '../lib';
import {Metadata} from "../lib/intersection";

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
  async begin(doneCallback?: any, failCallback?: any): Promise<string> {
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
   * @param doneCallback The callback is invoked after the transaction committed executed
   * successfully
   * @param  failCallback The callback is invoked if any error occurred
   * @return  A promise which will be fulfilled when commit transaction is successfully executed
   */
  async commit(doneCallback?: any, failCallback?: any): Promise<Json> {
    if (!this.tid) {
      return Promise.reject(Error('Transaction does not exist.. Please start a new transaction using transaction.begin'));
    }
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
        try {
          json = state.type.toJsonValue(state, val, {
            persisting: true,
          }) as JsonMap;
          writeArray.push(JSON.stringify(json));
        }
        catch (e)
        {
          this.tid = null;
          this.db.transactionalEntities = {};
          this.db.transactionalDeleteEntities = {};
          throw e;
        }
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
        try {
          json = state.type.toDeleteJsonValue(state, deleteSetList[key], {
            persisting: true,
          });
          deleteArray.push(JSON.stringify(json));
        }
        catch (e)
        {
          this.tid = null;
          this.db.transactionalEntities = {};
          this.db.transactionalDeleteEntities = {};
          throw e;
        }
      }
    }

    if (writeArray.length > 0 && deleteArray.length > 0) {
      writeSetJson += ',';
    }

    if (deleteArray.length > 0) {
      deleteSetJson += '"deleteSet": [';
      const deleteSetBody = deleteArray.join(',');
      deleteSetJson += deleteSetBody;
      deleteSetJson += ']';
    }

    jsonBody += `${writeSetJson} ${deleteSetJson}}`;

    console.log(`ResultSet --> ${jsonBody}`);
    const sqlMessage = new message.CommitTransaction(this.tid, jsonBody)
      .responseType('json');


    let data = await this.getResult(sqlMessage).catch(e => {
      this.tid = null;
      this.db.transactionalEntities = {};
      this.db.transactionalDeleteEntities = {};
    });

    if (data){
      this.tid = null;
      this.db.transactionalEntities = {};
      this.db.transactionalDeleteEntities = {};

      const entries = Object.entries(data);
      for(let idx=0; idx < entries.length; idx ++){
        let str = JSON.stringify(entries[idx][1]);
        let colonPos = str.indexOf("%3A");  // colon
        if(colonPos){
          let oldId = str.substring(2, colonPos);
          let path = oldId.substring(0, oldId.lastIndexOf("/") + 1);
          let quotePos = str.indexOf('"', colonPos + 3);
          let mappedId = path + str.substring(colonPos + 3, quotePos);
          let entity = this.db.entityById(oldId);
          if(entity){
            const state = Metadata.get(entity);
            if(state){
              if (state.id && state.id !== mappedId) {
                this.db.removeReference(entity);
                state.id = mappedId;
                state.decodedKey = null;
                this.db._attach(entity);
              }
            }
          }
        }
      }
    }

    return Promise.resolve(data).then(doneCallback,failCallback);

 }

  async getResult(sqlMessage: Message ) : Promise<Json>{
    // Here’s the magic
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

  rollback(doneCallback?: any, failCallback?: any): Promise<string> {
    if (!this.tid)
      return Promise.reject(Error("Nothing to do. Transaction does not exist"));
    this.db.transactionalEntities = {};
    this.db.transactionalDeleteEntities = {};
	  this.tid = null;

    return Promise.resolve("");
  }

}
