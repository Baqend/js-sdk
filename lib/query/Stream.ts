import { Observable, Subscription, Subscriber } from '../util/observable';
import { uuid, JsonMap } from '../util';
import { ChannelMessage } from '../connector';
import { MatchType, Operation, RealtimeEvent } from './RealtimeEvent';
import { Entity } from '../binding';
import type { EntityManager } from '../EntityManager';
import { EventStreamOptions, ResultStreamOptions } from './Query';
import { Metadata } from '../intersection';

type InitialResultEvent = ChannelMessage & {
  /**
   * The event type can be initial result, match event or an error
   */
  type: 'result';

  /**
   * the database entity this event was generated for, e.g. an entity that just entered or left the result set, or
   * an array of entities, if this event type is an initial result
   */
  data: JsonMap[];
};

type MatchEvent = ChannelMessage & {
  /**
   * The event type can be initial result, match event or an error
   */
  type: 'match';

  /**
   * the database entity this event was generated for, e.g. an entity that just entered or left the result set, or
   * an array of entities, if this event type is an initial result
   */
  data: JsonMap;

  /**
   * the operation by which the entity was altered
   * 'none' if unknown or not applicable
   */
  operation: Operation;

  /**
   * indicates how the transmitted entity relates to the query result.
   Every event is delivered with one of the following match types:
   <ul>
   <li> 'match': the entity matches the query. </li>
   <li> 'add': the entity entered the result set, i.e. it did not match before and is matching now. </li>
   <li> 'change': the entity was updated, but remains a match </li>
   <li> 'changeIndex' (for sorting queries only): the entity was updated and remains a match, but changed its position
   within the query result </li>
   <li> 'remove': the entity was a match before, but is not matching any longer </li>
   </ul>
   */
  matchType: MatchType;

  /**
   * for sorting queries only: the position of the matching entity in the ordered result (-1 for non-matching entities)
   */
  index: number;
};

type ErrorEvent = ChannelMessage & {
  /**
   * The event type can be initial result, match event or an error
   */
  type: 'error';
};

type BaseEvent = InitialResultEvent | MatchEvent | ErrorEvent;

export class Stream {
  /**
   * Creates a live updating object stream for a query
   *
   * @param entityManager The owning entity manager of this query
   * @param query The query options
   * @param query.query The serialized query
   * @param query.bucket The Bucket on which the streaming query is performed
   * @param query.sort the sort string
   * @param query.limit the count, i.e. the number of items in the result
   * @param query.offset offset, i.e. the number of items to skip
   * @param query.initial Indicates if the initial result should be returned
   * @param options an object containing parameters
   * @return The query result as a live updating stream of objects
   */
  static createEventStream<T extends Entity>(entityManager: EntityManager, query: JsonMap,
    options?: EventStreamOptions): Observable<RealtimeEvent<T>> {
    const opt = options || {};
    opt.reconnects = 0;
    return Stream.streamObservable<T, RealtimeEvent<T>>(entityManager, query, opt, (msg, next) => {
      const { type, ...eventProps } = msg;

      if (msg.type === 'result') {
        msg.data.forEach((obj, index) => {
          const event: RealtimeEvent<T> = {
            matchType: 'add',
            operation: 'none',
            initial: true,
            ...eventProps,
            data: Stream.resolveObject(entityManager, obj),
            ...(query.sort && { index }),
          };

          next(event);
        });
      }

      if (msg.type === 'match') {
        next({
          initial: false,
          ...(eventProps as MatchEvent),
          data: Stream.resolveObject(entityManager, msg.data),
        });
      }
    });
  }

  /**
   * Creates a live updating result stream for a query
   *
   * @alias query.Stream.createStreamResult<T>
   * @param entityManager The owning entity manager of this query
   * @param query The query options
   * @param query.query The serialized query
   * @param query.bucket The Bucket on which the streaming query is performed
   * @param query.sort the sort string
   * @param query.limit the count, i.e. the number of items in the result
   * @param query.offset offset, i.e. the number of items to skip
   * @param options an object containing parameters
   * @return The query result as a live updating query result
   */
  static createResultStream<T extends Entity>(entityManager: EntityManager, query: JsonMap,
    options?: ResultStreamOptions): Observable<T[]> {
    const opt: EventStreamOptions = options || {};
    opt.initial = true;
    opt.matchTypes = 'all';
    opt.operations = 'any';

    let result: T[];
    const ordered = !!query.sort;
    return Stream.streamObservable<T, T[]>(entityManager, query, opt, (event: BaseEvent, next) => {
      if (event.type === 'result') {
        result = event.data.map((obj) => Stream.resolveObject(entityManager, obj));
        next(result.slice());
      }

      if (event.type === 'match') {
        const obj = Stream.resolveObject<T>(entityManager, event.data);

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

  static streamObservable<T extends Entity, R>(entityManager: EntityManager, query: JsonMap,
    options: EventStreamOptions, mapper: (event: BaseEvent, next: (result: R) => any) => any): Observable<R> {
    const opt = Stream.parseOptions(options);

    const socket = entityManager.entityManagerFactory.websocket;
    const observable = new Observable<R>((subscriber) => {
      const id = uuid();
      const stream = socket.openStream(entityManager.tokenStorage, id);

      stream.send({
        type: 'subscribe',
        ...query,
        ...opt,
      });

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
          mapper(msg as BaseEvent, next);
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

  static cachedObservable<T>(observable: Observable<T>, options: JsonMap): Observable<T> {
    let subscription: Subscription | null = null;
    const observers: Subscriber<T>[] = [];
    return new Observable<T>((observer) => {
      if (!subscription) {
        let remainingRetries = options.reconnects as number;
        let backoff = 1;
        const subscriptionObserver = {
          next(msg: T) {
            // reset the backoff if we get a message
            backoff = 1;
            observers.forEach((o) => o.next(msg));
          },
          error(e: Error) {
            observers.forEach((o) => o.error(e));
          },
          complete() {
            if (remainingRetries !== 0) {
              remainingRetries = remainingRetries < 0 ? -1 : remainingRetries - 1;

              setTimeout(() => {
                subscription = observable.subscribe(subscriptionObserver);
              }, backoff * 1000);

              backoff *= 2;
            } else {
              observers.forEach((o) => o.complete());
            }
          },
        };
        subscription = observable.subscribe(subscriptionObserver);
      }
      observers.push(observer);
      return () => {
        observers.splice(observers.indexOf(observer), 1);
        if (!observers.length && subscription) {
          subscription.unsubscribe();
          subscription = null;
        }
      };
    });
  }

  /**
   * Parses the StreamOptions
   *
   * @param [options] object containing partial options
   * @returns an object containing VALID options
   */
  static parseOptions(options?: EventStreamOptions): JsonMap {
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

  static normalizeMatchTypes(list: string | string[] | undefined) {
    return Stream.normalizeSortedSet(list, 'all', 'match types', ['add', 'change', 'changeIndex', 'match', 'remove']);
  }

  static normalizeReconnects(reconnects: number | undefined | string) {
    if (reconnects === undefined) {
      return -1;
    }
    return reconnects < 0 ? -1 : Number(reconnects);
  }

  static normalizeOperations(list: string | string[] | undefined) {
    return Stream.normalizeSortedSet(list, 'any', 'operations', ['delete', 'insert', 'none', 'update']);
  }

  static normalizeSortedSet(list: string | string[] | undefined, wildcard: string, itemType: string,
    allowedItems: string[]) {
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
    let lastItem = null;
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
        throw new Error(`${item} not allowed for ${itemType}! (permitted: ${allowedItems}.)`);
      }
      lastItem = item;
    }

    return li;
  }

  static resolveObject<T extends Entity>(entityManager: EntityManager, object: JsonMap): T {
    const entity: T = entityManager.getReference(object.id as string);
    const metadata = Metadata.get(entity);
    if (!object.version) {
      metadata.setRemoved();
      entityManager.removeReference(entity);
    } else if (entity.version! <= object.version) {
      metadata.setJson(object, { persisting: true });
    }
    return entity;
  }
}
