"use strict";
var Metadata = require('../../lib/util/Metadata');
var WebSocketConnector = require('../connector/WebSocketConnector');
var lib = require('../../lib');

/**
 * @alias query.Stream
 */
class Stream {

  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {string} query The query options
   * @param {string} query.query The serialized query
   * @param {string} query.bucket The Bucket on which the streaming query is performed
   * @param {string=} query.sort the sort string
   * @param {number=} query.limit the count, i.e. the number of items in the result
   * @param {number=} query.offset offset, i.e. the number of items to skip
   * @param {boolean=} query.initial Indicates if the initial result should be returned
   * @param {Object} options an object containing parameters
   * @param {query.Node<T>} target the target of the stream
   */
  static createStream(entityManager, query, options, target) {
    return Stream.streamObservable(entityManager, query, options, (msg, next) => {
      msg.target = target;

      if (msg.type == 'result') {
        const result = msg.data;
        msg.data.forEach((obj, index) => {
          const event = Object.assign({
            type: 'match',
            matchType: 'add',
            operation: 'none',
            initial: true
          }, msg);

          event.data = Stream._resolveObject(entityManager, obj);
          if (query.sort)
            event.index = index;

          next(event);
        });
      }

      if (msg.type == 'match') {
        msg.data = Stream._resolveObject(entityManager, msg.data);
        next(msg);
      }
    });
  }

  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {string} query The query options
   * @param {string} query.query The serialized query
   * @param {string} query.bucket The Bucket on which the streaming query is performed
   * @param {string=} query.sort the sort string
   * @param {number=} query.limit the count, i.e. the number of items in the result
   * @param {number=} query.offset offset, i.e. the number of items to skip
   * @param {Object} options an object containing parameters
   */
  static createStreamResult(entityManager, query, options) {
    options = options || {};
    options.initial = true;
    options.matchTypes = 'all';
    options.operations = 'any';

    let result, ordered = !!query.sort;
    return Stream.streamObservable(entityManager, query, options, (event, next) => {
      if (event.type == 'result') {
        result = event.data.map(obj => Stream._resolveObject(entityManager, obj));
        event.data = result.slice();
        next(event);
      }

      if (event.type == 'match') {
        if (event.matchType == 'remove' || event.matchType == 'changeIndex') {
          //if we have removed the instance our self, we do not have the cached instances anymore
          //therefore we can't find it anymore in the result by identity
          for (let i = 0, len = result.length; i < len; ++i) {
            if (result[i].id == event.data.id) {
              result.splice(i, 1);
              break;
            }
          }
        }

        if (event.matchType == 'add' || event.matchType == 'changeIndex') {
          let obj = Stream._resolveObject(entityManager, event.data);
          ordered? result.splice(event.index, 0, obj): result.push(obj);
        }

        event.data = result.slice();
        next(event);
      }
    });
  }

  static streamObservable(entityManager, query, options, mapper) {
    options = Stream.parseOptions(options);

    const socket = entityManager.entityManagerFactory.websocket;
    const observable = new lib.Observable(observer => {
      const stream = socket.openStream(entityManager.tokenStorage);

      stream.send(Object.assign({
        type: 'subscribe'
      }, query, options));

      const next = observer.next.bind(observer);
      const subscription = stream.subscribe({
        complete: observer.complete.bind(observer),
        error: observer.error.bind(observer),
        next: (msg) => mapper(msg, next)
      });

      return () => {
        stream.send({type: 'unsubscribe'});
        subscription.unsubscribe();
      }
    });

    return Stream.cachedObservable(observable);
  }

  static cachedObservable(observable) {
    let subscription = null;
    let observers = [];
    return new lib.Observable(observer => {
      if (!subscription) {
        subscription = observable.subscribe({
          next(msg) {
            observers.forEach(o => o.next(msg))
          },
          error(e) {
            observers.forEach(o => o.error(e))
          },
          complete() {
            observers.forEach(o => o.complete())
          }
        });
      }
      observers.push(observer);
      return () => {
        observers.splice(observers.indexOf(observer), 1);
        if (!observers.length) {
          subscription.unsubscribe();
          subscription = null;
        }
      }
    });
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
   * @param {Object} options object containing options
   * @returns {Object} an object containing VALID options
   */
  static parseOptions(options) {
    options = options || {};

    var verified = {
      initial: options.initial === undefined || !!options.initial,
      matchTypes: Stream.normalizeMatchTypes(options.matchTypes),
      operations: Stream.normalizeOperations(options.operations)
    };

    if (verified.matchTypes.indexOf('all') == -1 && verified.operations.indexOf('any') == -1) {
      throw new Error('Only subscriptions for either operations or matchTypes are allowed. You cannot subscribe to a query using matchTypes and operations at the same time!');
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
    if (!list) {
      return [wildcard];
    }

    if (!Array.isArray(list)) {
      list = [list];
    }

    if (list.length == 0) {//undefined or empty list --> default value
      return [wildcard];
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
      if (allowedItems.indexOf(item) == -1) {//raise error on invalid elements
        throw new Error(item + ' not allowed for ' + itemType + '! (permitted: ' + allowedItems + '.)');
      }
      lastItem = item;
    }

    return list;
  }

  static _resolveObject(entityManager, object) {
    const entity  = entityManager.getReference(object.id);
    const metadata = Metadata.get(entity);
    if (!object.version) {
      metadata.setRemoved();
    } else if (entity.version < object.version) {
      metadata.setJson(object);
      metadata.setPersistent();
    }
    return entity;
  }
}

module.exports = Stream;