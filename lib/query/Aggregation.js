"use strict";

const message = require('../message');
const Metadata = require('../util/Metadata');
const Query = require('./Query');

class Aggregation {
    constructor(entityManager, bucket) {
        /**
         * The owning EntityManager of this query
         * @type EntityManager
         */
        this.entityManager = entityManager;
        this.bucket = bucket;
        this._pipeline = [];
    };


    addStage(stage) {
        if (Object.prototype.toString.call(stage) === '[object String]') {
            stage = JSON.parse(stage);
        }
        this._pipeline.push(stage)
        return this;
    };


    result(doneCallback, failCallback) {
        let type = this.bucket ? this.entityManager.metamodel.entity(this.bucket) : null;

        if (!type) {
            throw new Error('Only typed queries can be executed.');
        }

        let query = this._serializeQuery();

        let uriSize = this.entityManager._connector.host.length + query.length;

        let msg;

        if (uriSize > Query.MAX_URI_SIZE) {
            msg = new message.AggregationQueryPOST(type.name)
                .entity(query, 'text');
        } else {
            msg = new message.AggregationQuery(type.name, query);
        }

        return this.entityManager.send(msg).then((response) => {
            return response.entity;
        }).then(doneCallback, failCallback);
    };

    _serializeQuery() {
        return JSON.stringify(this._pipeline);
    };

    toJSON() {
        return this._pipeline;
    }

}


module.exports = Aggregation;