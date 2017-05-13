'use strict';
const Observable = require('../lib/observable');
const message = require('../lib/message');
const Message = require('../lib/connector/Message');
const StatusCode = Message.StatusCode;

const minimongo = require('minimongo');
const IndexedDb = minimongo.IndexedDb;
const localDb = new IndexedDb({ namespace: 'baqend' }, function () {});

let savedObjectsCollection = 'savedObjects';
let deletedObjectsCollection = 'deletedObjects';

class OfflineService {
    constructor(entityManagerFactory, entityManager) {
        this.entityManagerFactory = entityManagerFactory;
        this.entityManager = entityManager;

        this.online = new Observable((observer) => {
            if(window) {
                window.addEventListener('offline', (e) => {
                    observer.next(false);
                });
                window.addEventListener('online', (e) => {
                    this.synchronizeData();
                    observer.next(true);
                });
            }
        });

        this.synchronizeData();
    }

    isOnline() {
        return true;
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
            if(offlineDelete && entity.version)
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

    synchronizeData() {
        let savedDatePromise = this.synchronizeSavedDate();
        let deletedDataPromise = this.synchronizeDeletedDate();

        return Promise.all([savedDatePromise, deletedDataPromise]);
    }

    synchronizeSavedDate() {
        return new Promise((resolve, reject) => {
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
                                    return this.deleteLocalEntry(entity, deletedObjectsCollection, false);
                                });
                            }, (e) => {
                                return this.errorHandling(e, entity, 'save').then(() => {
                                    return this.deleteLocalEntry(entity, savedObjectsCollection, false);
                                })
                            });
                        });

                        Promise.all(mapPromises).then(() => resolve());
                    } else {
                        resolve();
                    }
                });
            })
        });
    }

    synchronizeDeletedDate() {
        return new Promise((resolve, reject) => {
            localDb.addCollection(deletedObjectsCollection, () => {
                localDb[deletedObjectsCollection].find({}).fetch((result) => {
                    if(result) {
                        let mapPromises = result.map((entity) => {
                            let bucket = this.getBucketOfEntity(entity);
                            let key = this.getKeyOfEntity(entity);

                            return this.entityManager.send(new message.DeleteObject(bucket, key).ifMatch(entity.version)).then(() => {
                                return this.deleteLocalEntry(entity, deletedObjectsCollection, false);
                            }, (e) => {
                                return this.errorHandling(e, entity, 'delete').then(() => {
                                    return this.deleteLocalEntry(entity, deletedObjectsCollection, false);
                                })
                            });
                        });

                        Promise.all(mapPromises).then(() => resolve());
                    } else {
                        resolve();
                    }
                });
            })
        });
    }

    errorHandling(error, entity, operation) {
        let bucket = this.getBucketOfEntity(entity);
        let key = this.getKeyOfEntity(entity);

        if(error.status === StatusCode.OBJECT_OUT_OF_DATE){
            return this.entityManager.send(new message.GetObject(bucket, key)).then((response) => {
                if(this.conflictResolution(entity, response.entity) === response.entity) {
                    return this.saveDataLocally(response.entity, bucket, false).then(() => {});
                } else {
                    if(operation === 'save') {
                        delete entity.version;
                        return new this.entityManager.send(message.ReplaceObject(bucket, key, entity)).then((response) => {
                            return this.saveDataLocally(response.entity, bucket, false).then(() => {});
                        });
                    } else if(operation === 'delete') {
                        return this.entityManager.send(new message.DeleteObject(bucket, key)).then(() => {});
                    }
                }
            }, (e) => {
                if (e.status === StatusCode.OBJECT_NOT_FOUND && operation === 'save') {
                    if(this.conflictResolution(entity, 'remoteObj') === entity) {
                        return this.entityManager.send(new message.CreateObject(bucket, entity)).then(() => {});
                    } else {
                        return this.deleteLocalEntry(entity, bucket, false).then(() => {});
                    }
                }
            });
        }
    }

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

    getKeyOfEntity(entity) {
        return entity.id.substr(entity.id.lastIndexOf('/') + 1);
    }

    getBucketOfEntity(entity) {
        return entity.id.split('/')[2];
    }
}

module.exports = OfflineService;
