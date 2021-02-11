import { PersistentError } from '../error';
import { Acl } from '../Acl';
import {
  uuid, trailingSlashIt,
  Json, JsonArray, JsonMap,
} from '../util';
import * as message from '../message';
import {
  Message, ProgressListener, StatusCode, RequestBodyType, ResponseBodyType,
} from '../connector';

import type { EntityManager } from '../EntityManager';

const FILE_BUCKET = '/file';
const FILE_BUCKET_LENGTH = FILE_BUCKET.length;

const ID = Symbol('Id');
const METADATA = Symbol('Metadata');
const DATA = Symbol('Data');

export interface FileIdentifiers {
  /**
   * The id of the file.
   */
  id?: string,
  /**
   * The filename without the id. If omitted and data is provided as a file object,
   * the {@link File#name} will be used otherwise a UUID will be generated.
   */
  name?: string,
  /**
   * The parent folder which contains the file
   */
  parent?: string,
  /**
   * The full path of the file.
   * You might either specify the path of the file or a combination of parent and file name.
   */
  path?: string
}

export interface FileData {
  /**
   * The initial file content, which will be uploaded by
   * invoking {@link #upload} later on.
   */
  data?: string | Blob | ArrayBuffer | JsonArray | JsonMap,
  /**
   * A optional type hint used to correctly interpret the provided data
   */
  type?: RequestBodyType,
}

export interface FileMetadata {
  /**
   * The mimType of the file. Defaults to the mimeType of the provided data if
   * it is a file object, blob or data-url
   */
  mimeType?: string,
  /**
   * The size of the file content in bytes
   */
  size?: number,
  /**
   * The optional current ETag of the file
   */
  eTag?: string,
  /**
   * The creation date of the file
   */
  createdAt?: string | Date
  /**
   * The optional last modified date
   */
  lastModified?: string | Date,
  /**
   * The file acl which will be set, if the file is uploaded afterwards
   */
  acl?: Acl,
  /**
   * The custom headers which will be send with the file after updating it
   */
  headers?: { [header: string]: string },
}

/**
 * A file name or all file options
 */
export type FileOptions = (FileIdentifiers & FileData & FileMetadata) | string;

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
 */
export class File {
  /**
   * Specifies whether this file is a folder.
   */
  public readonly isFolder: boolean;

  /**
   * The database connection to use
   */
  public db: EntityManager = null as any; // is lazy initialized and never null

  private [ID]: string;

  private [METADATA]: FileMetadata;

  private [DATA]: FileData | null = null;

  /**
   * The complete id of the file, including folder and name
   */
  get id(): string {
    return this[ID];
  }

  // @ts-ignore
  get url(): string {
    throw new Error('This method is removed. Use the asynchronous File.createURL() method instead.');
  }

  /**
   * The name of the file
   */
  get name(): string {
    return this.id.substring(this.id.lastIndexOf('/', this.id.length - 2) + 1);
  }

  /**
   * The mimeType of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
   */
  get mimeType(): string | undefined {
    if (this.isFolder) {
      throw new Error('A folder has no mimeType');
    }
    this.checkAvailable();
    return this[METADATA].mimeType;
  }

  /**
   * The current file acl, only accessible after fetching the metadata or downloading/uploading/providing the file
   */
  get acl(): Acl | undefined {
    this.checkAvailable();
    return this[METADATA].acl;
  }

  /**
   * The last modified date of the file, only accessible after fetching the metadata
   * or downloading/uploading/providing the eTag
   */
  get lastModified(): Date | undefined {
    if (this.isFolder) {
      throw new Error('A folder has no lastModified');
    }
    this.checkAvailable();
    return this[METADATA].lastModified as Date;
  }

  /**
   * The creation date of the file, only accessible after fetching the metadata
   * or downloading/uploading/providing the eTag
   */
  get createdAt(): Date | undefined {
    if (this.isFolder) {
      throw new Error('A folder has no creation date');
    }
    this.checkAvailable();
    return this[METADATA].createdAt as Date;
  }

  /**
   * The eTag of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
   */
  get eTag(): string | undefined {
    if (this.isFolder) {
      throw new Error('A folder has no eTag');
    }
    this.checkAvailable();
    return this[METADATA].eTag;
  }

  /**
   * The custom headers of the file, only accessible after fetching the metadata or downloading/uploading/providing
   * the file
   */
  get headers(): {[name: string]: string} {
    if (this.isFolder) {
      throw new Error('A folder has no custom headers');
    }

    this.checkAvailable();
    return this[METADATA].headers!!;
  }

  /**
   * The size of the file, only accessible after fetching the metadata or downloading/uploading/providing the file
   */
  get size(): number | undefined {
    if (this.isFolder) {
      throw new Error('A folder has no size');
    }
    this.checkAvailable();
    return this[METADATA].size;
  }

  /**
   * The root bucket of this file
   */
  get bucket(): string {
    return this.id.substring(FILE_BUCKET_LENGTH + 1, this.id.indexOf('/', FILE_BUCKET_LENGTH + 1));
  }

  /**
   * The full path under the bucket of this file
   */
  get key(): string {
    return this.id.substring(this.id.indexOf('/', FILE_BUCKET_LENGTH + 1) + 1);
  }

  /**
   * The full path of the file.
   */
  get path(): string {
    return this.id.substring(FILE_BUCKET_LENGTH);
  }

  /**
   * The parent folder of the file.
   */
  get parent(): string {
    return this.id.substring(FILE_BUCKET_LENGTH, this.id.lastIndexOf('/', this.id.length - 2));
  }

  /**
   * Indicates if the metadata are loaded.
   */
  get isMetadataLoaded(): boolean {
    return !!this[METADATA];
  }

  /**
   * Creates a new file object which represents a file at the given id. Data which is provided to the constructor will
   * be uploaded by invoking {@link upload()}
   * @param fileOptions The fileOptions used to create a new file object, or just the id of the file
   */
  constructor(fileOptions: FileOptions) {
    // Is fileOptions just an id?
    const opt = typeof fileOptions === 'string' ? { id: fileOptions } : (fileOptions || {});

    if (opt.id) {
      // Check validity of id
      const nameSeparator = opt.id.indexOf('/', '/file/'.length);
      if (nameSeparator === -1 || opt.id.indexOf('/file/') !== 0) {
        throw new Error(`Invalid file reference ${opt.id}`);
      }

      this[ID] = opt.id;
    } else {
      this[ID] = this.createIdFromOptions(opt);
    }

    // Assign metadata
    this.setDataOptions(opt);
    this.isFolder = this.id.charAt(this.id.length - 1) === '/';
  }

  /**
   * Parses an E-Tag header
   * @param eTag The E-Tag to parse or something falsy
   * @return Returns the parsed E-Tag or null, if it could not be parsed
   */
  static parseETag(eTag?: string): string | null {
    if (!eTag) {
      return null;
    }

    const match = eTag.match(/^(?:[wW]\/)?["'](.*)["']$/);
    if (!match) {
      return null;
    }

    return match[1];
  }

  /**
   * The fully url to the file, can be directly used to link the file, i.e. in link tags ot image sources
   * @param authorize - Authorize the the link with an temporary token, to give authorized access to this protected
   * resource default false if the root bucket is www, true otherwise
   * @return A url with an optional token, to give direct access o the linked resource
   */
  createURL(authorize?: boolean): Promise<string> {
    if (this.isFolder) {
      throw new Error('Url can not be created for folders.');
    }

    return this.db.createURL(this.id, typeof authorize === 'boolean' ? authorize : this.bucket !== 'www');
  }

  /**
   * Uploads the file content which was provided in the constructor or by uploadOptions.data
   * @param uploadOptions The upload options
   * @param [uploadOptions.force=false] force the upload and overwrite any existing files without validating
   * it
   * @param [uploadOptions.progress] listen to progress changes during upload
   * @param doneCallback The callback is invoked after the upload succeed successfully
   * @param failCallback The callback is invoked if any error is occurred
   * @return A promise which will be fulfilled with this file object where the metadata is updated
   */
  upload(uploadOptions?: FileData & FileMetadata & { force?: boolean, progress?: ProgressListener }, doneCallback?: any,
    failCallback?: any): Promise<this> {
    const opt = uploadOptions || {};

    if (this.isFolder) {
      throw new Error('A folder cannot be uploaded');
    }

    this.setDataOptions(opt);

    const uploadMessage = new message.UploadFile(this.bucket, this.key)
      .entity(this[DATA]!!.data!!, this[DATA]?.type);

    const meta = this[METADATA];
    if (meta) {
      uploadMessage.acl(meta.acl!!);
      uploadMessage.contentLength(meta.size!!);
      uploadMessage.mimeType(meta.mimeType!!);
      uploadMessage.customHeaders(meta.headers!!);
    }

    uploadMessage.progress(opt.progress || null);

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
   * @param downloadOptions The download options
   * @param downloadOptions.type="blob" The type used to provide the file
   * @param downloadOptions.refresh=false Indicates to make a revalidation request and not use the cache
   * @param doneCallback The callback is invoked after the download succeed
   * successfully
   * @param failCallback The callback is invoked if any error is occurred
   * @return A promise which will be fulfilled with the downloaded file content
   */
  download(downloadOptions?: { type?: ResponseBodyType, refresh?: false }, doneCallback?: any,
    failCallback?: any): Promise<string|Blob|File|ArrayBuffer|Json> {
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
   * @param deleteOptions The delete options
   * @param deleteOptions.force=false force the deletion without verifying any version
   * @param doneCallback The callback is invoked after the deletion succeed successfully
   * @param failCallback The callback is invoked if any error is occurred
   * @return A promise which will be fulfilled with this file object,
   * or with a list of all deleted files, if this file is an folder
   */
  delete(deleteOptions?: { force?: boolean }, doneCallback?: any, failCallback?: any): Promise<this | File[]> {
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

      return (response.entity as string[]).map((fileId) => new this.db.File(fileId));
    }).then(doneCallback, failCallback);
  }

  /**
   * Creates the file id from given options.
   * @param fileOptions
   * @return
   */
  private createIdFromOptions(fileOptions: FileIdentifiers & FileData): string {
    let path: string;
    if (fileOptions.path) {
      path = fileOptions.path;
    } else {
      const parent = trailingSlashIt(fileOptions.parent || '/www');
      if (parent.length < 3) {
        throw new Error(`Invalid parent name: ${parent}`);
      }

      const name = fileOptions.name || (fileOptions?.data as any)?.name || uuid();
      path = parent + name;
    }

    // Add leading slash if missing
    if (path.charAt(0) !== '/') {
      path = `/${path}`;
    }

    // Check path validity
    if (path.indexOf('//') !== -1 || path.length < 3) {
      throw new Error(`Invalid path: ${path}`);
    }

    return FILE_BUCKET + path;
  }

  /**
   * Makes the given message a conditional request based on the file metadata
   * @param msg The message to make conditional
   * @param options additional request options
   * @param options.force=false Force the request operation by didn't make it conditional
   */
  conditional(msg: Message, options: { force?: boolean }): void {
    if (options.force) {
      return;
    }

    const meta = this[METADATA];
    if (!meta || (!meta.lastModified && !meta.eTag)) {
      msg.ifNoneMatch('*');
      return;
    }

    msg.ifUnmodifiedSince(meta.lastModified as Date);
    msg.ifMatch(meta.eTag!!);
  }

  /**
   * Gets the file metadata of a file
   * @param options The load metadata options
   * @param [options.refresh=false] Force a revalidation while fetching the metadata
   * @param doneCallback The callback is invoked after the metadata is fetched
   * @param failCallback The callback is invoked if any error has occurred
   * @return A promise which will be fulfilled with this file
   */
  loadMetadata(options?: { refresh?: boolean }, doneCallback?: any, failCallback?: any): Promise<this> {
    const opt = options || {};

    if (this.isFolder) {
      throw new Error('A folder has no mata data.');
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
   * Updates the mata data of this file.
   * @param options The save metadata options
   * @param [options.force=false] force the update and overwrite the existing metadata without validating it
   * @param doneCallback The callback is invoked after the metadata is saved
   * @param failCallback The callback is invoked if any error has occurred
   * @return A promise which will be fulfilled with this file
   */
  saveMetadata(options?: { force?: boolean }, doneCallback?: any, failCallback?: any): Promise<this> {
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
   * @param options
   * @private
   */
  setDataOptions(options: FileData & FileMetadata) {
    const { data, type, ...metadata } = options;

    if (!data) {
      return;
    }

    // Set data
    this[DATA] = { type, data };

    const mimeType = this.guessMimeType(options) || undefined;
    this.fromJSON({ ...metadata, mimeType });
  }

  /**
   * Gets the MIME type of given file options.
   * @param options
   * @return Returns the guessed MIME type or null, if it could not be guessed.
   * @private
   */
  guessMimeType(options: FileData & FileMetadata): string | null {
    const { mimeType } = options;
    if (mimeType) {
      return mimeType;
    }

    if (typeof Blob !== 'undefined' && options.data instanceof Blob) {
      return options.data.type;
    }

    if (options.type === 'data-url' && typeof options.data === 'string') {
      const match = options.data.match(/^data:(.+?)(;base64)?,.*$/);
      return match && match[1];
    }

    return null;
  }

  /**
   * @param headers
   */
  private fromHeaders(headers: {[header: string]: string}): void {
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
   * Deserialize the given JSON file metadata back to this file instance
   *
   * If the JSON object contains an ID, it must match with this file ID, otherwise an exception is thrown.
   *
   * @param json The json to deserialize
   */
  fromJSON(json: JsonMap | FileMetadata): void {
    const { id } = json as JsonMap;
    if (id && this.id !== id) {
      throw new Error(`This file id ${this.id} does not match the given json id ${id}`);
    }

    const meta = this[METADATA] || {};

    let acl;
    if (json.acl instanceof Acl) {
      acl = json.acl;
    } else {
      acl = meta.acl || new Acl();
      if (json.acl) {
        acl.fromJSON(json.acl as JsonMap);
      }
    }

    // keep last known lastModified, createdAt, eTag and headers
    this[METADATA] = {
      ...this[METADATA],
      mimeType: json.mimeType as string,
      lastModified: (json.lastModified && new Date(json.lastModified as string)) || meta.lastModified,
      createdAt: (json.createdAt && new Date(json.createdAt as string)) || meta.createdAt,
      eTag: json.eTag as string || meta.eTag,
      acl,
      size: typeof json.size === 'number' ? json.size : (json as JsonMap).contentLength as number,
      headers: json.headers as {[header: string]: string} || meta.headers || {},
    };
  }

  /**
   * Serialize the file metadata of this object to json
   * @return The serialized file metadata as json
   */
  toJSON(): JsonMap {
    this.checkAvailable();
    const meta = this[METADATA];

    return {
      id: this.id,
      mimeType: meta.mimeType,
      eTag: meta.eTag,
      acl: meta.acl?.toJSON(),
      size: meta.size,
      lastModified: meta.lastModified && (meta.lastModified as Date).toISOString(),
      createdAt: meta.createdAt && (meta.createdAt as Date).toISOString(),
      headers: meta.headers,
    } as JsonMap;
  }

  /**
   * Checks whenever metadata are already loaded of the file, throws an error otherwise
   * @return
   */
  checkAvailable(): void {
    if (!this.isMetadataLoaded) {
      throw new PersistentError(`The file metadata of ${this.id} is not available.`);
    }
  }
}
