"use strict";
var Metadata = require('../../lib/util/Metadata');
var WebSocketConnector = require('../connector/WebSocketConnector');
/**
 * @alias query.Stream
 * @alias query.Stream<T>
 */
class Stream {

  observable(matchType) {
    return Rx.Observable.create(observer => {
      var callback = (e) => {
        if (e.matchType==='error') {
          observer.error(e);
        } else {
          observer.next(e);
        }
      }
      this.on(matchType, callback);
      return () => {
        this.off(matchType, callback);
      };
    });
  }

  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {string} bucket The Bucket on which the streaming query is performed
   * @param {string} query The serialized query
   * @param {boolean} fetchQuery true if the query result should be fetched
   * @param {number} sort
   * @param {number} limit
   * @param target the target of the stream
   */
  constructor(entityManager, bucket, query, fetchQuery, sort, limit, target) {
    this.entityManager = entityManager;
    this.query = {
      bucket: bucket,
      operations: ["any"],
      query: query,
      sort: sort,
      count: limit
    };
    this.fetchQuery = fetchQuery;
    this.callbacks = [];
    this.topic = null;
    this.target = target;
    this.socket = WebSocketConnector.create(entityManager._connector);
  }

  on(matchType, callback) {
    this.query.matchTypes = [matchType];
    this.topic = [this.query.bucket, Stream.getCachableQueryString(this.query.query, 0, this.query.count, this.query.sort), matchType, "any"].join("/");
    var wrappedCallback = this._wrapQueryCallback(callback);
    this.socket.subscribe(this.topic, wrappedCallback);

    var queryMessage = {
      register: true,
      topic: this.topic,
      query: this.query
    };

    if (this.fetchQuery) {
      queryMessage.fromstart = true;
    }

    this.socket.sendOverSocket(queryMessage);

    this.callbacks.push({
      matchType: matchType,
      callback: callback,
      topic: this.topic,
      wrappedCallback: wrappedCallback,
      queryMessage: queryMessage
    });
  }

  static getCachableQueryString(query, start, count, sort) {
    var queryID = query;
    if (Stream.isEmptyJSONString(query)) {
      queryID = "{}";
    }
    if (start > 0) {
      queryID += "&start=" + start;
    }
    if (count > 0) {
      queryID += "&count=" + count;
    }
    if (!Stream.isEmptyJSONString(sort)) {
      queryID += "&sort=" + sort;
    }
    return queryID;
  }

  static isEmptyJSONString(string) {
    return string === undefined || string === null || /^\s*(\{\s*\})?\s*$/.test(string);
  }

  off(matchType, callback) {
    this.callbacks = this.callbacks.reduce((keep, el) => {
      if ((!callback || el.callback == callback) && (!matchType || el.matchType == matchType)) {
        this.socket.unsubscribe(el.topic, el.wrappedCallback);
        el.queryMessage.register = false;
        this.socket.sendOverSocket(el.queryMessage);
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
    return function(msg) {
        msg.query = this.query;

      if (msg.result) { //Initial result received
        msg.result.forEach((obj)=> {
          var entity = this._createObject(obj, false);
          var callback = this.createCallback(msg, {matchType: "match", operation: null}, entity, true);
          cb(callback);
        }, this);
      }
      if (msg.match) {
        //Single Match received, hollow object for deletes
        var obj = msg.match.object;
        var entity = this._createObject(obj, msg.match.operation === "delete");
        //Call wrapped callback
        var callback = this.createCallback(msg, msg.match, entity, false);
        cb(callback);
      }
    }.bind(this);
  }

  createCallback(msg, match, entity, init) {
    var matchEvent = {
      matchType: match.matchType,
      operation: match.operation,
      data: entity,
      date: new Date(msg.date),
      target: this.target,
      initial: init
    };
    if (match.index !== undefined) {
      matchEvent.index = match.index;
    }
    return matchEvent;
  }

  _createObject(object, objectWasDeleted) {
    var entity;
    if (object) {
      entity = this.entityManager.getReference(object.id);
      if (entity.version < object.version || objectWasDeleted) {
        var metadata = Metadata.get(entity);
        if (objectWasDeleted) {
          metadata.setRemoved();
        } else {
          metadata.setJson(object);
          metadata.setPersistent();
        }
      }
    }
    return entity;
  }
}



module.exports = Stream;