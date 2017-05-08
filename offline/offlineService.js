'use strict';
const minimongo = require('minimongo');
const IndexedDb = minimongo.IndexedDb;
const db = new IndexedDb({ namespace: 'baqend' }, function () {});

class OfflineService {

    // TODO add functionality to diagnose flaky internet connection
    isOnline() {
        return false;
        //return navigator.onLine;
    }

    saveDataLocally(entity, entityClass, offlineUpdate) {
        let promise = new Promise(function (resolve, reject) {
            db.addCollection(entityClass, function () {
                if (offlineUpdate)
                    entity.offlineUpdate = true;

                entity._id = entity.id;
                db[entityClass].upsert(entity, function () { resolve(); });
            });
        });

        return promise;
    };

    deleteLocalEntry(entity, entityClass, offlineDelete) {
        let promise = new Promise(function (resolve, reject) {
            db.addCollection(entityClass, function () {
                db[entityClass].remove(entity.id, function (res) {
                    resolve();
                });
            });
        });

        return promise.then(() => {
            if(offlineDelete)
                return this.saveDataLocally(entity, 'deletedObjects', false);
            return;
        })
    }

    loadLocalEntry(entity, entityClass) {
        let localLoadResult;
        let promise = new Promise(function (resolve, reject) {
            db.addCollection(entityClass, function () {
                db[entityClass].findOne({ _id: entity.id }, {}, function (result) {
                    localLoadResult = result;
                    resolve();
                });
            });
        });

        return promise.then(() => localLoadResult);
    }

    queryLocalData(query, sort, limit, entityClass) {
        let localQueryResult;
        let promise = new Promise(function (resolve, reject) {
            limit = limit < 0 ? 0 : limit;
            db.addCollection(entityClass, function () {
                db[entityClass].find(JSON.parse(query), { sort: JSON.parse(sort) }, { limit: JSON.parse(limit) }).fetch(function (result) {
                    localQueryResult = result;
                    resolve();
                });
            });
        });

        return promise.then(() => localQueryResult);
    };
}

module.exports = OfflineService;
