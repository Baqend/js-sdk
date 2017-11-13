'use strict';

const Factory = require('./Factory');
const File = require('./File');
const message = require('../message');
const Permission = require('../util/Permission');
const StatusCode = require('../connector/Message').StatusCode;

/**
 * @class binding.FileFactory
 * @extends binding.Factory<binding.File>
 *
 * @param {Object=} properties initial properties to set on the file
 * @param {...*} arguments Additional constructor params passed through the type constructor
 * @return {binding.File} The new managed instance
 */
const FileFactory = Factory.extend(/** @lends binding.FileFactory.prototype */ {

  /**
   * Creates a new FileFactory for the given type
   * @param {EntityManager} db
   * @return {binding.FileFactory} A new file factory
   * @static
   */
  create(db) {
    // invoke super method
    const factory = Factory.create.call(this, File);
    factory.db = db;
    return factory;
  },

  /**
   * Creates a new file
   * @param {Array<*>=} args Constructor arguments used for instantiation, the constructor will not be called
   * when no arguments are passed
   * @return {binding.File} A new created file
   */
  newInstance(args) {
    const instance = Factory.newInstance.call(this, args);
    instance.db = this.db;
    return instance;
  },

  /**
   * Updates the metadata of the root file directory formally the file "bucket"
   * @param {string} bucket The name of the root file directory
   * @param {Object<string, util.Permission>} metadata The new metadata for the bucket
   * @param {util.Permission=} metadata.load The load permission which grants read access to all stored
   * files under the specified bucket
   * @param {util.Permission=} metadata.insert The insert permission which is required to insert new
   * files into the bucket
   * @param {util.Permission=} metadata.update The update permission which is required to update existing
   * files within the bucket
   * @param {util.Permission=} metadata.delete The delete permission which is required to delete existing
   * files within the bucket
   * @param {util.Permission=} metadata.query The query permission which is required to list all files
   * within a bucket
   * @param {binding.FileFactory~bucketMetadataCallback=} doneCallback Invoked if the operation succeeds
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<void>} A promise which will fulfilled with the updated metadata
   */
  saveMetadata(bucket, metadata, doneCallback, failCallback) {
    const msg = new message.SetFileBucketMetadata(bucket, metadata);
    return this.db.send(msg).then(doneCallback, failCallback);
  },

  /**
   * Gets the metadata of the root folder (formally the file "bucket")
   * @param {string} bucket The name of the root file directory
   * @param {Object=} options The load metadata options
   * @param {Object} [options.refresh=false] Force a revalidation while fetching the metadata
   * @param {binding.FileFactory~bucketMetadataCallback=} doneCallback
   * The callback is invoked after the metadata is fetched
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<Object<string, util.Permission>>} A promise which will be fulfilled with the bucket acls
   */
  loadMetadata(bucket, options, doneCallback, failCallback) {
    options = options || {};

    const msg = new message.GetFileBucketMetadata(bucket);
    // this._db.ensureCacheHeader(this.id, msg, options.refresh);
    // do not white list the file, because head-request does not revalidate the cache.
    return this.db.send(msg).then((response) => {
      const result = {};
      Permission.BASE_PERMISSIONS.forEach((key) => {
        result[key] = Permission.fromJSON(response.entity[key] || {});
      });
      return result;
    }, (e) => {
      if (e.status === StatusCode.OBJECT_NOT_FOUND) {
        return null;
      }

      throw e;
    }).then(doneCallback, failCallback);
  },

  /**
   * Lists all the buckets.
   * @param {binding.FileFactory~fileListCallback=} doneCallback The callback is invoked with the listed buckets
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<Array<binding.File>>} The listed buckets.
   */
  listBuckets(doneCallback, failCallback) {
    return this.db.send(new message.ListBuckets()).then(response => (
      response.entity.map(bucket => this.new(bucket + '/'))
    )).then(doneCallback, failCallback);
  },

  /**
   * Lists the files (and folders) in the given folder.
   *
   * @param {binding.File|string} folderOrPath The folder/path to list.
   * @param {binding.File} start The file/folder from where to start listing (not included)
   * @param {number} count The maximum number of files to return.
   * @param {binding.FileFactory~fileListCallback=} doneCallback The callback is invoked with the listed files
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<Array<binding.File>>} The listed files/folders.
   */
  listFiles(folderOrPath, start, count, doneCallback, failCallback) {
    let folder;

    if (Object(folderOrPath) instanceof String) {
      let path = folderOrPath;
      if (path.charAt(path.length - 1) !== '/') {
        path += '/';
      }
      folder = this.new({ path });
    } else {
      folder = folderOrPath;
    }

    const path = folder.key;
    const bucket = folder.bucket;
    return this.db.send(new message.ListFiles(bucket, path, start ? start.key : null, count)).then(response => (
      response.entity.map(file => this.new(file))
    )).then(doneCallback, failCallback);
  },

  /**
   * Creates a new file object which represents the a file at the given id. Data are provided to the constructor will
   * be uploaded by invoking {@link upload()}
   * @param {object|string} fileOptions The fileOptions used to create a new file object, or just the id of the
   * file object
   * @param {string=} fileOptions.name The filename without the id. If omitted and data is provided as a file object,
   * the {@link File#name} will be used otherwise a uuid will be generated.
   * @param {string} [fileOptions.parent="/www"] The parent folder which contains the file
   * @param {string|Blob|File|ArrayBuffer|json=} fileOptions.data The initial file content, which will be uploaded by
   * invoking {@link #upload} later on.
   * @param {string=} fileOptions.type A optional type hint used to correctly interpret the provided data
   * @param {string=} fileOptions.mimeType The mimType of the file. Defaults to the mimeType of the provided data if
   * it is a file object, blob or data-url
   * @param {string=} fileOptions.eTag The optional current ETag of the file
   * @param {string=} fileOptions.lastModified The optional last modified date
   * @param {Acl=} fileOptions.acl The file acl which will be set, if the file is uploaded afterwards
   * @return {binding.File} A new file instance
   *
   * @function
   * @name new
   * @memberOf binding.FileFactory.prototype
   */
});

/**
 * The list files callback is called, with the bucket metadata
 * @callback binding.FileFactory~bucketMetadataCallback
 * @param {Object<string, util.Permission>} bucketMetadata the bucket metadata
 * @return {*} A Promise, result or undefined
 */

/**
 * The list files callback is called, with the loaded files
 * @callback binding.FileFactory~fileListCallback
 * @param {Array<binding.File>} files The listed files
 * @return {*} A Promise, result or undefined
 */

module.exports = FileFactory;
