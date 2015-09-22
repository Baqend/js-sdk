"use strict";

var message = require('./message');
var Metadata = require('./util/Metadata');
var Entity = require('./binding/Entity');

/**
 * @class baqend.Query
 */
class Query {
  constructor(entityManager, resultClass) {
    /**
     * The owning EntityManager of this query
     * @type baqend.EntityManager
     */
    this.entityManager = entityManager;

    /**
     * The result class of this query
     * @type Function
     */
    this.resultClass = resultClass;
  }

  /**
   * Add an ascending sort for the specified field to this query
   * @param field The field to sort
   * @return {baqend.Query} The resulting Query
   */
  ascending(field) {
    return this._addOrder(field, 1);
  }

  /**
   * Add an decending sort for the specified field to this query
   * @param field The field to sort
   * @return {baqend.Query} The resulting Query
   */
  descending(field) {
    return this._addOrder(field, -1);
  }

  /**
   * Sets the sort of the query and discard all existing paramaters
   * @param {Object} sort The new sort of the query
   * @return {baqend.Query} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.sort/
   */
  sort(sort) {
    if (!(sort instanceof Object) || Object.getPrototypeOf(sort) != Object.prototype)
      throw new Error('sort must be an object.');

    return this._addOrder(sort);
  }

  /**
   * Sets the offset of the query, i.e. how many elements should be skipped
   * @param offset The offset of this query
   * @return {baqend.Query} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.skip/
   */
  offset(offset) {
    if (offset < 0)
      throw new Error("The offset can't be nagative.");

    return this._addOffset(offset);
  }

  /**
   * Sets the limit of this query, i.e hox many objects should be returnd
   * @param limit The limit of this query
   * @return {baqend.Query} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/method/cursor.limit/
   */
  limit(limit) {
    if (limit < 0)
      throw new Error("The limit can't be nagative.");

    return this._addLimit(limit);
  }

  /**
   * Execute the query and return the query results as a List.
   * Note: All local unsaved changes on matching objects, will be discarded.
   * @param {Object} [options] The query options
   * @param {Number|Boolean} [options.depth=0] The object depth which will be loaded. Depth 0 load only the found
   * objects, <code>true</code> loads the objects by reachability.
   * @param {Function=} doneCallback Called when the operation succeed.
   * @param {Function=} failCallback Called when the operation failed.
   * @return {Promise<Array<baqend.binding.Entity>>} A promise that will be resolved with the query result as a list
   */
  resultList(options, doneCallback, failCallback) {}

  /**
   * Execute the query that returns a single result.
   * Note: All local unsaved changes on the matched object, will be discarded.
   * @param {Object} [options] The query options
   * @param {Number|Boolean} [options.depth=0] The object depth which will be loaded. Depth 0 load only the found
   * object, <code>true</code> loads the objects by reachability.
   * @param {Function=} doneCallback Called when the operation succeed.
   * @param {Function=} failCallback Called when the operation failed.
   * @return {Promise<baqend.binding.Entity>} A promise that will be resolved with the query result as a single result
   */
  singleResult(options, doneCallback, failCallback) {}

  stream(fetchQuery) {}

  /**
   * Execute the query that returns the matching objects count.
   * @return {Promise<Number>} The total number of matched objects
   */
  count(doneCallback, failCallback) {}
}

Query.MAX_URI_SIZE = 2000;

/**
 * @class baqend.Query.Condition
 */
Query.Condition = /** @lends baqend.Query.Condition.prototype */ {

  /**
   * An object, that contains filter rules which will be merged with the current filters of this query.
   * @param {Object} conditions - Additional filters for this query
   * @return {baqend.Query.Condition} The resulting Query
   */
  where(conditions) {
    return this._addFilter(null, null, conditions);
  },

  /**
   * Adds a equal filter to the field. All other other filters on the field will be discarded
   * @param {String} field The field to filter
   * @param {*} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   */
  equal(field, value) {
    return this._addFilter(field, null, value);
  },

  /**
   * Adds a not equal filter to the field.
   * @param {String} field The field to filter
   * @param {*} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nin/
   */
  notEqual(field, value) {
    return this._addFilter(field, "$ne", value);
  },

  /**
   * Adds a greater than filter to the field.
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gt/
   */
  greaterThan(field, value) {
    return this._addFilter(field, "$gt", value);
  },

  /**
   * Adds a greater than or equal to filter to the field.
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gte/
   */
  greaterThanOrEqualTo(field, value) {
    return this._addFilter(field, "$gte", value);
  },

  /**
   * Adds a less than filter to the field.
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lt/
   */
  lessThan(field, value) {
    return this._addFilter(field, "$lt", value);
  },

  /**
   * Adds a less than or equal to filter to the field.
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lte/
   */
  lessThanOrEqualTo(field, value) {
    return this._addFilter(field, "$lte", value);
  },

  /**
   * Adds a between filter to the field. This is a shorthand for an less than and greater than filter.
   * @param {String} field The field to filter
   * @param {Number|String|Date} lessValue The field value must be greater than this value
   * @param {Number|String|Date} greaterValue The field value must be less than this value
   * @return {baqend.Query.Condition} The resulting Query
   */
  between(field, lessValue, greaterValue) {
    return this._addFilter(field, "$gt", lessValue)
        ._addFilter(field, "$lt", greaterValue);
  },

  /**
   * Adds a in filter to the field. The field value must be equal to one of the given values
   * @param {String} field The field to filter
   * @param {*|Array<*>} args... The field value or values to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */
  'in'(field, args) {
    return this._addFilter(field, "$in", varargs(1, arguments));
  },

  /**
   * Adds a not in filter to the field. The field value must not be equal to any of the given values
   * @param {String} field The field to filter
   * @param {*|Array<*>} args... The field value or values to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nin/
   */
  notIn(field, args) {
    return this._addFilter(field, "$nin", varargs(1, arguments));
  },

  /**
   * Adds a null filter to the field. The field value must be null
   * @param {String} field The field to filter
   * @return {baqend.Query.Condition} The resulting Query
   */
  isNull(field) {
    return this.equal(field, null);
  },

  /**
   * Adds a not null filter to the field. The field value must not be null
   * @param {String} field The field to filter
   * @return {baqend.Query.Condition} The resulting Query
   */
  isNotNull(field) {
    return this._addFilter(field, "$exists", true)
        ._addFilter(field, "$ne", null);
  },

  /**
   * Adds a contains all filter to the collection field. The collection must contain all the given values.
   * @param {String} field The field to filter
   * @param {*|Array<*>} args... The field value or values to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/all/
   */
  containsAll(field, args) {
    return this._addFilter(field, "$all", varargs(1, arguments));
  },

  /**
   * Adds a modulo filter to the field. The field value divided by divisor must be equal to the remainder.
   * @param {String} field The field to filter
   * @param {Number} divisor The divisor of the modulo filter
   * @param {Number} remainder The remainder of the modulo filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/mod/
   */
  mod(field, divisor, remainder) {
    return this._addFilter(field, "$mod", [divisor, remainder]);
  },

  /**
   * Adds a regular expression filter to the field. The field value must matches the regular expression.
   * <p>Note: Only anchored expressions (Expressions that starts with an ^) and the multiline flag are supported.</p>
   * @param {String} field The field to filter
   * @param {String|RegExp} regExp The regular expression of the filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/regex/
   */
  matches(field, regExp) {
    if (!(Object(regExp) instanceof RegExp)) {
      regExp = new RegExp(regExp);
    }

    if (regExp.ignoreCase) {
      throw new Error('RegExp.ignoreCase flag is not supported.');
    }

    if (regExp.global) {
      throw new Error('RegExp.global flag is not supported.');
    }

    if (regExp.source.indexOf('^') != 0) {
      throw new Error('regExp must be an anchored expression, i.e. it must be started with a ^.');
    }

    var result = this._addFilter(field, '$regex', regExp.source);
    if (regExp.multiline) {
      result._addFilter(field, '$options', 'm');
    }

    return result;
  },

  /**
   * Adds a size filter to the collection field. The collection must have exactly size members.
   * @param {String} field The field to filter
   * @param {Number} size The collections size to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/size/
   */
  size(field, size) {
    return this._addFilter(field, "$size", size);
  },

  /**
   * Adds a geopoint based near filter to the GeoPoint field. The GeoPoint must be within the maximum distance
   * to the given GeoPoint. Returns from nearest to farthest.
   * @param {String} field The field to filter
   * @param {baqend.GeoPoint} geoPoint The GeoPoint to filter
   * @param {Number} maxDistance Tha maximum distance to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/nearSphere/
   */
  near(field, geoPoint, maxDistance) {
    return this._addFilter(field, "$nearSphere", {
      $geometry: {
        type: "Point",
        coordinates: [geoPoint.longitude, geoPoint.latitude]
      },
      $maxDistance: maxDistance
    });
  },

  /**
   * Adds a GeoPoint based polygon filter to the GeoPoint field. The GeoPoint must be contained within the polygon.
   * @param {String} field The field to filter
   * @param {baqend.GeoPoint|Array<baqend.GeoPoint>} geoPoints... The geoPoints that describes the polygon of the filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/geoWithin/
   */
  withinPolygon(field, geoPoints) {
    geoPoints = varargs(1, arguments);
    return this._addFilter(field, "$geoWithin", {
      $geometry: {
        type: "Polygon",
        coordinates: [geoPoints.map(function(geoPoint) {
          return [geoPoint.longitude, geoPoint.latitude];
        })]
      }
    });
  }
};

// aliases
Object.assign(Query.Condition, /** @lends baqend.Query.Condition.prototype */ {
  /**
   * Adds a less than filter to the field. Shorthand for {@link baqend.Query.Condition#lessThan}.
   * @method
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lt/
   */
  lt: Query.Condition.lessThan,

  /**
   * Adds a less than or equal to filter to the field. Shorthand for {@link baqend.Query.Condition#lessThanOrEqualTo}.
   * @method
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/lte/
   */
  le: Query.Condition.lessThanOrEqualTo,

  /**
   * Adds a greater than filter to the field. Shorthand for {@link baqend.Query.Condition#greaterThan}.
   * @method
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gt/
   */
  gt: Query.Condition.greaterThan,

  /**
   * Adds a greater than or equal to filter to the field. Shorthand for {@link baqend.Query.Condition#greaterThanOrEqualTo}.
   * @method
   * @param {String} field The field to filter
   * @param {Number|String|Date} value The value used to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/gte/
   */
  ge: Query.Condition.greaterThanOrEqualTo,

  /**
   * Adds a contains any filter to the collection field. The collection must contains one the given values.
   * Alias for {@link baqend.Query.Condition#in}
   * @method
   * @param {String} field The field to filter
   * @param {*|Array<*>} args... The field value or values to filter
   * @return {baqend.Query.Condition} The resulting Query
   *
   * @see http://docs.mongodb.org/manual/reference/operator/query/in/
   */
  containsAny: Query.Condition.in
});

/**
 * @class baqend.Query.Node
 * @extends baqend.Query
 *
 * @param {baqend.EntityManager} entityManager The owning entity manager of this query
 * @param {Function} resultClass The query result class
 */
class Node extends Query {

  constructor(entityManager, resultClass) {
    super(entityManager, resultClass);

    /**
     * The offset how many results should be skipped
     * @type Number
     */
    this.firstResult = 0;

    /**
     * The limit how many objects should be returned
     * @type Number
     */
    this.maxResults = -1;

    this._sort = {};
  }

  /**
   * @inheritDoc
   */
  stream(fetchQuery) {
    var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;
    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    if (fetchQuery === undefined)
      fetchQuery = true;

    var sort = this._serializeSort();

    return new Query.Stream(this.entityManager, type.name, this._serializeQuery(), fetchQuery, sort, this.maxResults);
  }

  /**
   * @inheritDoc
   */
  resultList(options, doneCallback, failCallback) {
    if(options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    var query = this._serializeQuery();
    var sort = this._serializeSort();

    var uriSize = this.entityManager._connector.host.length + query.length;
    var msg;
    if(uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocQueryPOST(type.name, this.firstResult, this.maxResults, sort, query);
    } else {
      msg = new message.AdhocQuery(type.name, query, this.firstResult, this.maxResults, sort);
    }

    return this.entityManager._send(msg).then(function() {
      return this._createResultList(msg.response.entity, options);
    }.bind(this)).then(doneCallback, failCallback);
  }

  /**
   * @inheritDoc
   */
  singleResult(options, doneCallback, failCallback) {
    if(options instanceof Function) {
      failCallback = doneCallback;
      doneCallback = options;
      options = {};
    }

    var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    var query = this._serializeQuery();
    var sort = this._serializeSort();

    var uriSize = this.entityManager._connector.host.length + query.length;
    var msg;
    if(uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocQueryPOST(type.name, query, this.firstResult, 1, sort, query);
    } else {
      msg = new message.AdhocQuery(type.name, query, this.firstResult, 1, sort);
    }

    return this.entityManager._send(msg).then(function() {
      return this._createResultList(msg.response.entity, options);
    }.bind(this)).then(function(list) {
      return list.length ? list[0] : null;
    }).then(doneCallback, failCallback);
  }

  /**
   * @inheritDoc
   */
  count(doneCallback, failCallback) {
    var type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    var query = this._serializeQuery();

    var uriSize = this.entityManager._connector.host.length + query.length;
    var msg;
    if(uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocCountQueryPOST(type.name, query);
    } else {
      msg = new message.AdhocCountQuery(type.name, query);
    }

    return this.entityManager._send(msg).then(function() {
      return msg.response.entity.count;
    }).then(doneCallback, failCallback);
  }

  _serializeQuery() {
    return JSON.stringify(this, function(k, v) {
      var typedValue = this[k];
      if (Object(typedValue) instanceof Date) {
        return {$date: v};
      } else if (Entity.isEntity(typedValue)) {
        return Metadata.get(typedValue).ref;
      } else {
        return v;
      }
    });
  }

  _serializeSort() {
    return JSON.stringify(this._sort);
  }

  _createResultList(result, options) {
    if (result.length) {
      return Promise.all(result.map(function(el) {
        if (el.id) {
          var entity = this.entityManager.getReference(this.resultClass, el.id);
          var metadata = Metadata.get(entity);
          metadata.setJson(el);
          metadata.setPersistent();
          return this.entityManager.resolveDepth(entity, options);
        } else {
          return this.entityManager.load(Object.keys(el)[0]);
        }
      }, this)).then(function(result) {
        return result.filter(function(val) {
          return !!val;
        });
      });
    } else {
      return Promise.resolve([]);
    }
  }

  _addOrder(fieldOrSort, order) {
    if (order) {
      this._sort[fieldOrSort] = order;
    } else {
      this._sort = fieldOrSort;
    }
    return this;
  }

  _addOffset(offset) {
    this.firstResult = offset;
    return this;
  }

  _addLimit(limit) {
    this.maxResults = limit;
    return this;
  }
}

Query.Node = Node;

/**
 * @class baqend.Query.Builder
 * @extends baqend.Query.Condition
 *
 * @param {baqend.EntityManager} entityManager The owning entity manager of this query
 * @param {Function} resultClass The query result class
 */
class Builder extends Query {

  constructor(entityManager, resultClass) {
    super(entityManager, resultClass);
  }

  /**
   * Joins the conditions by an logical AND
   * @param {baqend.Query} args... The query nodes to join
   * @return {baqend.Query} Returns a new query which joins the given queries by a logical AND
   */
  and(args) {
    return this._addOperator('$and', varargs(0, arguments));
  }

  /**
   * Joins the conditions by an logical OR
   * @param {baqend.Query} args... The query nodes to join
   * @return {baqend.Query} Returns a new query which joins the given queries by a logical OR
   */
  or(args) {
    return this._addOperator('$or', varargs(0, arguments));
  }

  /**
   * Joins the conditions by an logical NOR
   * @param {baqend.Query} args... The query nodes to join
   * @return {baqend.Query} Returns a new query which joins the given queries by a logical NOR
   */
  nor(args) {
    return this._addOperator('$nor', varargs(0, arguments));
  }

  /**
   * @inheritDoc
   */
  stream(fetchQuery) {
    return this.where({}).stream(fetchQuery);
  }

  /**
   * @inheritDoc
   */
  resultList(options, doneCallback, failCallback) {
    return this.where({}).resultList(options, doneCallback, failCallback);
  }

  /**
   * @inheritDoc
   */
  singleResult(options, doneCallback, failCallback) {
    return this.where({}).singleResult(options, doneCallback, failCallback);
  }

  /**
   * @inheritDoc
   */
  count(doneCallback, failCallback) {
    return this.where({}).count(doneCallback, failCallback);
  }

  _addOperator(operator, args) {
    if (args.length < 2) {
      throw new Error('Only two or more queries can be joined with an ' + operator + ' operator.');
    }

    args.forEach(function(arg, index) {
      if (!(arg instanceof Query)) {
        throw new Error('Argument at index ' + index + ' is not a Query.');
      }
    });

    return new Query.Operator(this.entityManager, this.resultClass, operator, args);
  }

  _addOrder(fieldOrSort, order) {
    return new Query.Filter(this.entityManager, this.resultClass)._addOrder(fieldOrSort, order);
  }

  _addFilter(field, filter, value) {
    return new Query.Filter(this.entityManager, this.resultClass)._addFilter(field, filter, value);
  }

  _addOffset(offset) {
    return new Query.Filter(this.entityManager, this.resultClass)._addOffset(offset);
  }

  _addLimit(limit) {
    return new Query.Filter(this.entityManager, this.resultClass)._addLimit(limit);
  }
}

Object.assign(Builder.prototype, Query.Condition);

Query.Builder = Builder;

/**
 * @class baqend.Query.Filter
 * @extends baqend.Query.Node
 * @extends baqend.Query.Condition
 *
 * @param {baqend.EntityManager} entityManager The owning entity manager of this query
 * @param {Function} resultClass The query result class
 */
class Filter extends Query.Node {

  constructor(entityManager, resultClass) {
    super(entityManager, resultClass);

    /**
     * The actual filters of this node
     * @type Object
     */
    this._filter = {};
  }

  _addFilter(field, filter, value) {
    if (field !== null) {
      if (!(Object(field) instanceof String))
        throw new Error('Field must be a string.');

      if (filter) {
        var fieldFilter = this._filter[field];
        if (!(fieldFilter instanceof Object) || Object.getPrototypeOf(fieldFilter) != Object.prototype) {
          this._filter[field] = fieldFilter = {};
        }

        fieldFilter[filter] = value;
      } else {
        this._filter[field] = value;
      }
    } else {
      Object.assign(this._filter, value);
    }

    return this;
  }

  toJSON() {
    return this._filter;
  }
}

Object.assign(Filter.prototype, Query.Condition);
Query.Filter = Filter;

/**
 * @class baqend.Query.Operator
 * @extends baqend.Query.Node
 *
 * @param {baqend.EntityManager} entityManager The owning entity manager of this query
 * @param {Function} resultClass The query result class
 * @param {String} operator The operator used to join the childs
 * @param {Array<baqend.Query.Node>} childs The childs to join
 */
class Operator extends Query.Node {

  constructor(entityManager, resultClass, operator, childs) {
    super(entityManager, resultClass);
    /**
     * The operator used to join the child queries
     * @type String
     */
    this._operator = operator;
    /**
     * The child Node of this query, it is always one
     * @type Array<baqend.Query.Node>
     */
    this._childs = childs;
  }

  toJSON() {
    var json = {};
    json[this._operator] = this._childs;
    return json;
  }
}

Query.Operator = Operator;

/**
 * @class baqend.Query.Stream
 *
 * @param {baqend.EntityManager} entityManager The owning entity manager of this query
 * @param {String} bucket The Bucket on which the streaming query is performed
 * @param {String} query The serialized query
 * @param {Boolean} fetchQuery true if the query result should be fetched
 */
class Stream {
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
        query: this.query
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
    this.callbacks = this.callbacks.reduce(function(keep, el) {
      if ((!callback || el.callback == callback) && (!matchType || el.matchType == matchType)) {
        this.entityManager._unsubscribe(el.topic, el.wrappedCallback);
        el.queryMessage.register = false;
        this.entityManager._sendOverSocket(el.queryMessage);
      } else {
        keep.push(el);
      }
      return keep;
    }.bind(this), []);
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
        var operation = msg.match.update.operation;
        //Hollow object for deletes
        var obj = msg.match.update.object ? msg.match.update.object : {id: msg.match.update.id};
        var entity = this._createObject(bucket, operation, obj);
        //Call wrapped callback
        cb({
          type: msg.match.matchtype,
          data: entity,
          operation: operation,
          date: new Date(msg.date),
          target: this,
          initial: false,
          query: this.query
        });
      } else {
        //Initial result received
        if (!receivedResult) {
          msg.result.forEach(function(obj) {
            var operation = 'insert';
            var entity = this._createObject(bucket, operation, obj, obj.id);
            cb({
              type: 'match',
              data: entity,
              operation: operation,
              date: new Date(msg.date),
              target: this,
              initial: true,
              query: this.query
            });
          }, this);
          receivedResult = true;
        }
      }
    }.bind(this);
  }

  _createObject(bucket, operation, object) {
    var entity = this.entityManager.getReference(bucket, object.id);
    var metadata = Metadata.get(entity);
    metadata.setJson(object);
    metadata.setPersistent();
    return entity;
  }
}

Query.Stream = Stream;

module.exports = Query;

function varargs(offset, args) {
  return Array.isArray(args[offset])? args[offset]: Array.prototype.slice.call(args, offset);
}