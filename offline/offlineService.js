'use strict';
const minimongo = require('minimongo');
const IndexedDb = minimongo.IndexedDb;
const db = null;

class OfflineService {
    constructor(dbName) {
        this.db = new IndexedDb({ namespace: dbName }, function () {});
    }

    // TODO add functionality to diagnose flaky internet connection
    isOnline() {
        return navigator.onLine;
    }

    saveDataLocally(data, className) {
        this.db.addCollection(className, function () {
            this.db[className].findOne({ id: data.id }, {}, function (result) {
                if (result) {
                    this.db[className].remove(result._id, function (res) {});
                }
                this.db[className].upsert(data, function () {});
            });
        });
    };

    deleteLocalEntry(objectId, className) {
        this.db.addCollection(className, function () {
            this.db[className].findOne({ id: objectId }, {}, function (result) {
                this.db[className].remove(result._id, function (res) {});
            });
        });
    }

    loadLocalEntry(objectId, className) {
        this.db.addCollection(className, function () {
            this.db[className].findOne({ id: objectId }, {}, function (result) {
                return result;
            });
        });
    }

    queryLocalData(query, sort, limit,className) {
        limit = limit < 0 ? 0 : limit;
        this.db.addCollection(className, function () {
            this.db[className].find(queryString, { limit: limit }, { sort: sortBy }).fetch(function (result) {
               return result;
            });
        });
    };
}
