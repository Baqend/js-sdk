"use strict";

var Factory = require('./Factory');
var File = require('./File');
var message = require('../message');

/**
 * @class baqend.binding.FileFactory
 * @extends baqend.binding.Factory<baqend.binding.File>
 *
 * @param {Object=} properties initial properties to set on the file
 * @param {...*} arguments Additional constructor params passed through the type constructor
 * @return {baqend.binding.File} The new managed instance
 */
var FileFactory = Factory.extend( /** @lends baqend.binding.FileFactory.prototype */ {

  /**
   * Creates a new FileFactory for the given type
   * @param {baqend.EntityManager} db
   * @return {baqend.binding.FileFactory} A new file factory
   * @static
   */
  create(db) {
    //invoke super method
    let factory = Factory.create.call(this, File);
    factory._db = db;
    return factory;
  },

  /**
   * Creates a new file
   * @param {Array<*>=} args Constructor arguments used for instantiation, the constructor will not be called
   * when no arguments are passed
   * @return {baqend.binding.File} A new created file
   */
  newInstance(args) {
    let instance = Factory.newInstance.call(this, args);
    instance._db = this._db;
    return instance;
  },

  /**
   * Updates the metadata of the root file directory formally the file "bucket"
   * @param {string} bucket The name of the root file directory
   * @param {Object} metadata The new metadata for the bucket
   * @param {baqend.util.permission} metadata.loadPermission The load permission which grants read access to all stored
   * files under the specified bucket
   * @param {baqend.util.permission} metadata.insertPermission The insert permission which is required to insert new
   * files into the bucket
   * @param {baqend.util.permission} metadata.updatePermission The update permission which is required to update existing
   * files within the bucket
   * @param {baqend.util.permission} metadata.deletePermission The delete permission which is required to delete existing
   * files within the bucket
   * @param {baqend.util.permission} metadata.queryPermission The query permission which is required to list all files
   * within a bucket
   * @return {Promise<Object>} A promise which will fulfilled with the updated metadata
   */
  saveMetadata(bucket, metadata, doneCallback, failCallback) {
    return this._db.send(new message.SetFileBucketMetadata(bucket, metadata)).then((response) => {
      return response.entity;
    }).then(doneCallback, failCallback);
  }
});

module.exports = FileFactory;