"use strict";
var Metadata = require('../../lib/util/Metadata');
var WebSocketConnector = require('../connector/WebSocketConnector');
var Observable;

try {
  Observable = require('rxjs/Observable').Observable;
} catch (e) {
  if (typeof Rx !== 'undefined') {
    Observable = Rx.Observable;
  } else {
    throw e;
  }
}

/**
 * @alias query.Stream<T>
 */
class Stream {

  /**
   * Returns an RxJS observable.
   *
   * @returns {Observable} an RxJS observable
   */
  observable() {
    return Observable.create(observer => {
      var callback = (e) => {
        if (e.matchType === 'error') {
          observer.error(e);
        } else {
          observer.next(e);
        }
      };

      this.on(this.query.matchTypes, callback);
      return () => {
        this.off(this.query.matchTypes, callback);
      };
    });
  }

  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {string} bucket The Bucket on which the streaming query is performed
   * @param {string} query The serialized query
   * @param {Object} options an object containing parameters
   * @param {string} sort the sort string
   * @param {number} limit the count, i.e. the number of items in the result
   * @param {number} offset offset, i.e. the number of items to skip
   * @param {Node} target the target of the stream
   */
  constructor(entityManager, bucket, query, options, sort, limit, offset, target) {
    var verifiedOptions = Stream.parseOptions(options);
    this.entityManager = entityManager;
    this.query = {
      bucket: bucket,
      matchTypes: verifiedOptions.matchTypes,
      operations: verifiedOptions.operations,
      initial: verifiedOptions.initial,
      query: query,
      sort: sort,
      start: offset,
      count: limit
    };
    this.callbacks = [];
    this.topic = Stream.getTopic(this.query.bucket, this.query.query, this.query.start, this.query.count, this.query.sort, this.query.matchTypes, this.query.operations);
    this.target = target;
    this.socket = WebSocketConnector.create(entityManager._connector);
  }


  on(matchTypes, callback) {
    var wrappedCallback = this._wrapQueryCallback(callback);
    this.socket.subscribe(this.topic, wrappedCallback);

    var queryMessage = {
      register: true,
      topic: this.topic,
      query: this.query
    };

    if (this.query.initial === true) {
      queryMessage.fromstart = true;
    }

    this.socket.sendOverSocket(queryMessage);

    this.callbacks.push({
      matchTypes: matchTypes,
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

  static getTopic(bucket, query, start, count, sort, matchTypes, operations) {
    return [bucket, Stream.getCachableQueryString(query, start, count, sort), Stream.normalizeMatchTypes(matchTypes).join("_"), Stream.normalizeOperations(operations).join("_")].join("/");
  }

  static isEmptyJSONString(string) {
    return string === undefined || string === null || /^\s*(\{\s*\})?\s*$/.test(string);
  }

  /**
   * Valid options are:
   <ul>
   <li>initial: a Boolean indicating whether or not the initial result set should be delivered on creating the subscription</li>
   <li>matchTypes: a list of match types</li>
   <li>operations: a list of operations</li>
   <li></li>
   </ul>
   *
   *
   * @param {Object} provided object containing options
   * @returns {Object} an object containing VALID options
   */
  static parseOptions(provided) {
    var verified = {};

    if (provided) {
      if (provided.initial !== null && provided.initial !== undefined) {
        if (typeof(provided.initial) === "boolean") {
          verified.initial = provided.initial;
        } else {
          throw new Error('Option "initial" only permits Boolean values!');
        }
      }

      if (provided.matchTypes) {
        if (Object.prototype.toString.call(provided.matchTypes) === '[object Array]') {
          verified.matchTypes = provided.matchTypes;
        } else {
          verified.matchTypes = [provided.matchTypes];
        }

        verified.matchTypes = Stream.normalizeMatchTypes(verified.matchTypes);
      }

      if (provided.operations) {
        if (Object.prototype.toString.call(provided.operations) === '[object Array]') {
          verified.operations = provided.operations;
        } else {
          verified.operations = [provided.operations];
        }

        verified.operations = Stream.normalizeOperations(verified.operations);
      }

      if (verified.matchTypes && !verified.matchTypes.includes('all') && verified.operations && !verified.operations.includes('any')) {
        throw new Error('Only subscriptions for either operations or matchTypes are allowed. You cannot subscribe to a query using matchTypes and operations at the same time!');
      }
    }

    // Apply default values if missing
    if (verified.initial === null || verified.initial === undefined) {
      verified.initial = true;
    }

    if (!verified.matchTypes) {
      verified.matchTypes = ['all'];
    }

    if (!verified.operations) {
      verified.operations = ['any'];
    }

    return verified;
  }

  static normalizeMatchTypes(list) {
    return Stream.normalizeSortedSet(list, 'all', "match types", ['add', 'change', 'changeIndex', 'match', 'remove']);
  }

  static normalizeOperations(list) {
    return Stream.normalizeSortedSet(list, 'any', "operations", ['delete', 'insert', 'none', 'update']);
  }

  static normalizeSortedSet(list, wildcard, itemType, allowedItems) {
    if (!list || list.length == 0) {//undefined or empty list --> default value
      return undefined;
    }

    // sort, remove duplicates and check whether all values are allowed
    list.sort();
    var item;
    var lastItem = undefined;
    for (var i = list.length - 1; i >= 0; i--) {
      item = list[i];
      if (!item) {//undefined and null item in the list --> invalid!
        throw new Error('undefined and null not allowed!');
      }
      if (item === lastItem) {//remove duplicates
        list.splice(i, 1);
      }
      if (item === wildcard) {
        return [wildcard];
      }
      if (!allowedItems.includes(item)) {//raise error on invalid elements
        throw new Error(item + ' not allowed for ' + itemType + '! (permitted: ' + allowedItems + '.)');
      }
      lastItem = item;
    }

    return list;
  }

  off(matchTypes, callback) {
    this.callbacks = this.callbacks.reduce((keep, el) => {
      if ((!callback || el.callback == callback) && (!matchTypes || el.matchTypes == matchTypes)) {
        this.socket.unsubscribe(el.topic, el.wrappedCallback);
        el.queryMessage.register = false;
        this.socket.sendOverSocket(el.queryMessage);
      } else {
        keep.push(el);
      }
      return keep;
    }, []);
  }

  _wrapQueryCallback(cb) {
    return function(msg) {
      msg.query = this.query;

      if (msg.result) { //Initial result received
        var basicMatch = {matchType: "add", operation: 'none'};
        var index = 0;
        msg.result.forEach((obj)=> {
          var entity = this._createObject(obj, false);
          if (msg.ordered) {
            basicMatch.index = index++;
          }
          var callback = this.createCallback(msg, basicMatch, entity, true);
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