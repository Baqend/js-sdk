"use strict";

const error = require('../error');
const Acl = require('../Acl');
const uuid = require('../util/uuid').uuid;
const message = require('../message');
const StatusCode = require('../connector/Message').StatusCode;

const PREFIX = '/file';
const LEN = PREFIX.length;

/**
 * Creates a file object, which represents one specific file reference.
 * This File object can afterwards be used to up- and download the file contents or to retrieves and change the files
 * metadata.
 *
 * The file data can be uploaded and downloaded as:
 *
 *  <table class="table">
 *   <tr>
 *     <th>type</th>
 *     <th>JavaScript type</th>
 *     <th>Description</th>
 *   </tr>
 *   <tr>
 *     <td>'arraybuffer'</td>
 *     <td>ArrayBuffer</td>
 *     <td>The content is represented as a fixed-length raw binary data buffer</td>
 *   </tr>
 *   <tr>
 *     <td>'blob'</th>
 *     <td>Blob</td>
 *     <td>The content is represented as a simple blob</td>
 *   </tr>
 *   <tr>
 *     <td>'json'</td>
 *     <td>object|array|string</td>
 *     <td>The file content is represented as json</td>
 *   </tr>
 *   <tr>
 *     <td>'text'</td>
 *     <td>string</td>
 *     <td>The file content is represented through the string</td>
 *   </tr>
 *   <tr>
 *     <td>'base64'</td>
 *     <td>string</td>
 *     <td>The file content as base64 encoded string</td>
 *   </tr>
 *   <tr>
 *     <td>'data-url'</td>
 *     <td>string</td>
 *     <td>A data url which represents the file content</td>
 *   </tr>
 * </table>
 *
 *
 * @alias binding.File
 */
class File {

  /**
   * The complete id of the file, including folder and name
   * @type string
   * @readonly
   */
  get id() {
    return this._id;
  }

  /**
   * The fully url to the file, can be directly used to link the file, i.e. in link tags ot image sources
   * @type string
   * @readonly
   */
  get url() {
    if (this.isFolder) {
      throw new Error("Url can not be created for folders.");
    }
    if (!this._url) {
      this._url = this._db.createURL(this.id, this.bucket != 'www');
    }
    return this._url;
  }

  /**
   * The name of the file
   * @type string
   * @readonly
   */
  get name() {
    if (!this._name)
      this._name = this._id.substring(this._id.lastIndexOf('/', this._id.length - 2) + 1);
    return this._name;
  }

  /**
   * The mimeType of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
   * @type string
   * @readonly
   */
  get mimeType() {
    if (this.isFolder) {
      throw new Error("A folder has no mimeType");
    }
    this._checkAvailable();
    return this._mimeType;
  }

  /**
   * The current file acl, only accessible after fetching the metadata or downloading/uploading/providing the file
   * @type Acl
   * @readonly
   */
  get acl() {
    this._checkAvailable();
    return this._acl;
  }

  /**
   * The last modified date of the file, only accessible after fetching the metadata or downloading/uploading/providing the eTag
   * @type ?Date
   * @readonly
   */
  get lastModified() {
    if (this.isFolder) {
      throw new Error("A folder has no lastModified");
    }
    this._checkAvailable();
    return this._lastModified;
  }

  /**
   * The creation date of the file, only accessible after fetching the metadata or downloading/uploading/providing the eTag
   * @type ?Date
   * @readonly
   */
  get createdAt() {
    if (this.isFolder) {
      throw new Error("A folder has no creation date");
    }
    this._checkAvailable();
    return this._createdAt;
  }

  /**
   * The eTag of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
   * @type string
   * @readonly
   */
  get eTag() {
    if (this.isFolder) {
      throw new Error("A folder has no eTag");
    }
    this._checkAvailable();
    return this._eTag;
  }

  /**
   * The custom headers of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
   * @type Object<string,string>
   * @readonly
   */
  get headers() {
    if (this.isFolder) {
      throw new Error("A folder has no custom headers");
    }
    this._checkAvailable();
    return this._headers;
  }

  /**
   * The size of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
   * @type number
   * @readonly
   */
  get size() {
    if (this.isFolder) {
      throw new Error("A folder has no size");
    }
    this._checkAvailable();
    return this._size;
  }

  /**
   * @type string
   * @readonly
   */
  get bucket() {
    return this.id.substring(LEN + 1, this.id.indexOf('/', LEN + 1));
  }

  /**
   * @type string
   * @readonly
   */
  get key() {
    return this.id.substring(this.id.indexOf('/', LEN + 1) + 1);
  }

  /**
   * The full path of the file.
   * @type string
   * @readonly
   */
  get path() {
    return this.id.substring(LEN);
  }

  /**
   * The parent folder of the file.
   * @type string
   * @readonly
   */
  get parent() {
    return this.id.substring(LEN, this.id.lastIndexOf('/', this.id.length - 2));
  }

  /**
   * Indicates if the metadata are loaded.
   * @type boolean
   * @readonly
   */
  get isMetadataLoaded() {
    return this._available;
  }

  /**
   * Creates a new file object which represents a file at the given ID. Data which is provided to the constructor will
   * be uploaded by invoking {@link upload()}
   * @param {object|string} fileOptions The fileOptions used to create a new file object, or just the ID of the file
   * @param {string=} fileOptions.id The id of the file.
   * @param {string=} fileOptions.name The filename without the ID. If omitted and data is provided as a file object, the
   * {@link File#name} will be used otherwise a UUID will be generated.
   * @param {string} [fileOptions.parent="/www"] The parent folder which contains the file
   * @param {string} [fileOptions.path="/www"] The full path of the file. You might either specifiy the path of the file or a combination of parent and file name.
   * @param {string|Blob|File|ArrayBuffer|json=} fileOptions.data The initial file content, which will be uploaded by
   * invoking {@link #upload} later on.
   * @param {string=} fileOptions.type A optional type hint used to correctly interpret the provided data
   * @param {string=} fileOptions.mimeType The mimType of the file. Defaults to the mimeType of the provided data if
   * it is a file object, blob or data-url
   * @param {number=} fileOptions.size The size of the file content in bytes
   * @param {string=} fileOptions.eTag The optional current ETag of the file
   * @param {string|Date=} fileOptions.lastModified The optional last modified date
   * @param {Acl=} fileOptions.acl The file acl which will be set, if the file is uploaded afterwards
   * @param {Object<string,string>} [fileOptions.headers] The custom headers which will be send with the file after uploading it
   */
  constructor(fileOptions) {
    fileOptions = fileOptions || {};

    this._available = false;

    // Is fileOptions just an ID?
    if (Object(fileOptions) instanceof String) {
      fileOptions = { id: fileOptions };
    }

    if (fileOptions.id) {
      // Check validity of ID
      const nameSeparator = fileOptions.id.indexOf('/', '/file/'.length);
      if (nameSeparator == -1 || fileOptions.id.indexOf('/file/') != 0) {
        throw new Error('Invalid file reference ' + fileOptions.id);
      }

      this._id = fileOptions.id;
    } else {
      this._id = this.createIdFromOptions(fileOptions);
    }

    // Assign metadata
    this._setMetadata(fileOptions);

    /**
     * Specifies whether this file is a folder.
     * @type boolean
     * @readonly
     */
    this.isFolder = this._id.charAt(this._id.length - 1) == '/';
  }

  /**
   * Uploads the file content which was provided in the constructor or by uploadOptions.data
   * @param {object=} uploadOptions The upload options
   * @param {string|Blob|File|ArrayBuffer|json=} uploadOptions.data The initial file content, which will be uploaded by
   * invoking {@link #upload} later on.
   * @param {string=} uploadOptions.type A optional type hint used to correctly interpret the provided data
   * @param {string=} uploadOptions.mimeType The mimType of the file. Defaults to the mimeType of the provided data if
   * it is a file object, blob or data-url
   * @param {string=} uploadOptions.eTag The optional current ETag of the file
   * @param {string=} uploadOptions.lastModified The optional last modified date
   * @param {Acl=} uploadOptions.acl The file acl which will be set, if the file is uploaded afterwards
   * @param {Object<string,string>} [uploadOptions.headers] The custom headers which will be send with the file after uploading it
   * @param {boolean} [uploadOptions.force=false] force the upload and overwrite any existing files without validating it
   * @param {connector.Message~progressCallback} [uploadOptions.progress] listen to progress changes during upload
   * @param {binding.File~fileCallback=} doneCallback The callback is invoked after the upload succeed successfully
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error is occurred
   * @return {Promise<binding.File>} A promise which will be fulfilled with this file object where the metadata is updated
   */
  upload(uploadOptions, doneCallback, failCallback) {
    uploadOptions = uploadOptions || {};

    if (this.isFolder) {
      throw new Error("A folder cannot be uploaded");
    }

    this._setMetadata(uploadOptions);

    const uploadMessage = new message.UploadFile(this.bucket, this.key)
        .entity(this._data, this._type)
        .acl(this._acl);

    uploadMessage.progress(uploadOptions.progress);

    if (this._size) {
      uploadMessage.contentLength(this._size);
    }

    if (this._mimeType) {
      uploadMessage.mimeType(this._mimeType);
    }

    if (this._headers) {
      uploadMessage.customHeaders(this._headers);
    }

    this._conditional(uploadMessage, uploadOptions);

    this._db.addToBlackList(this.id);
    return this._db.send(uploadMessage).then((response) => {
      this._data = null;
      this._type = null;

      this.fromJSON(response.entity);
      return this;
    }).then(doneCallback, failCallback);
  }

  /**
   * Download a file and providing it in the requested type
   * @param {object=} downloadOptions The download options
   * @param {string} [downloadOptions.type="blob"] The type used to provide the file
   * @param {string} [downloadOptions.refresh=false] Indicates to make a revalidation request and not use the cache
   * @param {binding.File~downloadCallback=} doneCallback The callback is invoked after the download succeed successfully
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error is occurred
   * @return {Promise<string|Blob|File|ArrayBuffer|json>} A promise which will be fulfilled with the downloaded file content
   */
  download(downloadOptions, doneCallback, failCallback) {
    downloadOptions = downloadOptions || {};

    if (this.isFolder) {
      throw new Error("A folder cannot be downloaded");
    }

    const type = downloadOptions.type || 'blob';

    const downloadMessage = new message.DownloadFile(this.bucket, this.key)
        .responseType(type);

    this._db.ensureCacheHeader(this.id, downloadMessage, downloadOptions.refresh);

    return this._db.send(downloadMessage).then((response) => {
      this._db.addToWhiteList(this.id);
      this._fromHeaders(response.headers);
      return response.entity;
    }, (e) => {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) {
        return null;
      } else {
        throw e;
      }
    }).then(doneCallback, failCallback);
  }

  /**
   * Deletes a file
   * @param {object=} deleteOptions The delete options
   * @param {boolean} [deleteOptions.force=false] force the deletion without verifying any version
   * @param {binding.File~deleteCallback=} doneCallback The callback is invoked after the deletion succeed successfully
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error is occurred
   * @return {Promise<binding.File|binding.File[]>} A promise which will be fulfilled with this file object,
   * or with a list of all deleted files, if this file is an folder
   */
  delete(deleteOptions, doneCallback, failCallback) {
    deleteOptions = deleteOptions || {};

    const deleteMessage = new message.DeleteFile(this.bucket, this.key);
    this._conditional(deleteMessage, deleteOptions);

    if (!this.isFolder)
      this._db.addToBlackList(this.id);

    return this._db.send(deleteMessage).then((response) => {
      if (!this.isFolder)
        return this;

      return response.entity.map(fileId => this._db.File(fileId));
    }).then(doneCallback, failCallback);
  }

  /**
   * Creates the file ID from given options.
   * @param {*} fileOptions
   * @return {string}
   * @private
   */
  createIdFromOptions(fileOptions) {
    /** @var {string} */
    let path;
    if (fileOptions.path) {
      path = fileOptions.path;
    } else {
      let parent = fileOptions.parent || '/www';
      if (parent.charAt(parent.length - 1) != '/') {
        parent = parent + '/';
      }

      if (parent.length < 3) {
        throw new Error('Invalid parent name: ' + parent);
      }

      const name = fileOptions.name || (fileOptions.data && fileOptions.data.name) || uuid();
      path = parent + name;
    }

    // Add leading slash if missing
    if (path.charAt(0) != '/') {
      path = '/' + path;
    }

    // Check path validity
    if (path.indexOf('//') != -1 || path.length < 3) {
      throw new Error('Invalid path: ' + path);
    }

    return PREFIX + path;
  }

  _conditional(message, options) {
    if (!options.force) {
      if (this._lastModified)
        message.ifUnmodifiedSince(this._lastModified);
      if (this._eTag)
        message.ifMatch(this._eTag);
      if (!this._lastModified && !this._eTag)
        message.ifNoneMatch('*');
    }
  }

  /**
   * Gets the file metadata of a file
   * @param {Object=} options The load metadata options
   * @param {Object} [options.refresh=false] Force a revalidation while fetching the metadata
   * @param {binding.File~fileCallback=} doneCallback The callback is invoked after the metadata is fetched
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<binding.File>} A promise which will be fulfilled with this file
   */
  loadMetadata(options, doneCallback, failCallback) {
    options = options || {};
    //TODO: make options really optional
    if (this.isFolder) {
      throw new Error("A folder has no matadata");
    }

    let msg = new message.GetFileMetadata(this.bucket, this.key);
    this._db.ensureCacheHeader(this.id, msg, options.refresh);
    return this._db.send(msg).then((response) => {
      // do not white list the file, because head-request does not revalidate the cache.
      this._fromHeaders(response.headers);
      return this;
    }, (e) => {
      if (e.status == StatusCode.OBJECT_NOT_FOUND) {
        return null;
      } else {
        throw e;
      }
    }).then(doneCallback, failCallback);
  }

  /**
   * Updates the matadata of this file.
   * @param {Object=} options The save metadata options
   * @param {boolean} [options.force=false] force the update and overwrite the existing metadata without validating it
   * @param {binding.File~fileCallback=} doneCallback The callback is invoked after the metadata is saved
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error has occurred
   * @return {Promise<binding.File>} A promise which will be fulfilled with this file
   */
  saveMetadata(options, doneCallback, failCallback) {
    options = options || {};

    let metadata = this.toJSON();

    let msg = new message.UpdateFileMetadata(this.bucket, this.key)
        .entity(metadata);

    this._conditional(msg, options);

    return this._db.send(msg).then((response) => {
      this.fromJSON(response.entity);
      return this;
    }).then(doneCallback, failCallback);
  }

  /**
   * Validates and sets the file metadata based on the given options
   * @param {Object} options
   * @private
   */
  _setMetadata(options) {
    let data = options.data;
    let type = options.type;
    let eTag = options.eTag;
    let acl = options.acl;
    let size = options.size;
    let mimeType = options.mimeType;
    let lastModified = options.lastModified;
    let createdAt = options.createdAt;
    let headers = options.headers;

    if (!data) {
      this._available = false;
    } else {
      if (typeof Blob !== "undefined" && data instanceof Blob) {
        mimeType = mimeType || data.type;
      } else if (type == 'data-url') {
        let match = data.match(/^data:(.+?)(;base64)?,.*$/);
        mimeType = mimeType || match[1];
      }

      this._data = data;
      this._type = type;
      this._size = size;

      this._mimeType = mimeType;
      this._acl = acl || this._acl || new Acl();
      this._available = true;
    }

    this._eTag = eTag || this._eTag;

    if (lastModified) {
      this._lastModified = new Date(lastModified);
    }

    if (createdAt) {
      this._createdAt = new Date(createdAt);
    }

    this._headers = Object.assign(Object.create(null), this._headers, headers);
  }

  _fromHeaders(headers) {
    this.fromJSON({
      eTag: headers.etag ? headers.etag.substring(1, headers.etag.length - 1) : null,
      lastModified: headers['last-modified'],
      createdAt: headers['baqend-created-at'],
      mimeType: headers['content-type'],
      acl: headers['baqend-acl'] && JSON.parse(headers['baqend-acl']),
      contentLength: +headers['baqend-size'],
      headers: headers['baqend-custom-headers'] && JSON.parse(headers['baqend-custom-headers'])
    });
  }

  /**
   * Deserialize the given json file metadata back to this file instance
   * If the json object contains an id, it must match with this file id, otherwise an exception is thrown
   * @param {json} json The json to deserialize
   * @return {void}
   */
  fromJSON(json) {
    if (json.id && this.id !== json.id) {
      throw new Error('This file id ' + this.id + ' does not match the given json id ' + json.id);
    }

    if (json.mimeType)
      this._mimeType = json.mimeType;

    if (json.lastModified)
      this._lastModified = new Date(json.lastModified);

    if (json.createdAt)
      this._createdAt = new Date(json.createdAt);

    if (json.eTag)
      this._eTag = json.eTag;

    this._acl = this._acl || new Acl();
    if (json.acl)
      this._acl.fromJSON(json.acl);

    if (json.contentLength)
      this._size = json.contentLength;

    if (json.headers)
      this._headers = json.headers;

    this._available = true;
  }

  /**
   * Serialize the file metadata of this object to json
   * @return {json} The serialized file metadata as json
   */
  toJSON() {
    const result = {
      id: this._id,
      mimeType: this._mimeType,
      eTag: this._eTag,
      acl: this._acl.toJSON(),
      contentLength: this._size
    };

    if (this._lastModified) {
      result.lastModified = this._lastModified.toISOString();
    }

    if (this._createdAt) {
      result.createdAt = this._createdAt.toISOString();
    }

    if (this._headers && Object.keys(this._headers).length) {
      result.headers = this._headers
    }

    return result;
  }

  _checkAvailable() {
    if (!this._available) {
      throw new error.PersistentError('The file metadata of ' + this.id + ' is not available.');
    }
  }

  /**
   * The database connection to use
   * @member {EntityManager} _db
   * @private
   */
}

/**
 * The file callback is called, when the asynchronous operation completes successfully
 * @callback binding.File~fileCallback
 * @param {binding.File} file The updated file metadata
 * @return {any} A Promise, result or undefined
 */

/**
 * The download callback is called, when the asynchronous download completes successfully
 * @callback binding.File~downloadCallback
 * @param {string|Blob|File|ArrayBuffer|json} data The download file content in the requested format
 * @return {any} A Promise, result or undefined
 */

/**
 * The delete callback is called, when the asynchronous deletion completes successfully
 * @callback binding.File~deleteCallback
 * @param {binding.File} data The file metadata
 * @return {any} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback binding.File~failCallback
 * @param {error.PersistentError} error The error which reject the operation
 * @return {any} A Promise, result or undefined
 */

module.exports = File;
