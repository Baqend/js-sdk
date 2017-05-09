'use strict';
const Observable = require('../lib/observable');
const minimongo = require('minimongo');
const IndexedDb = minimongo.IndexedDb;
const localDb = new IndexedDb({ namespace: 'baqend' }, function () {});

let savedObjectsCollection = 'savedObjects';
let deletedObjectsCollection = 'deletedObjects';

class OfflineService {
    constructor(entityManagerFactory) {
        this.emf = entityManagerFactory;

        this.online = new Observable((observer) => {
            if(window) {
                window.addEventListener('offline', (e) => {
                    observer.next(false);
                });
                window.addEventListener('online', (e) => {
                    //hier der Sync und danach dann next rufen
                    observer.next(true);
                });
            }
        });
    }

    isOnline() {
        return false;
        //return navigator.onLine;
    }

    saveDataLocally(entity, entityClass, offlineSave) {
        let promise = new Promise((resolve, reject) => {
            localDb.addCollection(entityClass, () => {
                entity._id = entity.id;
                localDb[entityClass].upsert(entity, () => {
                    resolve();
                }, (e) => {
                    reject();
                });
            });
        });

        return promise.then(() => {
            if(offlineSave) {
                return this.saveDataLocally(entity, savedObjectsCollection, false);
            }
        })
    };

    deleteLocalEntry(entity, entityClass, offlineDelete) {
        let promise = new Promise((resolve, reject) => {
            localDb.addCollection(entityClass, () => {
                localDb[entityClass].remove(entity.id, (res) => {
                    resolve();
                }, (e) => {
                    reject();
                });
            });
        });

        return promise.then(() => {
            if(offlineDelete)
                return this.saveDataLocally(entity, deletedObjectsCollection, false);
        })
    }

    loadLocalEntry(entity, entityClass) {
        let localLoadResult;
        let promise = new Promise((resolve, reject) => {
            localDb.addCollection(entityClass, () => {
                localDb[entityClass].findOne({ _id: entity.id }, {}, (result) => {
                    localLoadResult = result;
                    resolve();
                }, (e) => {
                    reject();
                });
            });
        });

        return promise.then(() => localLoadResult);
    }

    queryLocalData(query, sort, limit, entityClass) {
        let localQueryResult;
        let promise = new Promise((resolve, reject) => {
            limit = limit < 0 ? 0 : limit;
            localDb.addCollection(entityClass, () => {
                localDb[entityClass].find(JSON.parse(query), { sort: JSON.parse(sort) }, { limit: JSON.parse(limit) }).fetch((result) => {
                    localQueryResult = result;
                    resolve();
                }, (e) => {
                    reject();
                });
            });
        });

        return promise.then(() => localQueryResult);
    };

    conflictResolution() {

    }
}

module.exports = OfflineService;
