/**
 * @class
 * @name query.Query<T>
 *   
 * Returns an RxJS observable that receives events for streaming query.
 *
 * @param {Object} [options] options on whether an initial result and what kind of events (w.r.t. match types and operations) are requested
 * @param {boolean} [options.initial=true] whether or not you want to receive the initial result set (i.e. the entities matching the query at subscription time)
 * @param {(string|[string])} [options.matchTypes=['all']] the match types you are interested in; accepts the default ('all'/['all']) or any combination of 'match', 'add', 'change', 'changeIndex' and 'remove'
 * @param {boolean} [options.operations=['any']] the operations you are interested in; accepts the default ('any'/['any']) or any combination of 'insert', 'update', 'delete' and 'none'
 * @returns {Observable<T>} an RxJS observable
 *
 * @memberOf query.Query<T>.prototype
 * @name stream
 * @method
 */
