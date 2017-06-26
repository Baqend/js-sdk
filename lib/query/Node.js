"use strict";

const Query = require('./Query');
const message = require('../message');
const Metadata = require('../util/Metadata');
const Entity = require('../binding/Entity');

/**
 * @alias query.Node<T>
 * @extends query.Query<T>
 */
class Node extends Query {

  /**
   * @param {EntityManager} entityManager The owning entity manager of this query
   * @param {Class<T>} resultClass The query result class
   */
  constructor(entityManager, resultClass) {
    super(entityManager, resultClass);

    /**
     * The offset how many results should be skipped
     * @type number
     */
    this.firstResult = 0;

    /**
     * The limit how many objects should be returned
     * @type number
     */
    this.maxResults = -1;

    this._sort = {};
  }

  /**
   * @inheritDoc
   */
  eventStream() {
    throw new Error('Streaming features not available! Please use Streaming SDK!');
  }

  /**
   * @inheritDoc
   */
  resultStream() {
    throw new Error('Streaming features not available! Please use Streaming SDK!');
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

    let type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    const query = this._serializeQuery();
    const sort = this._serializeSort();

    const uriSize = this.entityManager._connector.host.length + query.length + sort.length;
    let msg;
    if(uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocQueryPOST(type.name, this.firstResult, this.maxResults, sort)
        .entity(query, 'text');
    } else {
      msg = new message.AdhocQuery(type.name, query, this.firstResult, this.maxResults, sort);
    }

    return this.entityManager.send(msg).then((response) => {
      return this._createResultList(response.entity, options);
    }).then(doneCallback, failCallback);
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

    let type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    const query = this._serializeQuery();
    const sort = this._serializeSort();

    const uriSize = this.entityManager._connector.host.length + query.length;
    let msg;
    if(uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocQueryPOST(type.name, query, this.firstResult, 1, sort)
      .entity(query, 'text');
    } else {
      msg = new message.AdhocQuery(type.name, query, this.firstResult, 1, sort);
    }

    return this.entityManager.send(msg).then((response) => {
      return this._createResultList(response.entity, options);
    }).then((list) => {
      return list.length ? list[0] : null;
    }).then(doneCallback, failCallback);
  }

  /**
   * @inheritDoc
   */
  count(doneCallback, failCallback) {
    let type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    const query = this._serializeQuery();

    const uriSize = this.entityManager._connector.host.length + query.length;
    let msg;
    if(uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocCountQueryPOST(type.name)
      .entity(query, 'text');
    } else {
      msg = new message.AdhocCountQuery(type.name, query);
    }

    return this.entityManager.send(msg).then((response) => {
      return response.entity.count;
    }).then(doneCallback, failCallback);
  }

  _serializeQuery() {
    return JSON.stringify(this, function(k, v) {
      const typedValue = this[k];
      if (Object(typedValue) instanceof Date) {
        return {$date: v};
      } else if (typedValue instanceof Entity) {
        return typedValue.id;
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
          const entity = this.entityManager.getReference(this.resultClass, el.id);
          const metadata = Metadata.get(entity);
          metadata.setJson(el, {persisting: true});
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

module.exports = Node;