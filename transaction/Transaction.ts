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
    const writeSetList = this.entities;
    const deleteSetList = this.deleteEntities;
    let jsonBody = '{';
    let writeSetJson = '';
    let deleteSetJson = '';
    let partialUpdatesJson = '';
    const writeArray = [];
    const deleteArray = [];
    const partialUpdateArray = this.partialUpdates;

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
          this.clear();
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
      const object = deleteSetList[key];
      const state = Metadata.get(object);
      const type = state.type;
      if (state.isAvailable) {
        try {
          if (type instanceof ManagedType) {
            const value: {[attr: string]: any} = {};
            const json: {[attr: string]: any} = {};
            let iter = type.attributes();
            let count: number = 0;
            for (let el = iter.next(); count < 2; el = iter.next()) {
              const attribute = el.value;
              value[attribute.name] = attribute.getJsonValue(state, object, {persisting: true});
              count++;
            }
            json[value.id] = `${value.version}`;
            deleteArray.push(JSON.stringify(json));  
          }
        }
        catch (e)
        {
          this.clear();
          throw e;
        }
      }
    }
  
    if (deleteArray.length > 0) {
      if (writeArray.length > 0) {
        deleteSetJson += ', ';
      }
      deleteSetJson += '"deleteSet": [';
      const deleteSetBody = deleteArray.join(',');
      deleteSetJson += deleteSetBody;
      deleteSetJson += ']';
    }

    if(partialUpdateArray.length > 0){
      if (writeArray.length > 0 || deleteArray.length > 0) {
        partialUpdatesJson += ', ';
      }
      partialUpdatesJson += '"partialUpdates": [';
      var first = true;
      for (let partialUpdate of partialUpdateArray) {
        if(! first){
          partialUpdatesJson += ',';  
        }
        first = false;

        var json = '{ "ref": "';
        const state = Metadata.get(partialUpdate.entity);
        json += state.id;
        json += '", "operations": '
        json += JSON.stringify(partialUpdate);
        json += '}'

        partialUpdatesJson += json;
      }
      partialUpdatesJson += ']';
    }

    jsonBody += `${writeSetJson}${deleteSetJson}${partialUpdatesJson}}`;

    const sqlMessage = new message.CommitTransaction(this.tid, jsonBody)
      .responseType('json');

    this.clear();

     let data = await this.getResult(sqlMessage);
     if (data) {
      const entries = Object.entries(data);
      for(let idx=0; idx < entries.length; idx ++){
        var entity = null;
        var mappedId = null;
        let str = JSON.stringify(entries[idx][1]);
        let colonPos = str.indexOf("%3A");  // colon
        if(colonPos > 0){
          let oldId = str.substring(2, colonPos);
          let path = oldId.substring(0, oldId.lastIndexOf("/") + 1);
          let quotePos = str.indexOf('"', colonPos + 3);
          mappedId = path + str.substring(colonPos + 3, quotePos);
          entity = this.db.entityById(oldId);
        } else {
          let startPos = str.indexOf('/');
          let quotePos = str.indexOf('"', startPos);
          mappedId = str.substring(startPos, quotePos);
          entity = this.db.entityById(mappedId);
        }
        if(entity){
          let versionColonPos = str.lastIndexOf(':');
          let closingBracketPos = str.lastIndexOf('}');
          let newVersion = str.substring(versionColonPos + 2, closingBracketPos -1);
          var newVersionAsNum: number = +newVersion;

          const state = Metadata.get(entity);
          if(state){
            state.version = newVersionAsNum;
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
      return Promise.reject(new Error("Nothing to do. Transaction does not exist"));
      this.clear();

    return Promise.resolve("");
  }

  clear(){
    this.tid = null;
    this.entities = {};
    this.deleteEntities = {};
    this.partialUpdates = [];
  }

}
