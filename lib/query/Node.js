'use strict';

const Query = require('./Query');
const message = require('../message');
const Metadata = require('../util/Metadata');
const Entity = require('../binding/Entity');
const deprecated = require('../util/deprecated');

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

    /**
     * The properties which should be used sort the result
     * @type Object<string,number>
     */
    this.order = {};
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
    if (options instanceof Function) {
      return this.resultList({}, options, doneCallback);
    }

    const type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    const query = this.serializeQuery();
    const sort = this.serializeSort();

    const uriSize = this.entityManager.connection.host.length + query.length + sort.length;
    let msg;

    if (uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocQueryPOST(type.name, this.firstResult, this.maxResults, sort)
        .entity(query, 'text');
    } else {
      msg = new message.AdhocQuery(type.name, query, this.firstResult, this.maxResults, sort);
    }

    return this.entityManager.send(msg)
      .then(response => this.createResultList(response.entity, options))
      .then(doneCallback, failCallback);
  }

  /**
   * @inheritDoc
   */
  singleResult(options, doneCallback, failCallback) {
    if (options instanceof Function) {
      return this.singleResult({}, options, doneCallback);
    }

    const type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    const query = this.serializeQuery();
    const sort = this.serializeSort();

    const uriSize = this.entityManager.connection.host.length + query.length;
    let msg;
    if (uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocQueryPOST(type.name, query, this.firstResult, 1, sort)
        .entity(query, 'text');
    } else {
      msg = new message.AdhocQuery(type.name, query, this.firstResult, 1, sort);
    }

    return this.entityManager.send(msg)
      .then(response => this.createResultList(response.entity, options))
      .then(list => (list.length ? list[0] : null))
      .then(doneCallback, failCallback);
  }

  /**
   * @inheritDoc
   */
  count(doneCallback, failCallback) {
    const type = this.resultClass ? this.entityManager.metamodel.entity(this.resultClass) : null;

    if (!type) {
      throw new Error('Only typed queries can be executed.');
    }

    const query = this.serializeQuery();

    const uriSize = this.entityManager.connection.host.length + query.length;
    let msg;
    if (uriSize > Query.MAX_URI_SIZE) {
      msg = new message.AdhocCountQueryPOST(type.name)
        .entity(query, 'text');
    } else {
      msg = new message.AdhocCountQuery(type.name, query);
    }

    return this.entityManager.send(msg)
      .then(response => response.entity.count)
      .then(doneCallback, failCallback);
  }

  serializeQuery() {
    return JSON.stringify(this, function argSerializer(k, v) {
      // this referees here to the objet which owns the key k
      const typedValue = this[k];
      if (typedValue instanceof Date) {
        return { $date: v };
      } else if (typedValue instanceof Entity) {
        return typedValue.id;
      }
      return v;
    });
  }

  serializeSort() {
    return JSON.stringify(this.order);
  }

  createResultList(result, options) {
    if (result.length) {
      return Promise.all(result.map((el) => {
        if (el.id) {
          const entity = this.entityManager.getReference(this.resultClass, el.id);
          const metadata = Metadata.get(entity);
          metadata.setJson(el, { persisting: true });
          return this.entityManager.resolveDepth(entity, options);
        }

        return this.entityManager.load(Object.keys(el)[0]);
      }, this))
        .then(objects => objects.filter(val => !!val));
    }

    return Promise.resolve([]);
  }

  addOrder(fieldOrSort, order) {
    if (order) {
      this.order[fieldOrSort] = order;
    } else {
      this.order = fieldOrSort;
    }
    return this;
  }

  addOffset(offset) {
    this.firstResult = offset;
    return this;
  }

  addLimit(limit) {
    this.maxResults = limit;
    return this;
  }
}

deprecated(Node.prototype, '_sort', 'order');
deprecated(Node.prototype, '_serializeQuery', 'serializeQuery');
deprecated(Node.prototype, '_serializeSort', 'serializeSort');
deprecated(Node.prototype, '_createResultList', 'createResultList');
deprecated(Node.prototype, '_addOrder', 'addOrder');
deprecated(Node.prototype, '_addOffset', 'addOffset');
deprecated(Node.prototype, '_addLimit', 'addLimit');

module.exports = Node;
