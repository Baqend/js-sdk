'use strict';

/* DO NOT TOUCH THIS AUTO-GENERATED FILE */
/* eslint-disable max-len */
import { Message } from "./connector";

/**
 * Get the list of all available subresources
 *
 * @class ListAllResources
 * @extends Message
 *
 */
export const ListAllResources = Message.create({
  method: 'GET',
  path: '/',
  status: [200],
});

/**
 * Get the API version of the Orestes-Server
 *
 * @class ApiVersion
 * @extends Message
 *
 */
export const ApiVersion = Message.create({
  method: 'GET',
  path: '/version',
  status: [200],
});

/**
 * The Swagger specification of the Orestes-Server
 *
 * @class Specification
 * @extends Message
 *
 */
export const Specification = Message.create({
  method: 'GET',
  path: '/spec',
  status: [200],
});

/**
 * Returns all changed objects
 *
 * @class GetBloomFilter
 * @extends Message
 *
 */
export const GetBloomFilter = Message.create({
  method: 'GET',
  path: '/bloomfilter',
  status: [200],
});

/**
 * Clears the Bloom filter (TTLs and stale entries)
 *
 * @class DeleteBloomFilter
 * @extends Message
 *
 */
export const DeleteBloomFilter = Message.create({
  method: 'DELETE',
  path: '/bloomfilter',
  status: [204],
});

/**
 * Get the current Orestes config
 *
 * @class GetOrestesConfig
 * @extends Message
 *
 */
export const GetOrestesConfig = Message.create({
  method: 'GET',
  path: '/config',
  status: [200],
});

/**
 * Updates the current Orestes config
 *
 * @class UpdateOrestesConfig
 * @extends Message
 *
 * @param {json} body The massage Content
 */
export const UpdateOrestesConfig = Message.create({
  method: 'PUT',
  path: '/config',
  status: [200, 202],
});

/**
 * Connects a browser to this server
 *
 * @class Connect
 * @extends Message
 *
 */
export const Connect = Message.create({
  method: 'GET',
  path: '/connect',
  status: [200],
});

/**
 * Gets the status of the server health
 *
 * @class Status
 * @extends Message
 *
 */
export const Status = Message.create({
  method: 'GET',
  path: '/status',
  status: [200],
});

/**
 * Gets the event Endpoint
 *
 * @class EventsUrl
 * @extends Message
 *
 */
export const EventsUrl = Message.create({
  method: 'GET',
  path: '/events-url',
  status: [200],
});

/**
 * Determines whether the IP has exceeded its rate limit
 *
 * @class BannedIp
 * @extends Message
 *
 * @param {string} ip The ip to test
 */
export const BannedIp = Message.create({
  method: 'GET',
  path: '/banned/:ip',
  status: [204],
});

/**
 * Always returns banned status for proper CDN handling
 *
 * @class Banned
 * @extends Message
 *
 */
export const Banned = Message.create({
  method: 'GET',
  path: '/banned',
  status: [],
});

/**
 * Clears all rate-limiting information for all IPs
 *
 * @class Unban
 * @extends Message
 *
 */
export const Unban = Message.create({
  method: 'DELETE',
  path: '/banned',
  status: [204],
});

/**
 * Clears rate-limiting information for given IPs
 *
 * @class UnbanIp
 * @extends Message
 *
 * @param {string} ip The ip to reset
 */
export const UnbanIp = Message.create({
  method: 'DELETE',
  path: '/banned/:ip',
  status: [204],
});

/**
 * List all bucket names
 * List all buckets
 *
 * @class GetBucketNames
 * @extends Message
 *
 */
export const GetBucketNames = Message.create({
  method: 'GET',
  path: '/db',
  status: [200],
});

/**
 * List objects in bucket
 * List all object ids of the given bucket
 *
 * @class GetBucketIds
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {number} start The offset to skip
 * @param {number} count The upper limit to return
 */
export const GetBucketIds = Message.create({
  method: 'GET',
  path: '/db/:bucket/ids?start=0&count=-1',
  status: [200],
});

/**
 * Dump objects of bucket
 * Exports the complete data set of the bucket
 *
 * @class ExportBucket
 * @extends Message
 *
 * @param {string} bucket The bucket name
 */
export const ExportBucket = Message.create({
  method: 'GET',
  path: '/db/:bucket',
  status: [200],
});

/**
 * Upload all objects to the bucket
 * Imports the complete data set. For large uploads, this call will always return the status code 200.
 * If failures occur, they will be returned in the response body.
 *
 * @class ImportBucket
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {json} body The massage Content
 */
export const ImportBucket = Message.create({
  method: 'PUT',
  path: '/db/:bucket',
  status: [200],
});

/**
 * Delete all objects in bucket
 * Delete all objects in the given bucket
 *
 * @class TruncateBucket
 * @extends Message
 *
 * @param {string} bucket The bucket name
 */
export const TruncateBucket = Message.create({
  method: 'DELETE',
  path: '/db/:bucket',
  status: [200],
});

/**
 * Create object
 * Create the given object.
 * The created object will get a unique id.
 *
 * @class CreateObject
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {json} body The massage Content
 */
export const CreateObject = Message.create({
  method: 'POST',
  path: '/db/:bucket',
  status: [201, 202],
});

/**
 * Get object
 * Returns the specified object. Each object has one unique identifier and therefore only one URL.
 *
 * @class GetObject
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique object identifier
 */
export const GetObject = Message.create({
  method: 'GET',
  path: '/db/:bucket/:oid',
  status: [200, 304],
});

/**
 * Replace object
 * Replace the current object with the updated one.
 * To update a specific version of the object a version can be provided in the If-Match header.
 * The update will only be accepted, if the current version matches the provided one, otherwise the update
 * will be rejected.
 * The * wildcard matches any existing object but prevents an insertion if the object does not exist.
 *
 * @class ReplaceObject
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique object identifier
 * @param {json} body The massage Content
 */
export const ReplaceObject = Message.create({
  method: 'PUT',
  path: '/db/:bucket/:oid',
  status: [200, 202],
});

/**
 * Delete object
 * Deletes the object. The If-Match Header can be used to specify an expected version. The object will
 * only be deleted if the version matches the provided one. The * wildcard can be used to match any existing
 * version but results in an error if the object does not exist.
 *
 * @class DeleteObject
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique object identifier
 */
export const DeleteObject = Message.create({
  method: 'DELETE',
  path: '/db/:bucket/:oid',
  status: [202, 204],
});

/**
 * Get all available class schemas
 * Gets the complete schema
 *
 * @class GetAllSchemas
 * @extends Message
 *
 */
export const GetAllSchemas = Message.create({
  method: 'GET',
  path: '/schema',
  status: [200],
});

/**
 * Create new class schemas and update existing class schemas
 * Updates the complete schema, merge all changes, reject the schema update if the schema changes aren't compatible
 *
 * @class UpdateAllSchemas
 * @extends Message
 *
 * @param {json} body The massage Content
 */
export const UpdateAllSchemas = Message.create({
  method: 'POST',
  path: '/schema',
  status: [200],
});

/**
 * Replace all currently created schemas with the new ones
 * Replace the complete schema, with the new one.
 *
 * @class ReplaceAllSchemas
 * @extends Message
 *
 * @param {json} body The massage Content
 */
export const ReplaceAllSchemas = Message.create({
  method: 'PUT',
  path: '/schema',
  status: [200],
});

/**
 * Get the class schema
 * Returns the schema definition of the class
 * The class definition contains a link to its parent class and all persistable fields with there types of the class
 *
 * @class GetSchema
 * @extends Message
 *
 * @param {string} bucket The bucket name
 */
export const GetSchema = Message.create({
  method: 'GET',
  path: '/schema/:bucket',
  status: [200],
});

/**
 * Update the class schema
 * Modify the schema definition of the class by adding all missing fields
 *
 * @class UpdateSchema
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {json} body The massage Content
 */
export const UpdateSchema = Message.create({
  method: 'POST',
  path: '/schema/:bucket',
  status: [200],
});

/**
 * Replace the class schema
 * Replace the schema definition of the class
 *
 * @class ReplaceSchema
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {json} body The massage Content
 */
export const ReplaceSchema = Message.create({
  method: 'PUT',
  path: '/schema/:bucket',
  status: [200],
});

/**
 * Delete the class schema
 * Delete the schema definition of the class
 *
 * @class DeleteSchema
 * @extends Message
 *
 * @param {string} bucket The bucket name
 */
export const DeleteSchema = Message.create({
  method: 'DELETE',
  path: '/schema/:bucket',
  status: [204],
});

/**
 * Executes a basic ad-hoc query
 * Executes the given query and returns a list of matching objects.
 *
 * @class AdhocQuery
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} q The query
 * @param {boolean} eager indicates if the query result should be sent back as ids or as objects
 * @param {boolean} hinted indicates whether the query should be cached even when capacity limit is reached
 * @param {number} start The offset to start from
 * @param {number} count The number of objects to list
 * @param {string} sort The sort object
 */
export const AdhocQuery = Message.create({
  method: 'GET',
  path: '/db/:bucket/query?q&start=0&count=-1&sort=&eager=&hinted=',
  status: [200],
});

/**
 * Executes a basic ad-hoc query
 * Executes the given query and returns a list of matching objects.
 *
 * @class AdhocQueryPOST
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {number} start The offset to start from
 * @param {number} count The number of objects to list
 * @param {string} sort The sort object
 * @param {string} body The massage Content
 */
export const AdhocQueryPOST = Message.create({
  method: 'POST',
  path: '/db/:bucket/query?start=0&count=-1&sort=',
  status: [200],
});

/**
 * Executes a count query
 * Executes the given query and returns the number of objects that match the query
 *
 * @class AdhocCountQuery
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} q The query
 */
export const AdhocCountQuery = Message.create({
  method: 'GET',
  path: '/db/:bucket/count?q',
  status: [200],
});

/**
 * Executes a count query
 * Executes the given query and returns the number of objects that match the query
 *
 * @class AdhocCountQueryPOST
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} body The massage Content
 */
export const AdhocCountQueryPOST = Message.create({
  method: 'POST',
  path: '/db/:bucket/count',
  status: [200],
});

/**
 * List all Query subresources
 *
 * @class ListQueryResources
 * @extends Message
 *
 */
export const ListQueryResources = Message.create({
  method: 'GET',
  path: '/query',
  status: [200],
});

/**
 * Creates a prepared query
 *
 * @class CreateQuery
 * @extends Message
 *
 * @param {json} body The massage Content
 */
export const CreateQuery = Message.create({
  method: 'POST',
  path: '/query',
  status: [201],
});

/**
 * List all subresources of a query
 *
 * @class ListThisQueryResources
 * @extends Message
 *
 * @param {string} qid The query id
 */
export const ListThisQueryResources = Message.create({
  method: 'GET',
  path: '/query/:qid',
  status: [200],
});

/**
 * Get the query string
 *
 * @class GetQueryCode
 * @extends Message
 *
 * @param {string} qid The query id
 */
export const GetQueryCode = Message.create({
  method: 'GET',
  path: '/query/:qid/source',
  status: [200],
});

/**
 * Executes a prepared query
 *
 * @class RunQuery
 * @extends Message
 *
 * @param {number} start The offset from where to start from
 * @param {number} count The number of objects to enlist
 * @param {string} qid The query id
 */
export const RunQuery = Message.create({
  method: 'GET',
  path: '/query/:qid/result?start=0&count=-1',
  status: [200],
});

/**
 * Get the declared query parameters
 *
 * @class GetQueryParameters
 * @extends Message
 *
 * @param {string} qid The query id
 */
export const GetQueryParameters = Message.create({
  method: 'GET',
  path: '/query/:qid/parameters',
  status: [200],
});

/**
 * Starts a new Transaction
 *
 * @class NewTransaction
 * @extends Message
 *
 */
export const NewTransaction = Message.create({
  method: 'POST',
  path: '/transaction',
  status: [201],
});

/**
 * Commits the transaction
 * If the transaction can be completed a list of all changed objects with their updated versions are returned.
 *
 * @class CommitTransaction
 * @extends Message
 *
 * @param {string} tid The transaction id
 * @param {json} body The massage Content
 */
export const CommitTransaction = Message.create({
  method: 'PUT',
  path: '/transaction/:tid/committed',
  status: [200],
});

/**
 * Update the object
 * Executes the partial updates on the object.
 * To update an object an explicit version must be provided in the If-Match header.
 * If the version is not equal to the current object version the update will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the update will always be applied.
 *
 * @class UpdatePartially
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique object identifier
 * @param {json} body The massage Content
 */
export const UpdatePartially = Message.create({
  method: 'POST',
  path: '/db/:bucket/:oid',
  status: [200],
});

/**
 * Update the object field
 * Executes the partial update on a object field.
 * To update an object an explicit version must be provided in the If-Match header.
 * If the version is not equal to the current object version the update will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the update will always be applied.
 *
 * @class UpdateField
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} field The field name
 * @param {string} oid The unique object identifier
 * @param {json} body The massage Content
 */
export const UpdateField = Message.create({
  method: 'POST',
  path: '/db/:bucket/:oid/:field',
  status: [200],
});

/**
 * Method to login a user
 * Log in a user by it's credentials
 *
 * @class Login
 * @extends Message
 *
 * @param {json} body The massage Content
 */
export const Login = Message.create({
  method: 'POST',
  path: '/db/User/login',
  status: [200],
});

/**
 * Method to register a user
 * Register and creates a new user
 *
 * @class Register
 * @extends Message
 *
 * @param {json} body The massage Content
 */
export const Register = Message.create({
  method: 'POST',
  path: '/db/User/register',
  status: [200, 204],
});

/**
 * Method to load the current user object
 * Gets the user object of the currently logged in user
 *
 * @class Me
 * @extends Message
 *
 */
export const Me = Message.create({
  method: 'GET',
  path: '/db/User/me',
  status: [200],
});

/**
 * Method to validate a user token
 * Validates if a given token is still valid
 *
 * @class ValidateUser
 * @extends Message
 *
 */
export const ValidateUser = Message.create({
  method: 'GET',
  path: '/db/User/validate',
  status: [200],
});

/**
 * Method to remove token cookie
 * Log out a user by removing the cookie token
 *
 * @class Logout
 * @extends Message
 *
 */
export const Logout = Message.create({
  method: 'GET',
  path: '/db/User/logout',
  status: [204],
});

/**
 * Method to change the password
 *
 * @class NewPassword
 * @extends Message
 *
 * @param {json} body The massage Content
 */
export const NewPassword = Message.create({
  method: 'POST',
  path: '/db/User/password',
  status: [200],
});

/**
 * Method to request a new password
 *
 * @class ResetPassword
 * @extends Message
 *
 * @param {json} body The massage Content
 */
export const ResetPassword = Message.create({
  method: 'POST',
  path: '/db/User/reset',
  status: [200],
});

/**
 * Method to verify user by a given token
 *
 * @class Verify
 * @extends Message
 *
 * @param {string} token Token to verify the user
 */
export const Verify = Message.create({
  method: 'GET',
  path: '/db/User/verify?token=',
  status: [204],
});

/**
 * Method to request a change of the username
 *
 * @class ChangeUsername
 * @extends Message
 *
 * @param {json} body The massage Content
 */
export const ChangeUsername = Message.create({
  method: 'POST',
  path: '/db/User/changeUsername',
  status: [204],
});

/**
 * Method to verify a username by a given token
 *
 * @class VerifyUsername
 * @extends Message
 *
 * @param {string} token Token to verify the user
 */
export const VerifyUsername = Message.create({
  method: 'GET',
  path: '/db/User/verifyUsername?token=',
  status: [204],
});

/**
 * Method to register or login using an OAuth provider.
 * This resource is should be invoked by the provider with a redirect after the user granted permission.
 *
 * @class OAuth2
 * @extends Message
 *
 * @param {string} oauth_verifier OAuth 1.0 code
 * @param {string} code The code written by the provider
 * @param {string} provider The OAuth provider
 * @param {string} oauth_token OAuth 1.0 identifier
 * @param {string} error_description The error description of the oauth provider
 * @param {string} state Additional form encoded state. Can contain an optional redirect (url) that will be called after login with the user token attached as query parameter.
 */
export const OAuth2 = Message.create({
  method: 'GET',
  path: '/db/User/OAuth/:provider?state=&code=&oauth_verifier=&oauth_token=&error_description=',
  status: [200],
});

/**
 * Method to invoke a OAuth-1.0 login/register
 * The resource requests a request-token and redirects the user to the provider page to log-in and grant permission for
 * your application.
 *
 * @class OAuth1
 * @extends Message
 *
 * @param {string} provider The OAuth provider
 */
export const OAuth1 = Message.create({
  method: 'GET',
  path: '/db/User/OAuth1/:provider',
  status: [200],
});

/**
 * Generate a token without lifetime
 * Method to generate a token without lifetime
 *
 * @class UserToken
 * @extends Message
 *
 * @param {string} oid The unique object identifier
 */
export const UserToken = Message.create({
  method: 'POST',
  path: '/db/User/:oid/token',
  status: [200],
});

/**
 * Revoke all tokens
 * Method to revoke all previously created tokens
 *
 * @class RevokeUserToken
 * @extends Message
 *
 * @param {string} oid The unique object identifier
 */
export const RevokeUserToken = Message.create({
  method: 'DELETE',
  path: '/db/User/:oid/token',
  status: [204],
});

/**
 * Gets the code of the the given bucket and type
 *
 * @class GetBaqendCode
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} type The type of the script
 */
export const GetBaqendCode = Message.create({
  method: 'GET',
  path: '/code/:bucket/:type',
  status: [200],
});

/**
 * Sets the code of the bucket and type
 *
 * @class SetBaqendCode
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} type The type of the script
 * @param {string} body The massage Content
 */
export const SetBaqendCode = Message.create({
  method: 'PUT',
  path: '/code/:bucket/:type',
  status: [200, 202],
});

/**
 * Delete the code of the given bucket and type
 *
 * @class DeleteBaqendCode
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} type The type of the script
 */
export const DeleteBaqendCode = Message.create({
  method: 'DELETE',
  path: '/code/:bucket/:type',
  status: [202, 204],
});

/**
 * Calls the module of the specific bucket
 *
 * @class PostBaqendModule
 * @extends Message
 *
 * @param {string} bucket The method name
 */
export const PostBaqendModule = Message.create({
  method: 'POST',
  path: '/code/:bucket',
  status: [200, 204],
});

/**
 * Calls the module of the specific bucket
 *
 * @class GetBaqendModule
 * @extends Message
 *
 * @param {string} bucket The module name
 */
export const GetBaqendModule = Message.create({
  method: 'GET',
  path: '/code/:bucket',
  status: [200, 204],
});

/**
 * List all available modules
 *
 * @class GetAllModules
 * @extends Message
 *
 */
export const GetAllModules = Message.create({
  method: 'GET',
  path: '/code',
  status: [200],
});

/**
 * Get all file ID's in the given folder
 * Retrieve meta-information about all accessible Files and folders in a specified folder.
 *
 * @class ListFiles
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} path The folder to list
 * @param {boolean} deep If true, files of subdirectories are returned as well
 * @param {string} start The file/folder name from where to start listing
 * @param {number} count The upper limit to return, -1 is equal to the upper limit of 1000
 */
export const ListFiles = Message.create({
  method: 'GET',
  path: '/file/:bucket/ids?path=/&start=&count=-1&deep=false',
  status: [200],
});

/**
 * Get all buckets
 * Gets all buckets.
 *
 * @class ListBuckets
 * @extends Message
 *
 */
export const ListBuckets = Message.create({
  method: 'GET',
  path: '/file/buckets',
  status: [200],
});

/**
 * Download a bucket archive
 * Downloads an archive containing the bucket contents.
 *
 * @class DownloadArchive
 * @extends Message
 *
 * @param {string} archive The archive file name
 */
export const DownloadArchive = Message.create({
  method: 'GET',
  path: '/file',
  status: [200],
});

/**
 * Upload a patch bucket archive
 * Uploads an archive; files contained within that archive will be replaced within the bucket.
 *
 * @class UploadPatchArchive
 * @extends Message
 *
 * @param {string} archive The archive file name
 * @param {string} body The massage Content
 */
export const UploadPatchArchive = Message.create({
  method: 'POST',
  path: '/file',
  status: [200],
});

/**
 * Retrieve the bucket Metadata
 * The bucket metadata object contains the bucketAcl.
 *
 * @class GetFileBucketMetadata
 * @extends Message
 *
 * @param {string} bucket The bucket name
 */
export const GetFileBucketMetadata = Message.create({
  method: 'GET',
  path: '/file/:bucket',
  status: [200],
});

/**
 * Set the Bucket Metadata
 * Creates or replaces the bucket Metadata to control permission access to all included Files.
 *
 * @class SetFileBucketMetadata
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {json} body The massage Content
 */
export const SetFileBucketMetadata = Message.create({
  method: 'PUT',
  path: '/file/:bucket',
  status: [204],
});

/**
 * Delete all files of a file Bucket
 * Deletes the bucket and all its content.
 *
 * @class DeleteFileBucket
 * @extends Message
 *
 * @param {string} bucket The bucket name
 */
export const DeleteFileBucket = Message.create({
  method: 'DELETE',
  path: '/file/:bucket',
  status: [204],
});

/**
 * Creates a new file with a random UUID
 * Creates a file with a random ID, only Insert permissions are required.
 *
 * @class CreateFile
 * @extends Message
 *
 * @param {string} bucket The bucket name
 */
export const CreateFile = Message.create({
  method: 'POST',
  path: '/file/:bucket',
  status: [200],
});

/**
 * Download a file
 * Downloads a file by its ID.
 *
 * @class DownloadFile
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique object identifier
 */
export const DownloadFile = Message.create({
  method: 'GET',
  path: '/file/:bucket/*oid',
  status: [200, 304],
});

/**
 * Upload a new file
 * Uploads and replace an existing file with a new one.
 * The If-Match or If-Unmodified-Since header can be used to make a conditional update
 *
 * @class UploadFile
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique file identifier
 */
export const UploadFile = Message.create({
  method: 'PUT',
  path: '/file/:bucket/*oid',
  status: [200],
});

/**
 * Get the file metadata
 * Gets the file Acl and metadata.
 *
 * @class GetFileMetadata
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique object identifier
 */
export const GetFileMetadata = Message.create({
  method: 'HEAD',
  path: '/file/:bucket/*oid',
  status: [200],
});

/**
 * Update File Metadata
 * Updates the file Metadata.
 *
 * @class UpdateFileMetadata
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique object identifier
 * @param {json} body The massage Content
 */
export const UpdateFileMetadata = Message.create({
  method: 'POST',
  path: '/file/:bucket/*oid',
  status: [200],
});

/**
 * Delete a file
 * Deletes a file or a folder with all its contents.
 * The If-Match or If-Unmodified-Since header can be used to make a conditional deletion
 *
 * @class DeleteFile
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique file identifier
 */
export const DeleteFile = Message.create({
  method: 'DELETE',
  path: '/file/:bucket/*oid',
  status: [200, 204],
});

/**
 * Creates the manifest
 * Creates the manifest with the given data
 *
 * @class CreateManifest
 * @extends Message
 *
 * @param {json} body The massage Content
 */
export const CreateManifest = Message.create({
  method: 'POST',
  path: '/pwa/manifest',
  status: [202],
});

/**
 * Downloads (and clones) an external asset
 * Downloads an external file.
 *
 * @class DownloadAsset
 * @extends Message
 *
 * @param {string} url The url of the external asset to download
 */
export const DownloadAsset = Message.create({
  method: 'GET',
  path: '/asset/*url',
  status: [200, 304],
});

/**
 * Checks and purges assets
 * Checks and purges assets for the SpeedKit.
 *
 * @class RevalidateAssets
 * @extends Message
 *
 * @param {json} body The massage Content
 */
export const RevalidateAssets = Message.create({
  method: 'POST',
  path: '/asset/revalidate',
  status: [202],
});

/**
 * Gets the status
 * Get the current status of the revalidation
 *
 * @class GetRevalidationStatus
 * @extends Message
 *
 * @param {string} id The status id
 */
export const GetRevalidationStatus = Message.create({
  method: 'GET',
  path: '/asset/revalidate/:id',
  status: [200, 202],
});

/**
 * List bucket indexes
 * List all indexes of the given bucket
 *
 * @class ListIndexes
 * @extends Message
 *
 * @param {string} bucket The bucket name
 */
export const ListIndexes = Message.create({
  method: 'GET',
  path: '/index/:bucket',
  status: [200],
});

/**
 * Create or drop bucket index
 * Create or drop a index for the given bucket
 *
 * @class CreateDropIndex
 * @extends Message
 *
 * @param {string} bucket The bucket name
 * @param {json} body The massage Content
 */
export const CreateDropIndex = Message.create({
  method: 'POST',
  path: '/index/:bucket',
  status: [202],
});

/**
 * Drop all indexes
 * Drop all indexes on the given bucket
 *
 * @class DropAllIndexes
 * @extends Message
 *
 * @param {string} bucket The bucket name
 */
export const DropAllIndexes = Message.create({
  method: 'DELETE',
  path: '/index/:bucket',
  status: [202],
});

/**
 * Method to register a new device
 * Registers a new devices
 *
 * @class DeviceRegister
 * @extends Message
 *
 * @param {json} body The massage Content
 */
export const DeviceRegister = Message.create({
  method: 'POST',
  path: '/db/Device/register',
  status: [200],
});

/**
 * Method to push a message to devices
 * Pushes a message to devices
 *
 * @class DevicePush
 * @extends Message
 *
 * @param {json} body The massage Content
 */
export const DevicePush = Message.create({
  method: 'POST',
  path: '/db/Device/push',
  status: [204],
});

/**
 * Check if device is registered
 * Checks if the device is already registered
 *
 * @class DeviceRegistered
 * @extends Message
 *
 */
export const DeviceRegistered = Message.create({
  method: 'GET',
  path: '/db/Device/registered',
  status: [200],
});

/**
 * Generate VAPID Keys
 * Generate VAPID Keys for web push
 *
 * @class VAPIDKeys
 * @extends Message
 *
 */
export const VAPIDKeys = Message.create({
  method: 'POST',
  path: '/config/VAPIDKeys',
  status: [200],
});

/**
 * Get VAPID Public Key
 * Get VAPID Public Key for web push
 *
 * @class VAPIDPublicKey
 * @extends Message
 *
 */
export const VAPIDPublicKey = Message.create({
  method: 'GET',
  path: '/config/VAPIDPublicKey',
  status: [200],
});

/**
 * Set GCM-API-Key
 * Sets the GCM/FCM API-Key for Android Push
 *
 * @class GCMAKey
 * @extends Message
 *
 * @param {string} body The massage Content
 */
export const GCMAKey = Message.create({
  method: 'POST',
  path: '/config/GCMKey',
  status: [204],
});

/**
 * Upload APNS certificate
 * Upload APNS certificate for IOS Push
 *
 * @class UploadAPNSCertificate
 * @extends Message
 *
 */
export const UploadAPNSCertificate = Message.create({
  method: 'POST',
  path: '/config/APNSCert',
  status: [204],
});

