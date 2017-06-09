'use strict';
const Observable = require('../observable');
const message = require('../message');
const Message = require('../connector/Message');
const StatusCode = Message.StatusCode;

const minimongo = require('minimongo');
const IndexedDb = minimongo.IndexedDb;

let savedObjectsCollection = 'savedObjectsCollection';
let deletedObjectsCollection = 'deletedObjectsCollection';

/**
 * @alias OfflineService
 */
class OfflineService {
    /**
     * @param {EntityManager} entityManager The EntityManager which of this offlineService instance
     */
    constructor(entityManager) {
        this.entityManager = entityManager;
        this.entityManagerFactory = entityManager.entityManagerFactory;

        this.online = new Observable((observer) => {
            if(window) {
                window.addEventListener('load', () => {
                    window.addEventListener('offline', (e) => {
                        observer.next(false);
                    });
                    window.addEventListener('online', (e) => {
                        this.synchronizeData().then(() => {
                            observer.next(true);
                        });
                    });
                });
                observer.next(navigator.onLine);
            }
        });
    }

    /**
     * method to verify whether the app is online or offline
     */
    isOnline() {
        return navigator.onLine;
    }

    /**
     * method to save (insert/update) objects to the local database
     * @param {Object} entity
     * @param {String} entityClass
     * @param {Boolean} offlineSave
     */
    saveDataLocally(entity, entityClass, offlineSave) {
        let promise = new Promise((resolve, reject) => {
            let localDb = new IndexedDb({ namespace: this.getAppName() }, () => {
                localDb.addCollection(entityClass, () => {
                    entity._id = entity.id;
                    localDb[entityClass].upsert(entity, () => {
                        resolve();
                    }, (e) => {
                        reject();
                    });
                });
            });

        });

        return promise.then(() => {
            if(offlineSave) {
                return this.saveDataLocally(entity, savedObjectsCollection, false);
            }
        });
    };

    /**
     * method to delete objects of the local database
     * @param {Object} entity
     * @param {String} entityClass
     * @param {Boolean} offlineDelete
     */
    deleteLocalEntity(entity, entityClass, offlineDelete) {
        let promise = new Promise((resolve, reject) => {
            let localDb = new IndexedDb({ namespace: this.getAppName() }, () => {
                localDb.addCollection(entityClass, () => {
                    localDb[entityClass].remove(entity.id, (res) => {
                        resolve();
                    }, (e) => {
                        reject();
                    });
                });
            });
        });

        return promise.then(() => {
            if(offlineDelete) {
                if(entity.version) {
                    return this.saveDataLocally(entity, deletedObjectsCollection, false);
                } else {
                    return this.deleteLocalEntity(entity, savedObjectsCollection, false);
                }
            }
        });
    }

    /**
     * method to load objects from the local database
     * @param {Object} entity
     * @param {String} entityClass
     */
    loadLocalEntity(entity, entityClass) {
        let localLoadResult;
        let promise = new Promise((resolve, reject) => {
            let localDb = new IndexedDb({ namespace: this.getAppName() }, () => {
                localDb.addCollection(entityClass, () => {
                    localDb[entityClass].findOne({ _id: entity.id }, {}, (result) => {
                        localLoadResult = result;
                        resolve();
                    }, (e) => {
                        reject();
                    });
                });
            });
        });

        return promise.then(() => localLoadResult);
    }

    /**
     * method to query data of the local database
     * @param {String} query
     * @param {String} sort
     * @param {String} limit
     * @param {String} entityClass
     */
    queryLocalData(query, sort, limit, entityClass) {
        let localQueryResult;
        let promise = new Promise((resolve, reject) => {
             let localDb = new IndexedDb({ namespace: this.getAppName() }, () => {
                limit = limit < 0 ? 0 : limit;
                localDb.addCollection(entityClass, () => {
                    localDb[entityClass].find(JSON.parse(query), {sort: JSON.parse(sort)}, {limit: JSON.parse(limit)}).fetch((result) => {
                        localQueryResult = result;
                        resolve();
                    }, (e) => {
                        reject();
                    });
                });
            });
        });

        return promise.then(() => localQueryResult);
    };

    synchronizeData() {
        let savedDatePromise = this.synchronizeSavedDate();
        let deletedDataPromise = this.synchronizeDeletedDate();

        return Promise.all([savedDatePromise, deletedDataPromise]);
    }

    synchronizeSavedDate() {
        return new Promise((resolve, reject) => {
            let localDb = new IndexedDb({ namespace: this.getAppName() }, () => {
                localDb.addCollection(savedObjectsCollection, () => {
                    localDb[savedObjectsCollection].find({}).fetch((result) => {
                        if(result) {
                            let mapPromises = result.map((entity) => {
                                let bucket = this.getBucketOfEntity(entity);
                                let key = this.getKeyOfEntity(entity);
                                let msg;
                                delete entity._id;
                                if(entity.version) {
                                    msg = new message.ReplaceObject(bucket, key, entity)
                                        .ifMatch(entity.version);
                                } else {
                                    msg = new message.CreateObject(bucket, entity);
                                }

                                return this.entityManager.send(msg).then((response) => {
                                    return this.saveDataLocally(response.entity, bucket, false).then(() => {
                                        return this.deleteLocalEntity(entity, savedObjectsCollection, false);
                                    });
                                }, (e) => {
                                    return this.errorHandling(e, entity, 'save').then(() => {
                                        return this.deleteLocalEntity(entity, savedObjectsCollection, false);
                                    })
                                });
                            });

                            Promise.all(mapPromises).then(() => resolve());
                        } else {
                            resolve();
                        }
                    });
                });
            });
        });
    }

    synchronizeDeletedDate() {
        return new Promise((resolve, reject) => {
            let localDb = new IndexedDb({ namespace: appName },  () => {
                localDb.addCollection(deletedObjectsCollection, () => {
                    localDb[deletedObjectsCollection].find({}).fetch((result) => {
                        if (result) {
                            let mapPromises = result.map((entity) => {
                                let bucket = this.getBucketOfEntity(entity);
                                let key = this.getKeyOfEntity(entity);

                                return this.entityManager.send(new message.DeleteObject(bucket, key).ifMatch(entity.version)).then(() => {
                                    return this.deleteLocalEntity(entity, deletedObjectsCollection, false);
                                }, (e) => {
                                    return this.errorHandling(e, entity, 'delete').then(() => {
                                        return this.deleteLocalEntity(entity, deletedObjectsCollection, false);
                                    });
                                });
                            });

                            Promise.all(mapPromises).then(() => resolve());
                        } else {
                            resolve();
                        }
                    });
                });
            });
        });
    }

    /**
     * method to analyse and handle errors
     * @param {Error} error
     * @param {Object} entity
     * @param {String} operation
     */
    errorHandling(error, entity, operation) {
        let bucket = this.getBucketOfEntity(entity);
        let key = this.getKeyOfEntity(entity);

        return new Promise((resolve, reject) => {
            if(error.status === StatusCode.OBJECT_OUT_OF_DATE || error.status === StatusCode.CONFLICT) {
                this.entityManager.send(new message.GetObject(bucket, key)).then((response) => {
                    if(this.conflictResolution(entity, response.entity) === response.entity) {
                        this.saveDataLocally(response.entity, bucket, false).then(() => resolve());
                    } else {
                        if(operation === 'save') {
                            delete entity.version;
                            this.entityManager.send(message.ReplaceObject(bucket, key, entity)).then((response) => {
                                this.saveDataLocally(response.entity, bucket, false).then(() => resolve());
                            });
                        } else if(operation === 'delete') {
                            this.entityManager.send(new message.DeleteObject(bucket, key)).then(() => resolve());
                        }
                    }
                }, (e) => {
                    if (e.status === StatusCode.OBJECT_NOT_FOUND && operation === 'save') {
                        if(this.conflictResolution(entity, 'remoteObj') === entity) {
                            this.entityManager.send(new message.CreateObject(bucket, entity)).then(() => resolve());
                        } else {
                            this.deleteLocalEntity(entity, bucket, false).then(() => resolve());
                        }
                    } else if(e.status === StatusCode.OBJECT_NOT_FOUND && operation === 'delete') {
                        resolve();
                    } else {
                        reject();
                    }
                });
            } else {
                reject();
            }
        });
    }

    /**
     * method to verify which object wins when a conflict occurs
     * @param {Object} localObj
     * @param {Object} remoteObj
     */
    conflictResolution(localObj, remoteObj) {
        if(this.entityManagerFactory.conflictResolution) {
            if (typeof this.entityManagerFactory.conflictResolution === "function") {
                return this.entityManagerFactory.conflictResolution(localObj, remoteObj);
            } else if(this.entityManagerFactory.conflictResolution === 'remote') {
                return remoteObj;
            } else {
                return localObj;
            }
        } else {
            return localObj;
        }
    }

    /**
     * method to get the key of a specific entity
     * @param {Object} entity
     */
    getKeyOfEntity(entity) {
        return entity.id.substr(entity.id.lastIndexOf('/') + 1);
    }

    /**
     * method to get the bucket of a specific entity
     * @param {Object} entity
     */
    getBucketOfEntity(entity) {
        return entity.id.split('/')[2];
    }

    getAppName() {
        return this.entityManager._connector.origin;
    }
}

module.exports = OfflineService;