/**
 * An event for a streaming query.
 *
 * @class
 * @name StreamingEvent<T>
 */

/**
 * the query on which .stream([options]) was invoked
 *
 * @memberOf StreamingEvent<T>.prototype
 * @name target
 * @type query.Node<T>
 */

/**
 * the database entity this event was generated for, e.g. an entity that just entered or left the result set
 *
 * @memberOf StreamingEvent<T>.prototype
 * @name data
 * @type T
 */

/**
 * the operation by which the entity was altered ('insert', 'update' or 'delete'; 'none' if unknown or not applicable)
 *
 * @memberOf StreamingEvent<T>.prototype
 * @name operation
 * @type string
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
 * @memberOf StreamingEvent<T>.prototype
 * @name matchType
 * @type string
 */

/**
 * a boolean value indicating whether this event reflects the matching status at query time (true) or a recent change data change (false)
 *
 * @memberOf StreamingEvent<T>.prototype
 * @name initial
 * @type boolean
 */

/**
 * for sorting queries only: the position of the matching entity in the ordered result (-1 for non-matching entities)
 *
 * @memberOf StreamingEvent<T>.prototype
 * @name index
 * @type number
 */

/**
 * server-time from the instant at which the event was generated
 *
 * @memberOf StreamingEvent<T>.prototype
 * @name date
 * @type Date
 */