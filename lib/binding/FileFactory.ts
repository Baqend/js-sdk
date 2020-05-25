'use strict';

import { Factory, InstanceFactory } from "./Factory";
import { File } from "./File";
import { trailingSlashIt } from "./trailingSlashIt";
import * as message from "../message";
import { JsonMap, Permission } from "../util";
import { StatusCode } from "../connector/Message";
import { deprecated } from "../util/deprecated";
import { EntityManager } from "../EntityManager";
import { Json } from "../util";
import { Acl } from "../Acl";

export interface FileFactory extends Factory<File>, FileConstructor {}
export class FileFactory extends Factory<File> {

  /**
   * Creates a new FileFactory for the given type
   * @param db
   * @return A new file factory
   */
  static create(db: EntityManager): FileFactory {
    const factory = this.createFactory<FileFactory, File>(File);
    factory.db = db;
    return factory;
  }

  /**
   * The owning EntityManager where this factory belongs to
   */
  public db: EntityManager = null as any;

  /**
   * Creates a new file
   * @param {Array<*>=} args Constructor arguments used for instantiation, the constructor will not be called
   * when no arguments are passed
   * @return {File} A new created file
   */
  newInstance(args) {
    const instance = super.newInstance(args);
    instance.db = this.db;
    return instance;
  }

  /**
   * Deserialize the file metadata from a json object back to a new file instance
   * @param json The file metadata as json
   * @return {File} The deserialize File instance
   */
  fromJSON(json: JsonMap) {
    const file = this.newInstance([json.id]);
    file.fromJSON(json);
    return file;
  }

  /**
   * Updates the metadata of the root file directory formally the file "bucket"
   * @param {string} bucket The name of the root file directory
   * @param {Object<string, util.Permission>} metadata The new metadata for the bucket
   * @param {Permission=} metadata.load The load permission which grants read access to all stored
   * files under the specified bucket
   * @param {Permission=} metadata.insert The insert permission which is required to insert new
   * files into the bucket
   * @param {Permission=} metadata.update The update permission which is required to update existing
   * files within the bucket
   * @param {Permission=} metadata.delete The delete permission which is required to delete existing
   * files within the bucket
   * @param {Permission=} metadata.query The query permission which is required to list all files
   * within a bucket
   * @param {FileFactory~bucketMetadataCallback=} doneCallback Invoked if the operation succeeds
   * @param {File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<void>} A promise which will fulfilled with the updated metadata
   */
  saveMetadata(bucket, metadata, doneCallback, failCallback) {
    const msg = new message.SetFileBucketMetadata(bucket, metadata);
    return this.db.send(msg).then(doneCallback, failCallback);
  }

  /**
   * Gets the metadata of the root folder (formally the file "bucket")
   * @param {string} bucket The name of the root file directory
   * @param {Object=} options The load metadata options
   * @param {Object} [options.refresh=false] Force a revalidation while fetching the metadata
   * @param {FileFactory~bucketMetadataCallback=} doneCallback
   * The callback is invoked after the metadata is fetched
   * @param {File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<Object<string, util.Permission>>} A promise which will be fulfilled with the bucket acls
   */
  loadMetadata(bucket, options, doneCallback, failCallback) {
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
  }

  /**
   * Lists all the buckets.
   * @param {FileFactory~fileListCallback=} doneCallback The callback is invoked with the listed buckets
   * @param {File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<Array<File>>} The listed buckets.
   */
  listBuckets(doneCallback, failCallback) {
    return this.db.send(new message.ListBuckets()).then(response => (
      response.entity.map(bucket => this.new(bucket + '/'))
    )).then(doneCallback, failCallback);
  }

  /**
   * Lists the files (and folders) in the given folder.
   *
   * @param {File|string} folderOrPath The folder/path to list.
   * @param {File} start The file/folder from where to start listing (not included)
   * @param {number} count The maximum number of files to return.
   * @param {FileFactory~fileListCallback=} doneCallback The callback is invoked with the listed files
   * @param {File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<Array<File>>} The listed files/folders.
   */
  listFiles(folderOrPath, start, count, doneCallback, failCallback) {
    let folder;

    if (Object(folderOrPath) instanceof String) {
      const path = trailingSlashIt(folderOrPath);
      folder = this.new({ path });
    } else {
      folder = folderOrPath;
    }

    const path = folder.key;
    const bucket = folder.bucket;
    return this.db.send(new message.ListFiles(bucket, path, start ? start.key : null, count)).then(response => (
      response.entity.map(file => this.new(file))
    )).then(doneCallback, failCallback);
  }
}

interface FileConstructor {
  /**
   * Creates a new file object which represents the file at the given ID
   *
   * Data provided to the constructor will be uploaded by invoking {@link upload()}.
   *
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
   * @param {Date=} fileOptions.lastModified The optional last modified date
   * @param {Acl=} fileOptions.acl The file acl which will be set, if the file is uploaded afterwards
   * @param {Object<string,string>} [fileOptions.headers] The custom headers which will be send with the file after
   * uploading it
   * @return {File} A new file instance
   */
  new(fileOptions: string | { name?: string, parent?: string, type: string, mimeType: string, eTag: string, lastModified: Date, acl: Acl, headers: {[headerName: string]: string}, data: string|Blob|File|ArrayBuffer|Json }) : File
}

deprecated(FileFactory, '_db', 'db');

/**
 * The list files callback is called, with the bucket metadata
 * @callback FileFactory~bucketMetadataCallback
 * @param {Object<string, util.Permission>} bucketMetadata the bucket metadata
 * @return {*} A Promise, result or undefined
 */

/**
 * The list files callback is called, with the loaded files
 * @callback FileFactory~fileListCallback
 * @param {Array<File>} files The listed files
 * @return {*} A Promise, result or undefined
 */
