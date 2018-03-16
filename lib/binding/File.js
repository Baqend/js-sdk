'use strict';

const error = require('../error');
const Acl = require('../Acl');
const uuid = require('../util/uuid').uuid;
const message = require('../message');
const StatusCode = require('../connector/Message').StatusCode;
const deprecated = require('../util/deprecated');

const PREFIX = '/file';
const LEN = PREFIX.length;
const id = Symbol('Id');
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
   * @type string
   */
  get id() {
    return this[id];
  }

  /**
   * The fully url to the file, can be directly used to link the file, i.e. in link tags ot image sources
   * @type string
   */
  get url() {
    if (this.isFolder) {
      throw new Error('Url can not be created for folders.');
    }
    if (!this[METADATA].url) {
      this[METADATA].url = this.db.createURL(this.id, this.bucket !== 'www');
    }
    return this[METADATA].url;
  }

  /**
   * The name of the file
   * @type string
   */
  get name() {
    if (!this[METADATA].name) {
      this[METADATA].name = this.id.substring(this.id.lastIndexOf('/', this.id.length - 2) + 1);
    }
    return this[METADATA].name;
  }

  /**
   * The mimeType of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
   * @type string
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
   * @type string
   */
  get acl() {
    this.checkAvailable();
    return this[METADATA].acl;
  }

  /**
   * The last modified date of the file, only accessible after fetching the metadata
   * or downloading/uploading/providing the eTag
   * @type Date
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
   * @type Date
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
   * @type string
   */
  get eTag() {
    if (this.isFolder) {
      throw new Error('A folder has no eTag');
    }
    this.checkAvailable();
    return this[METADATA].eTag;
  }

  /**
   * The size of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
   * @type number
   */
  get size() {
    if (this.isFolder) {
      throw new Error('A folder has no size');
    }
    this.checkAvailable();
    return this[METADATA].size;
  }

  get bucket() {
    return this.id.substring(LEN + 1, this.id.indexOf('/', LEN + 1));
  }

  get key() {
    return this.id.substring(this.id.indexOf('/', LEN + 1) + 1);
  }

  /**
   * The full path of the file.
   * @type string
   */
  get path() {
    return this.id.substring(LEN);
  }

  /**
   * The parent folder of the file.
   * @type string
   */
  get parent() {
    return this.id.substring(LEN, this.id.lastIndexOf('/', this.id.length - 2));
  }

  /**
   * Indicates if the metadata are loaded.
   * @type boolean
   */
  get isMetadataLoaded() {
    return !!this[METADATA];
  }

  /**
   * Creates a new file object which represents the a file at the given id. Data are provided to the constructor will
   * be uploaded by invoking {@link upload()}
   * @param {object|string} fileOptions The fileOptions used to create a new file object, or just the id of the
   * file object
   * @param {string=} fileOptions.id The id of the file.
   * @param {string=} fileOptions.name The filename without the id. If omitted and data is provided as a file object,
   * the {@link File#name} will be used otherwise a uuid will be generated.
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
   */
  constructor(fileOptions) {
    const opt = fileOptions || {};

    if (Object(opt) instanceof String) {
      const idString = opt;
      const nameSeparator = idString.indexOf('/', '/file/'.length);
      if (nameSeparator === -1 || idString.indexOf('/file/') !== 0) {
        throw new Error('Invalid file reference ' + idString);
      }

      this[id] = idString;
    } else if (opt.id) {
      this[id] = opt.id;
      this.setDataOptions(opt);
    } else {
      let path;
      if (opt.path) {
        path = opt.path;
      } else {
        let parent = opt.parent || '/www';
        if (parent.charAt(parent.length - 1) !== '/') {
          parent += '/';
        }

        if (parent.length < 3) {
          throw new Error('Invalid parent name: ' + parent);
        }

        const name = opt.name || (opt.data && opt.data.name) || uuid();
        path = parent + name;
      }

      if (path.charAt(0) !== '/') {
        path = '/' + path;
      }

      if (path.indexOf('//') !== -1 || path.length < 3) {
        throw new Error('Invalid path: ' + path);
      }

      this[id] = PREFIX + path;
      this.setDataOptions(opt);
    }

    /**
     * Specifies whether this file is a folder.
     * @type {boolean}
     */
    this.isFolder = this.id.charAt(this.id.length - 1) === '/';
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
   * Makes the given message a conditional request based on the file metadata
   * @param {message.Message} msg The message to make conditional
   * @param {object} options additional request options
   * @param {boolean} [options.force=false] Force the request operation by didn't make it conditional
   */
  conditional(msg, options) {
    if (options.force) {
      return;
    }

    const meta = this[METADATA];
    if (!meta) {
      return;
    }

    msg.ifUnmodifiedSince(meta.lastModified);
    msg.ifMatch(meta.eTag);

    if (!meta.lastModified && !meta.eTag) {
      msg.ifNoneMatch('*');
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
    json.id = this[id];

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
   * @param {Object} options
   * @private
   */
  setDataOptions(options) {
    const data = options.data;
    const type = options.type;

    if (!data) {
      return;
    }

    let mimeType = options.mimeType;
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      mimeType = mimeType || data.type;
    } else if (type === 'data-url') {
      const match = data.match(/^data:(.+?)(;base64)?,.*$/);
      mimeType = mimeType || match[1];
    }

    this[DATA] = { type, data };

    this.fromJSON(Object.assign({}, options, { mimeType }));
  }

  fromHeaders(headers) {
    this.fromJSON({
      eTag: headers.etag ? headers.etag.substring(1, headers.etag.length - 1) : null,
      lastModified: headers['last-modified'],
      createdAt: headers['baqend-created-at'],
      mimeType: headers['content-type'],
      acl: headers['baqend-acl'] && JSON.parse(headers['baqend-acl']),
      size: +headers['baqend-size'],
    });
  }

  fromJSON(json) {
    let acl;
    if (json.acl instanceof Acl) {
      acl = json.acl;
    } else {
      acl = (this[METADATA] && this[METADATA].acl) || new Acl();
      acl.fromJSON(json.acl);
    }

    this[METADATA] = Object.assign({}, this[METADATA], {
      mimeType: json.mimeType,
      lastModified: json.lastModified && new Date(json.lastModified),
      createdAt: json.createdAt && new Date(json.createdAt),
      eTag: json.eTag,
      acl,
      size: typeof json.size === 'number' ? json.size : json.contentLength,
    });
  }

  toJSON() {
    const meta = this[METADATA];

    return {
      mimeType: meta.mimeType,
      eTag: meta.eTag,
      acl: meta.acl.toJSON(),
      contentLength: meta.size,
      size: meta.size,
      lastModified: meta.lastModified && meta.lastModified.toISOString(),
      createdAt: meta.createdAt && meta.createdAt.toISOString(),
    };
  }

  /**
   * Checks whenever metadata are already loaded of the file, throws an error otherwise
   */
  checkAvailable() {
    if (!this.isMetadataLoaded) {
      throw new error.PersistentError('The file metadata of ' + this.id + ' is not available.');
    }
  }

  /**
   * The database connection to use
   * @member {EntityManager} db
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
