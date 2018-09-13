'use strict';

const Metadata = require('../../lib/util/Metadata');
const lib = require('../../lib/baqend');
const uuid = require('../../lib/util/uuid').uuid;

/**
 * @typedef {object} StreamOptions
 * @property {boolean} initial          Indicates whether or not the initial result set should be delivered on
 *                                      creating the subscription.
 * @property {Array<string>} matchTypes A list of match types.
 * @property {Array<string>} operations A list of operations.
 * @property {number} reconnects        The number of reconnects.
 */

/**
 * @alias query.Stream
 */
class Stream {
  /**
   * Creates a live updating object stream for a query
   *
   * @alias query.Stream.createStream<T>
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {string} query The query options
   * @param {string} query.query The serialized query
   * @param {string} query.bucket The Bucket on which the streaming query is performed
   * @param {string=} query.sort the sort string
   * @param {number=} query.limit the count, i.e. the number of items in the result
   * @param {number=} query.offset offset, i.e. the number of items to skip
   * @param {boolean=} query.initial Indicates if the initial result should be returned
   * @param {Partial<StreamOptions>} options an object containing parameters
   * @return {Observable<RealtimeEvent<T>>} The query result as a live updating stream of objects
   */
  static createEventStream(entityManager, query, options) {
    const opt = options || {};
    opt.reconnects = 0;
    return Stream.streamObservable(entityManager, query, opt, (msg, next) => {
      const messageType = msg.type;
      delete msg.type;
      if (messageType === 'result') {
        msg.data.forEach((obj, index) => {
          const event = Object.assign({
            matchType: 'add',
            operation: 'none',
            initial: true,
          }, msg);

          event.data = Stream.resolveObject(entityManager, obj);
          if (query.sort) { event.index = index; }

          next(event);
        });
      }

      if (messageType === 'match') {
        msg.data = Stream.resolveObject(entityManager, msg.data);
        next(msg);
      }
    });
  }

  /**
   * Creates a live updating result stream for a query
   *
   * @alias query.Stream.createStreamResult<T>
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {string} query The query options
   * @param {string} query.query The serialized query
   * @param {string} query.bucket The Bucket on which the streaming query is performed
   * @param {string=} query.sort the sort string
   * @param {number=} query.limit the count, i.e. the number of items in the result
   * @param {number=} query.offset offset, i.e. the number of items to skip
   * @param {Partial<StreamOptions>} options an object containing parameters
   * @return {Observable<Array<T>>} The query result as a live updating query result
   */
  static createResultStream(entityManager, query, options) {
    const opt = options || {};
    opt.initial = true;
    opt.matchTypes = 'all';
    opt.operations = 'any';

    let result;
    const ordered = !!query.sort;
    return Stream.streamObservable(entityManager, query, opt, (event, next) => {
      if (event.type === 'result') {
        result = event.data.map(obj => Stream.resolveObject(entityManager, obj));
        next(result.slice());
      }

      if (event.type === 'match') {
        const obj = Stream.resolveObject(entityManager, event.data);

        if (event.matchType === 'remove' || event.matchType === 'changeIndex') {
          // if we have removed the instance our self, we do not have the cached instances anymore
          // therefore we can't find it anymore in the result by identity
          for (let i = 0, len = result.length; i < len; i += 1) {
            if (result[i].id === event.data.id) {
              result.splice(i, 1);
              break;
            }
          }
        }

        if (event.matchType === 'add' || event.matchType === 'changeIndex') {
          if (ordered) {
            result.splice(event.index, 0, obj);
          } else {
            result.push(obj);
          }
        }

        next(result.slice());
      }
    });
  }

  static streamObservable(entityManager, query, options, mapper) {
    const opt = Stream.parseOptions(options);

    const socket = entityManager.entityManagerFactory.websocket;
    const observable = new lib.Observable((subscriber) => {
      const id = uuid();
      const stream = socket.openStream(entityManager.tokenStorage, id);

      stream.send(Object.assign({
        type: 'subscribe',
      }, query, opt));

      let closed = false;
      const next = subscriber.next.bind(subscriber);
      const subscription = stream.subscribe({
        complete() {
          closed = true;
          subscriber.complete();
        },
        error(e) {
          closed = true;
          subscriber.error(e);
        },
        next(msg) {
          mapper(msg, next);
        },
      });

      return () => {
        if (!closed) { // send unsubscribe only when we aren't completed by the socket and call it only once
          stream.send({ type: 'unsubscribe' });
          subscription.unsubscribe();
          closed = true;
        }
      };
    });

    return Stream.cachedObservable(observable, opt);
  }

  static cachedObservable(observable, options) {
    let subscription = null;
    const observers = [];
    return new lib.Observable((observer) => {
      if (!subscription) {
        let remainingRetries = options.reconnects;
        let backoff = 1;
        const subscriptionObserver = {
          next(msg) {
            // reset the backoff if we get a message
            backoff = 1;
            observers.forEach(o => o.next(msg));
          },
          error(e) {
            observers.forEach(o => o.error(e));
          },
          complete() {
            if (remainingRetries !== 0) {
              remainingRetries = remainingRetries < 0 ? -1 : remainingRetries - 1;

              setTimeout(() => {
                subscription = observable.subscribe(subscriptionObserver);
              }, backoff * 1000);

              backoff *= 2;
            } else {
              observers.forEach(o => o.complete());
            }
          },
        };
        subscription = observable.subscribe(subscriptionObserver);
      }
      observers.push(observer);
      return () => {
        observers.splice(observers.indexOf(observer), 1);
        if (!observers.length) {
          subscription.unsubscribe();
          subscription = null;
        }
      };
    });
  }

  /**
   * Parses the StreamOptions
   *
   * @param {Partial<StreamOptions>=} [options] object containing partial options
   * @returns {StreamOptions} an object containing VALID options
   */
  static parseOptions(options) {
    const opt = options || {};

    const verified = {
      initial: opt.initial === undefined || !!opt.initial,
      matchTypes: Stream.normalizeMatchTypes(opt.matchTypes),
      operations: Stream.normalizeOperations(opt.operations),
      reconnects: Stream.normalizeReconnects(opt.reconnects),
    };

    if (verified.matchTypes.indexOf('all') === -1 && verified.operations.indexOf('any') === -1) {
      throw new Error('Only subscriptions for either operations or matchTypes are allowed. You cannot subscribe to a query using matchTypes and operations at the same time!');
    }

    return verified;
  }

  static normalizeMatchTypes(list) {
    return Stream.normalizeSortedSet(list, 'all', 'match types', ['add', 'change', 'changeIndex', 'match', 'remove']);
  }

  static normalizeReconnects(reconnects) {
    if (reconnects === undefined) {
      return -1;
    }
    return reconnects < 0 ? -1 : Number(reconnects);
  }

  static normalizeOperations(list) {
    return Stream.normalizeSortedSet(list, 'any', 'operations', ['delete', 'insert', 'none', 'update']);
  }

  static normalizeSortedSet(list, wildcard, itemType, allowedItems) {
    if (!list) {
      return [wildcard];
    }

    const li = Array.isArray(list) ? list : [list];

    if (li.length === 0) { // undefined or empty list --> default value
      return [wildcard];
    }

    // sort, remove duplicates and check whether all values are allowed
    li.sort();
    let item;
    let lastItem;
    for (let i = li.length - 1; i >= 0; i -= 1) {
      item = li[i];
      if (!item) { // undefined and null item in the list --> invalid!
        throw new Error('undefined and null not allowed!');
      }
      if (item === lastItem) { // remove duplicates
        li.splice(i, 1);
      }
      if (item === wildcard) {
        return [wildcard];
      }
      if (allowedItems.indexOf(item) === -1) { // raise error on invalid elements
        throw new Error(item + ' not allowed for ' + itemType + '! (permitted: ' + allowedItems + '.)');
      }
      lastItem = item;
    }

    return li;
  }

  static resolveObject(entityManager, object) {
    const entity = entityManager.getReference(object.id);
    const metadata = Metadata.get(entity);
    if (!object.version) {
      metadata.setRemoved();
      entityManager.removeReference(entity);
    } else if (entity.version <= object.version) {
      metadata.setJson(object, { persisting: true });
    }
    return entity;
  }
}

module.exports = Stream;
