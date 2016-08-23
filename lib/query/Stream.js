"use strict";
var Metadata = require('../util/Metadata');

/**
 * @alias query.Stream
 * @alias query.Stream<T>
 */
class Stream {

  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {string} bucket The Bucket on which the streaming query is performed
   * @param {string} query The serialized query
   * @param {boolean} fetchQuery true if the query result should be fetched
   * @param {number} sort
   * @param {number} limit
   */
  constructor(entityManager, bucket, query, fetchQuery, sort, limit) {
    this.entityManager = entityManager;
    this.bucket = bucket;
    this.fetchQuery = fetchQuery;
    this.sort = sort;
    this.limit = limit;
    this.query = query;
    this.callbacks = [];
  }

  on(matchType, callback) {
    var topic = [this.bucket, this.query, matchType, "any"].join("/");
    var wrappedCallback = this._wrapQueryCallback(callback);
    this.entityManager._subscribe(topic, wrappedCallback);

    var queryMessage = {
      register: true,
      topic: topic,
      query: {
        bucket: this.bucket,
        matchTypes: [matchType],
        operations: ["any"],
        query: this.query,
        sort: this.sort,
        count: this.limit
      }
    };

    if (this.fetchQuery) {
      queryMessage.fromstart = true;
      queryMessage.limit = this.limit;
      queryMessage.sort = this.sort;
    }

    this.entityManager._sendOverSocket(queryMessage);

    this.callbacks.push({
      matchType: matchType,
      callback: callback,
      topic: topic,
      wrappedCallback: wrappedCallback,
      queryMessage: queryMessage
    });
  }

  off(matchType, callback) {
    this.callbacks = this.callbacks.reduce((keep, el) => {
      if ((!callback || el.callback == callback) && (!matchType || el.matchType == matchType)) {
        this.entityManager._unsubscribe(el.topic, el.wrappedCallback);
        el.queryMessage.register = false;
        this.entityManager._sendOverSocket(el.queryMessage);
      } else {
        keep.push(el);
      }
      return keep;
    }, []);
  }

  once(matchType, callback) {
    var wrapped = function(entity, operation, match) {
      this.off(matchType, wrapped);
      callback(entity, operation, match);
    }.bind(this);
    this.on(matchType, wrapped);
  }

  _wrapQueryCallback(cb) {
    var receivedResult = false;
    return function(msg) {
      var bucket = msg.query.bucket;
      if (msg.match) {
        //Single Match received
        //Hollow object for deletes
        var obj = msg.match.object ? msg.match.object : msg.match.update.object ? msg.match.update.object : undefined;
        let entity = this._createObject(bucket, obj, msg.match.id);
        //Call wrapped callback
        var callback = this.createCallback(msg, msg.match.id, entity, msg.match.update.operation, msg.match.matchType, false);
        cb(callback);
      } else {
        //Initial result received
        if (!receivedResult) {
          msg.result.forEach(function(obj) {
            var entity = this._createObject(bucket, obj, obj.id);
            var callback = this.createCallback(msg, obj.id, entity, null, 'match', true);
            cb(callback);
          }, this);
          receivedResult = true;
        }
      }
    }.bind(this);
  }

  createCallback(msg, objId, entity, operation, matchType, init) {
    let o = {
      id: objId,
      type: matchType,
      data: entity,
      operation: operation,
      date: new Date(msg.date),
      target: this,
      initial: init,
      query: this.query
    };
    if (msg.query.sort !== undefined) {
      o.sort = msg.query.sort;
    }
    if (msg.query.count !== undefined) {
      o.limit = msg.query.count;
    }
    if (msg.match) {
      if (msg.match.index !== undefined) {
        o.index = msg.match.index;
      }
      if (msg.match.lastIndex !== undefined) {
        o.lastIndex = msg.match.lastIndex;
      }
      if (msg.match.sequenceNumber !== undefined) {
        o.sequenceNumber = msg.match.sequenceNumber;
      }
      if (msg.match.lastProcessedObjectVersion !== undefined) {
        o.lastProcessedObjectVersion = msg.match.lastProcessedObjectVersion;
      }
    }
    return o;
  }

  _createObject(bucket, object, objId) { 
    let entity = this.entityManager.getReference(bucket, objId);
    if (object && object.id === objId) {
      let metadata = Metadata.get(entity);
      metadata.setJson(object);
      metadata.setPersistent();
    }
    return entity;
  }
}

module.exports = Stream;