/**
 * @class
 * @name query.Query<T>
 */

/**
 * Returns an RxJS observable that receives events for streaming query.
 *
 * @param {Object} [options] options on whether an initial result and what kind of events (w.r.t. match types and operations) are requested
 * @param {boolean} [options.initial=true] whether or not you want to receive the initial result set (i.e. the entities matching the query at subscription time)
 * @param {(string|[string])} [options.matchTypes=['all']] the match types you are interested in; accepts the default ('all'/['all']) or any combination of 'match', 'add', 'change', 'changeIndex' and 'remove'
 * @param {boolean} [options.operations=['any']] the operations you are interested in; accepts the default ('any'/['any']) or any combination of 'insert', 'update', 'delete' and 'none'
 * @returns {Observable<StreamingEvent<T>>} an RxJS observable
 *
 * @memberOf query.Query<T>.prototype
 * @name stream
 * @method
 */

/**
 * @class
 * @name StreamingEvent<T>
 *
 * An event for a streaming query.
 */

/**
 * the query on which .stream([options]) was invoked
 *
 * @memberOf StreamingEvent<T>
 * @name target
 * @type {Node<T>}
 */

/**
 * the database entity this event was generated for, e.g. an entity that just entered or left the result set
 *
 * @memberOf StreamingEvent<T>
 * @name data
 * @type {T}
 */

/**
 * the operation by which the entity was altered ('insert', 'update' or 'delete'; 'none' if unknown or not applicable)
 *
 * @memberOf StreamingEvent<T>
 * @name operation
 * @type {string}
 */

/**
 * indicates how the transmitted entity relates to the query result.
 Every event is delivered with one of the following match types:
 <ul>
 <li> 'match': the entity matches the query. </li>
 <li> 'add': the entity entered the result set, i.e. it did not match before and is matching now. </li>
 <li> 'change': the entity was updated, but remains a match </li>
 <li> 'changeIndex' (for sorting queries only): the entity was updated and remains a match, but changed its position within the query result </li>
 <li> 'remove': the entity was a match before, but is not matching any longer </li>
 </ul>
 * @memberOf StreamingEvent<T>
 * @name matchType
 * @type {string}
 */

/**
 * a boolean value indicating whether this event reflects the matching status at query time (true) or a recent change data change (false)
 *
 * @memberOf StreamingEvent<T>
 * @name initial
 * @type {boolean}
 */

/**
 * for sorting queries only: the position of the matching entity in the ordered result (-1 for non-matching entities)
 *
 * @memberOf StreamingEvent<T>
 * @name index
 * @type {integer}
 */
