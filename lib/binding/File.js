"use strict";

var error = require('../error');
var Acl = require('../Acl');
var util = require('../util/util');
var message = require('../message');
var StatusCode = require('../connector/Message').StatusCode;

var PREFIX = '/file';
var LEN = PREFIX.length;

/**
 * Creates a file object, which represents one specific file reference.
 * This File object can afterwards be used to up- and download the file contents or to retrieves and change the files
 * metadata.
 *
 * The file data can be uploaded and downloaded as:
 * <table>
 *   <tr>
 *     <th>type</th>
 *     <th>JavaScript type</th>
 *     <th>Description</th>
 *   </tr>
 *   <tr>
 *     <td>'arraybuffer'</th>
 *     <th>ArrayBuffer</th>
 *     <th>The content is represented as a fixed-length raw binary data buffer</th>
 *   </tr>
 *   <tr>
 *     <td>'blob'</th>
 *     <th>Blob</th>
 *     <th>The content is represented as a simple blob</th>
 *   </tr>
 *   <tr>
 *     <td>'json'</th>
 *     <th>object|array|string</th>
 *     <th>The file content is represented as json</th>
 *   </tr>
 *   <tr>
 *     <td>'text'</th>
 *     <th>string</th>
 *     <th>The file content is represented through the string</th>
 *   </tr>
 *   <tr>
 *     <td>'base64'</th>
 *     <th>string</th>
 *     <th>The file content as base64 encoded string</th>
 *   </tr>
 *   <tr>
 *     <td>'data-url'</th>
 *     <th>string</th>
 *     <th>A data url which represents the file content</th>
 *   </tr>
 *
 * @alias baqend.File
 */
class File {

  /**
   * The complete id of the file, including folder and name
   * @type string
   */
  get id() {
    if (!this._id)
      this._id = PREFIX + this._folder + '/' + this._name;
    return this._id;
  }

  /**
   * The fully url to the file, can be directly used to link the file, i.e. in link tags ot image sources
   * @type string
   */
  get url() {
    return this._db.createURL(this.id, this.bucket != 'www');
  }

  /**
   * The name of the file
   * @type string
   */
  get name() {
    if (!this._name)
      this._name = this._id.substring(this._id.lastIndexOf('/') + 1);
    return this._name;
  }

  /**
   * The folder of the file
   * @type string
   */
  get folder() {
    if (!this._folder)
      this._folder = this._id.substring(LEN, this._id.lastIndexOf('/'));
    return this._folder;
  }

  /**
   * The mimeType of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
   * @type string
   */
  get mimeType() {
    this._checkAvailable();
    return this._mimeType;
  }

  /**
   * The current file acl, only accessible after fetching the metadata or downloading/uploading/providing the file
   * @type string
   */
  get acl() {
    this._checkAvailable();
    return this._acl;
  }

  /**
   * The last modified date of the file, only accessible after fetching the metadata or downloading/uploading/providing the eTag
   * @type string
   */
  get lastModified() {
    this._checkAvailable();
    return this._lastModified;
  }

  /**
   * The eTag of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
   * @type string
   */
  get eTag() {
    this._checkAvailable();
    return this._eTag;
  }

  get bucket() {
    return this.id.substring(LEN + 1, this.id.indexOf('/', LEN + 1));
  }

  get key() {
    return this.id.substring(this.id.indexOf('/', LEN + 1) + 1);
  }

  /**
   * Creates a new file object which represents the a file at the given id. Data are provided to the constructor will
   * be uploaded by invoking {@link upload()}
   * @param {object|string} fileOptions The fileOptions used to create a new file object, or just the id of the
   * file object
   * @param {string=} fileOptions.name The filename without the id. If omitted and data is provided as a file object, the
   * {@link File#name} will be used otherwise a uuid will be generated.
   * @param {string} [fileOptions.folder="/www"] The folder which contains the file
   * @param {string|Blob|File|ArrayBuffer|json=} fileOptions.data The initial file content, which will be uploaded by
   * invoking {@link #upload} later on.
   * @param {string=} fileOptions.type A optional type hint used to correctly interpret the provided data
   * @param {string=} fileOptions.mimeType The mimType of the file. Defaults to the mimeType of the provided data if
   * it is a file object, blob or data-url
   * @param {string=} fileOptions.eTag The optional current ETag of the file
   * @param {string=} fileOptions.lastModified The optional last modified date
   * @param {baqend.Acl=} fileOptions.acl The file acl which will be set, if the file is uploaded afterwards
   */
  constructor(fileOptions) {
    fileOptions = fileOptions || {};

    this._available = false;

    if (Object(fileOptions) instanceof String) {
      let id = fileOptions;
      let nameSeparator = id.indexOf('/', '/file/'.length);
      if (id.indexOf('/file/') != 0 || nameSeparator == -1 || nameSeparator == id.length - 1) {
        throw new Error('Invalid file reference ' + id);
      }

      this._id = id;
    } else {
      let folder = fileOptions.folder || '/www';
      if (folder.charAt(0) != '/')
        folder = '/' + folder;

      if (folder.charAt(folder.length - 1) == '/')
        folder = folder.substring(0, folder.length - 1);

      if (folder.length < 2)
        throw new Error('Invalid folder name' + folder);

      //name can set be directly or File.name is used
      let name = fileOptions.name || (fileOptions.data && fileOptions.data.name) || util.uuid();

      if (name.indexOf('/') != -1)
        throw new Error('Invalid file name ' + name);

      this._name = name;
      this._folder = folder;
      this._setMetadata(fileOptions);
    }
  }

  /**
   * Uploads the file content which was provided in the constructor or by uploadOptions.data
   * @param {object=} uploadOptions The upload options
   * @param {string|Blob|File|ArrayBuffer|Object|Array=} uploadOptions.data The initial file content, which will be uploaded by
   * invoking {@link #upload} later on.
   * @param {string=} uploadOptions.type A optional type hint used to correctly interpret the provided data
   * @param {string=} uploadOptions.mimeType The mimType of the file. Defaults to the mimeType of the provided data if
   * it is a file object, blob or data-url
   * @param {string=} uploadOptions.eTag The optional current ETag of the file
   * @param {string=} uploadOptions.lastModified The optional last modified date
   * @param {baqend.Acl=} uploadOptions.acl The file acl which will be set, if the file is uploaded afterwards
   * @param {boolean} [uploadOptions.force=false] force the upload and overwrite any existing files without validating it
   * @param {baqend.binding.File~uploadCallback=} doneCallback The callback is invoked after the upload succeed successfully
   * @param {baqend.binding.File~failCallback=} failCallback The callback is invoked if any error is occurred
   * @return {Promise<baqend.binding.File>} A promise which will fulfilled with this file object where the metadata is updated
   */
  upload(uploadOptions, doneCallback, failCallback) {
    uploadOptions = uploadOptions || {};

    this._setMetadata(uploadOptions);

    var uploadMessage = new message.UploadFile(this.bucket, this.key)
      .entity(this._data, this._type)
      .acl(this._acl);

    if (this._mimeType)
       uploadMessage.mimeType(this._mimeType);

    this._conditional(uploadMessage, uploadOptions);

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
   * @param {baqend.binding.File~deleteCallback=} doneCallback The callback is invoked after the upload succeed successfully
   * @param {baqend.binding.File~failCallback=} failCallback The callback is invoked if any error is occurred
   * @return {Promise<string|Blob|File|ArrayBuffer|Object|Array>} A promise which will fulfilled with the downloaded file content
   */
  download(downloadOptions, doneCallback, failCallback) {
    downloadOptions = downloadOptions || {};

    var type = downloadOptions.type || 'blob';

    var downloadMessage = new message.DownloadFile(this.bucket, this.key)
        .responseType(type);

    return this._db.send(downloadMessage).then((response) => {
      var headers = response.headers;

      this.fromJSON({
        eTag: headers.etag? headers.etag.substring(1, headers.etag.length - 1): null,
        lastModified: headers['last-modified'],
        mimeType: headers['content-type'],
        acl: JSON.parse(headers['baqend-acl'])
      });

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
   * @param {baqend.binding.File~deleteCallback=} doneCallback The callback is invoked after the deletion succeed successfully
   * @param {baqend.binding.File~failCallback=} failCallback The callback is invoked if any error is occurred
   * @return {Promise<baqend.binding.File>} A promise which will fulfilled with this file object
   */
  delete(deleteOptions, doneCallback, failCallback) {
    deleteOptions = deleteOptions || {};

    if (this._isNew) {
      throw new Error('The file is new and can therefore not be deleted.');
    }

    var deleteMessage = new message.DeleteFile(this.bucket, this.key);
    this._conditional(deleteMessage, deleteOptions);

    return this._db.send(deleteMessage).then(function() {
      return this;
    }).then(doneCallback, failCallback);
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
   * Validates and sets the file metadata based on the given options
   * @param options
   * @private
   */
  _setMetadata(options) {
    let data = options.data;
    let type = options.type;
    let eTag = options.eTag;
    let acl = options.acl;
    let mimeType = options.mimeType;
    let lastModified = options.lastModified;

    if (!data) {
      if (type || mimeType || lastModified || eTag || acl) {
        throw new Error('Upload metadata was provided without any data to upload');
      }

      this._available = false;
    } else {
      if (data instanceof Blob) {
        mimeType = mimeType || data.type;
      } else if (type == 'data-url') {
        let match = data.match(/^data:(.+?)(;base64)?,.*$/);
        mimeType = mimeType || match[1];
      }

      this._data = data;
      this._type = type;

      this._mimeType = mimeType;
      this._lastModified = lastModified || this._lastModified;
      this._eTag = eTag || this._eTag;
      this._acl = acl || this._acl || new Acl();
      this._available = true;
    }
  }

  fromJSON(metadata) {
    if (metadata.mimeType)
      this._mimeType = metadata.mimeType;

    if (metadata.lastModified)
      this._lastModified = new Date(metadata.lastModified);

    if (metadata.eTag)
      this._eTag = metadata.eTag;

    this._acl = this._acl || new Acl();
    if (metadata.acl)
      this._acl.fromJSON(metadata.acl);

    this._available = true;
  }

  _checkAvailable() {
    if (!this._available) {
      throw new error.PersistentError('The file metadata of ' + this.id + ' is not available.');
    }
  }

  /**
   * The database connection to use
   * @member {baqend.EntityManager} _db
   * @private
   */
}

/**
 * The upload callback is called, when the asynchronous upload completes successfully
 * @callback baqend.binding.File~uploadCallback
 * @param {baqend.binding.File} file The updated file metadata
 * @return {any} A Promise, result or undefined
 */

/**
 * The download callback is called, when the asynchronous download completes successfully
 * @callback baqend.binding.File~downloadCallback
 * @param {string|Blob|File|ArrayBuffer|json} data The download file content in the requested format
 * @return {any} A Promise, result or undefined
 */

/**
 * The delete callback is called, when the asynchronous deletion completes successfully
 * @callback baqend.binding.File~deleteCallback
 * @param {baqend.binding.File} data The file metadata
 * @return {any} A Promise, result or undefined
 */

/**
 * The fail callback is called, when the asynchronous operation is rejected by an error
 * @callback baqend.binding.File~failCallback
 * @param {baqend.error.PersistentError} error The error which reject the operation
 * @return {any} A Promise, result or undefined
 */

module.exports = File;