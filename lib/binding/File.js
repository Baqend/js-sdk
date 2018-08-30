'use strict';

const error = require('../error');
const Acl = require('../Acl');
const uuid = require('../util/uuid').uuid;
const message = require('../message');
const StatusCode = require('../connector/Message').StatusCode;
const deprecated = require('../util/deprecated');
const trailingSlashIt = require('./trailingSlashIt').trailingSlashIt;

const FILE_BUCKET = '/file';
const FILE_BUCKET_LENGTH = FILE_BUCKET.length;

const ID = Symbol('Id');
const METADATA = Symbol('Metadata');
const DATA = Symbol('Data');

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
   * @type {string}
   * @readonly
   */
  get id() {
    return this[ID];
  }

  /**
   * The fully url to the file, can be directly used to link the file, i.e. in link tags ot image sources
   * @type {string}
   * @readonly
   */
  get url() {
    if (this.isFolder) {
      throw new Error('Url can not be created for folders.');
    }

    return this.db.createURL(this.id, this.bucket !== 'www');
  }

  /**
   * The name of the file
   * @type {string}
   * @readonly
   */
  get name() {
    return this.id.substring(this.id.lastIndexOf('/', this.id.length - 2) + 1);
  }

  /**
   * The mimeType of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
   * @type {string}
   * @readonly
   */
  get mimeType() {
    if (this.isFolder) {
      throw new Error('A folder has no mimeType');
    }
    this.checkAvailable();
    return this[METADATA].mimeType;
  }

  /**
   * The current file acl, only accessible after fetching the metadata or downloading/uploading/providing the file
   * @type {Acl}
   * @readonly
   */
  get acl() {
    this.checkAvailable();
    return this[METADATA].acl;
  }

  /**
   * The last modified date of the file, only accessible after fetching the metadata
   * or downloading/uploading/providing the eTag
   * @type {?Date}
   * @readonly
   */
  get lastModified() {
    if (this.isFolder) {
      throw new Error('A folder has no lastModified');
    }
    this.checkAvailable();
    return this[METADATA].lastModified;
  }

  /**
   * The creation date of the file, only accessible after fetching the metadata
   * or downloading/uploading/providing the eTag
   * @type {?Date}
   * @readonly
   */
  get createdAt() {
    if (this.isFolder) {
      throw new Error('A folder has no creation date');
    }
    this.checkAvailable();
    return this[METADATA].createdAt;
  }

  /**
   * The eTag of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
   * @type {string}
   * @readonly
   */
  get eTag() {
    if (this.isFolder) {
      throw new Error('A folder has no eTag');
    }
    this.checkAvailable();
    return this[METADATA].eTag;
  }

  /**
   * The custom headers of the file, only accessible after fetching the metadata or downloading/uploading/providing
   * the file
   * @type {Object<string,string>}
   * @readonly
   */
  get headers() {
    if (this.isFolder) {
      throw new Error('A folder has no custom headers');
    }

    this.checkAvailable();
    return this[METADATA].headers;
  }

  /**
   * The size of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
   * @type {number}
   * @readonly
   */
  get size() {
    if (this.isFolder) {
      throw new Error('A folder has no size');
    }
    this.checkAvailable();
    return this[METADATA].size;
  }

  /**
   * @type {string}
   * @readonly
   */
  get bucket() {
    return this.id.substring(FILE_BUCKET_LENGTH + 1, this.id.indexOf('/', FILE_BUCKET_LENGTH + 1));
  }

  /**
   * @type {string}
   * @readonly
   */
  get key() {
    return this.id.substring(this.id.indexOf('/', FILE_BUCKET_LENGTH + 1) + 1);
  }

  /**
   * The full path of the file.
   * @type {string}
   * @readonly
   */
  get path() {
    return this.id.substring(FILE_BUCKET_LENGTH);
  }

  /**
   * The parent folder of the file.
   * @type {string}
   * @readonly
   */
  get parent() {
    return this.id.substring(FILE_BUCKET_LENGTH, this.id.lastIndexOf('/', this.id.length - 2));
  }

  /**
   * Indicates if the metadata are loaded.
   * @type {boolean}
   * @readonly
   */
  get isMetadataLoaded() {
    return !!this[METADATA];
  }

  /**
   * Creates a new file object which represents a file at the given id. Data which is provided to the constructor will
   * be uploaded by invoking {@link upload()}
   * @param {object|string} fileOptions The fileOptions used to create a new file object, or just the id of the file
   * @param {string=} fileOptions.id The id of the file.
   * @param {string=} fileOptions.name The filename without the id. If omitted and data is provided as a file object,
   * the {@link File#name} will be used otherwise a UUID will be generated.
   * @param {string} [fileOptions.parent="/www"] The parent folder which contains the file
   * @param {string} [fileOptions.path="/www"] The full path of the file.
   * You might either specify the path of the file or a combination of parent and file name.
   * @param {string|Blob|File|ArrayBuffer|json=} fileOptions.data The initial file content, which will be uploaded by
   * invoking {@link #upload} later on.
   * @param {string=} fileOptions.type A optional type hint used to correctly interpret the provided data
   * @param {string=} fileOptions.mimeType The mimType of the file. Defaults to the mimeType of the provided data if
   * it is a file object, blob or data-url
   * @param {number=} fileOptions.size The size of the file content in bytes
   * @param {string=} fileOptions.eTag The optional current ETag of the file
   * @param {string|Date=} fileOptions.lastModified The optional last modified date
   * @param {Acl=} fileOptions.acl The file acl which will be set, if the file is uploaded afterwards
   * @param {Object<string,string>} [fileOptions.headers] The custom headers which will be send with the file after
   * uploading it
   */
  constructor(fileOptions) {
    // Is fileOptions just an id?
    const opt = typeof fileOptions === 'string' ? { id: fileOptions } : (fileOptions || {});

    if (opt.id) {
      // Check validity of id
      const nameSeparator = opt.id.indexOf('/', '/file/'.length);
      if (nameSeparator === -1 || opt.id.indexOf('/file/') !== 0) {
        throw new Error('Invalid file reference ' + opt.id);
      }

      this[ID] = opt.id;
    } else {
      this[ID] = this.createIdFromOptions(opt);
    }

    // Assign metadata
    this.setDataOptions(opt);

    /**
     * Specifies whether this file is a folder.
     * @type {boolean}
     * @readonly
     */
    this.isFolder = this.id.charAt(this.id.length - 1) === '/';
  }

  /**
   * Parses an E-Tag header
   * @param {string=} eTag The E-Tag to parse or something falsy
   * @return {?string} Returns the parsed E-Tag or null, if it could not be parsed
   */
  static parseETag(eTag) {
    if (!eTag) {
      return null;
    }

    const match = eTag.match(/^(?:[wW]\/)?["'](.*)["']$/)
    if (!match) {
      return null;
    }

    return match[1];
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
   * @param {Object<string,string>} [uploadOptions.headers] The custom headers which will be send with the file after
   * uploading it
   * @param {boolean} [uploadOptions.force=false] force the upload and overwrite any existing files without validating
   * it
   * @param {connector.Message~progressCallback} [uploadOptions.progress] listen to progress changes during upload
   * @param {binding.File~fileCallback=} doneCallback The callback is invoked after the upload succeed successfully
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error is occurred
   * @return {Promise<binding.File>} A promise which will be fulfilled with this file object
   * where the metadata is updated
   */
  upload(uploadOptions, doneCallback, failCallback) {
    const opt = uploadOptions || {};

    if (this.isFolder) {
      throw new Error('A folder cannot be uploaded');
    }

    this.setDataOptions(opt);

    const uploadMessage = new message.UploadFile(this.bucket, this.key)
      .entity(this[DATA].data, this[DATA].type);

    const meta = this[METADATA];
    if (meta) {
      uploadMessage.acl(meta.acl);
      uploadMessage.contentLength(meta.size);
      uploadMessage.mimeType(meta.mimeType);
      uploadMessage.customHeaders(meta.headers);
    }

    uploadMessage.progress(opt.progress);

    this.conditional(uploadMessage, opt);

    this.db.addToBlackList(this.id);
    return this.db.send(uploadMessage).then((response) => {
      this[DATA] = null;
      this.fromJSON(response.entity);
      return this;
    }).then(doneCallback, failCallback);
  }

  /**
   * Download a file and providing it in the requested type
   * @param {object=} downloadOptions The download options
   * @param {string} [downloadOptions.type="blob"] The type used to provide the file
   * @param {string} [downloadOptions.refresh=false] Indicates to make a revalidation request and not use the cache
   * @param {binding.File~downloadCallback=} doneCallback The callback is invoked after the download succeed
   * successfully
   * @param {binding.File~failCallback=} failCallback The callback is invoked if any error is occurred
   * @return {Promise<string|Blob|File|ArrayBuffer|json>} A promise which will be fulfilled with the downloaded
   * file content
   */
  download(downloadOptions, doneCallback, failCallback) {
    const opt = downloadOptions || {};

    if (this.isFolder) {
      throw new Error('A folder cannot be downloaded');
    }

    const type = opt.type || 'blob';

    const downloadMessage = new message.DownloadFile(this.bucket, this.key)
      .responseType(type);

    this.db.ensureCacheHeader(this.id, downloadMessage, opt.refresh);

    return this.db.send(downloadMessage).then((response) => {
      this.db.addToWhiteList(this.id);
      this.fromHeaders(response.headers);
      return response.entity;
    }, (e) => {
      if (e.status === StatusCode.OBJECT_NOT_FOUND) {
        return null;
      }
      throw e;
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
    const opt = deleteOptions || {};

    const deleteMessage = new message.DeleteFile(this.bucket, this.key);
    this.conditional(deleteMessage, opt);

    if (!this.isFolder) {
      this.db.addToBlackList(this.id);
    }

    return this.db.send(deleteMessage).then((response) => {
      if (!this.isFolder) {
        return this;
      }

      return response.entity.map(fileId => this.db.File(fileId));
    }).then(doneCallback, failCallback);
  }

  /**
   * Creates the file id from given options.
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
      const parent = trailingSlashIt(fileOptions.parent || '/www');
      if (parent.length < 3) {
        throw new Error('Invalid parent name: ' + parent);
      }

      const name = fileOptions.name || (fileOptions.data && fileOptions.data.name) || uuid();
      path = parent + name;
    }

    // Add leading slash if missing
    if (path.charAt(0) !== '/') {
      path = '/' + path;
    }

    // Check path validity
    if (path.indexOf('//') !== -1 || path.length < 3) {
      throw new Error('Invalid path: ' + path);
    }

    return FILE_BUCKET + path;
  }

  /**
   * Makes the given message a conditional request based on the file metadata
   * @param {connector.Message} msg The message to make conditional
   * @param {object} options additional request options
   * @param {boolean} [options.force=false] Force the request operation by didn't make it conditional
   * @return {void}
   */
  conditional(msg, options) {
    if (options.force) {
      return;
    }

    const meta = this[METADATA];
    if (!meta || (!meta.lastModified && !meta.eTag)) {
      msg.ifNoneMatch('*');
      return;
    }

    msg.ifUnmodifiedSince(meta.lastModified);
    msg.ifMatch(meta.eTag);
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
    const opt = options || {};

    if (this.isFolder) {
      throw new Error('A folder has no matadata.');
    }

    const msg = new message.GetFileMetadata(this.bucket, this.key);
    this.db.ensureCacheHeader(this.id, msg, opt.refresh);
    return this.db.send(msg).then((response) => {
      // do not white list the file, because head-request does not revalidate the cache.
      this.fromHeaders(response.headers);
      return this;
    }, (e) => {
      if (e.status === StatusCode.OBJECT_NOT_FOUND) {
        return null;
      }
      throw e;
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
    const opt = options || {};

    const json = this.toJSON();
    const msg = new message.UpdateFileMetadata(this.bucket, this.key)
      .entity(json);

    this.conditional(msg, opt);

    return this.db.send(msg).then((response) => {
      this.fromJSON(response.entity);
      return this;
    }).then(doneCallback, failCallback);
  }

  /**
   * Validates and sets the file metadata based on the given options
   * @param {object} options
   * @private
   */
  setDataOptions(options) {
    const data = options.data;
    const type = options.type;

    if (!data) {
      return;
    }

    // Set data
    this[DATA] = { type, data };

    const mimeType = this.guessMimeType(options);
    this.fromJSON(Object.assign({}, options, { mimeType }));
  }

  /**
   * Gets the MIME type of given file options.
   * @param {object} options
   * @return {?string} Returns the guessed MIME type or null, if it could not be guessed.
   * @private
   */
  guessMimeType(options) {
    const mimeType = options.mimeType;
    if (mimeType) {
      return mimeType;
    }

    if (typeof Blob !== 'undefined' && options.data instanceof Blob) {
      return options.data.type;
    }

    if (options.type === 'data-url') {
      const match = options.data.match(/^data:(.+?)(;base64)?,.*$/);
      return match[1];
    }

    return null;
  }

  /**
   * @param {Object<string,string>} headers
   * @return {void}
   * @private
   */
  fromHeaders(headers) {
    this.fromJSON({
      eTag: File.parseETag(headers.etag),
      lastModified: headers['last-modified'],
      createdAt: headers['baqend-created-at'],
      mimeType: headers['content-type'],
      acl: headers['baqend-acl'] && JSON.parse(headers['baqend-acl']),
      size: +headers['baqend-size'],
      headers: headers['baqend-custom-headers'] && JSON.parse(headers['baqend-custom-headers']),
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

    const meta = this[METADATA] || {};

    let acl;
    if (json.acl instanceof Acl) {
      acl = json.acl;
    } else {
      acl = meta.acl || new Acl();
      if (json.acl) {
        acl.fromJSON(json.acl);
      }
    }

    // keep last known lastModified, createdAt, eTag and headers
    this[METADATA] = Object.assign({}, this[METADATA], {
      mimeType: json.mimeType,
      lastModified: (json.lastModified && new Date(json.lastModified)) || meta.lastModified,
      createdAt: (json.createdAt && new Date(json.createdAt)) || meta.createdAt,
      eTag: json.eTag || meta.eTag,
      acl,
      size: typeof json.size === 'number' ? json.size : json.contentLength,
      headers: json.headers || meta.headers || {},
    });
  }

  /**
   * Serialize the file metadata of this object to json
   * @return {json} The serialized file metadata as json
   */
  toJSON() {
    this.checkAvailable();
    const meta = this[METADATA];

    return {
      id: this.id,
      mimeType: meta.mimeType,
      eTag: meta.eTag,
      acl: meta.acl.toJSON(),
      size: meta.size,
      lastModified: meta.lastModified && meta.lastModified.toISOString(),
      createdAt: meta.createdAt && meta.createdAt.toISOString(),
      headers: meta.headers,
    };
  }

  /**
   * Checks whenever metadata are already loaded of the file, throws an error otherwise
   * @return {void}
   */
  checkAvailable() {
    if (!this.isMetadataLoaded) {
      throw new error.PersistentError('The file metadata of ' + this.id + ' is not available.');
    }
  }

  /**
   * The database connection to use
   * @name db
   * @type {EntityManager}
   * @memberOf File.prototype
   * @field
   * @readonly
   */
}

/**
 * The database connection to use
 * @member File.prototype
 */
deprecated(File.prototype, '_db', 'db');
deprecated(File.prototype, '_conditional', 'conditional');
deprecated(File.prototype, '_setMetadata', 'setDataOptions');
deprecated(File.prototype, '_checkAvailable', 'checkAvailable');

/**
 * The file callback is called, when the asynchronous operation completes successfully
 * @callback binding.File~fileCallback
 * @param {binding.File} file The updated file metadata
 * @return {*} A Promise, result or undefined
 */

/**
 * The download callback is called, when the asynchronous download completes successfully
 * @callback binding.File~downloadCallback
 * @param {string|Blob|File|ArrayBuffer|json} data The download file content in the requested format
 * @return {*} A Promise, result or undefined
 */

/**
 * The delete callback is called, when the asynchronous deletion completes successfully
 * @callback binding.File~deleteCallback
 * @param {binding.File} data The file metadata
 * @return {*} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback binding.File~failCallback
 * @param {error.PersistentError} error The error which reject the operation
 * @return {*} A Promise, result or undefined
 */

module.exports = File;
