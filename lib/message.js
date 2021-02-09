'use strict';

/* DO NOT TOUCH THIS AUTO-GENERATED FILE */
/* eslint-disable max-len */
const Message = require('./connector/Message');

/**
 * Get the list of all available subresources
 *
 * @class message.ListAllResources
 * @extends connector.Message
 *
 */
exports.ListAllResources = Message.create({
  method: 'GET',
  path: '/',
  status: [200],
});

/**
 * Get the API version of the Orestes-Server
 *
 * @class message.ApiVersion
 * @extends connector.Message
 *
 */
exports.ApiVersion = Message.create({
  method: 'GET',
  path: '/version',
  status: [200],
});

/**
 * The Swagger specification of the Orestes-Server
 *
 * @class message.Specification
 * @extends connector.Message
 *
 */
exports.Specification = Message.create({
  method: 'GET',
  path: '/spec',
  status: [200],
});

/**
 * Returns all changed objects
 *
 * @class message.GetBloomFilter
 * @extends connector.Message
 *
 */
exports.GetBloomFilter = Message.create({
  method: 'GET',
  path: '/bloomfilter',
  status: [200],
});

/**
 * Clears the Bloom filter (TTLs and stale entries)
 *
 * @class message.DeleteBloomFilter
 * @extends connector.Message
 *
 */
exports.DeleteBloomFilter = Message.create({
  method: 'DELETE',
  path: '/bloomfilter',
  status: [204],
});

/**
 * Get the current Orestes config
 *
 * @class message.GetOrestesConfig
 * @extends connector.Message
 *
 */
exports.GetOrestesConfig = Message.create({
  method: 'GET',
  path: '/config',
  status: [200],
});

/**
 * Updates the current Orestes config
 *
 * @class message.UpdateOrestesConfig
 * @extends connector.Message
 *
 * @param {json} body The massage Content
 */
exports.UpdateOrestesConfig = Message.create({
  method: 'PUT',
  path: '/config',
  status: [200, 202],
});

/**
 * Connects a browser to this server
 *
 * @class message.Connect
 * @extends connector.Message
 *
 */
exports.Connect = Message.create({
  method: 'GET',
  path: '/connect',
  status: [200],
});

/**
 * Gets the status of the server health
 *
 * @class message.Status
 * @extends connector.Message
 *
 */
exports.Status = Message.create({
  method: 'GET',
  path: '/status',
  status: [200],
});

/**
 * Gets the event Endpoint
 *
 * @class message.EventsUrl
 * @extends connector.Message
 *
 */
exports.EventsUrl = Message.create({
  method: 'GET',
  path: '/events-url',
  status: [200],
});

/**
 * Determines whether the IP has exceeded its rate limit
 *
 * @class message.BannedIp
 * @extends connector.Message
 *
 * @param {string} ip The ip to test
 */
exports.BannedIp = Message.create({
  method: 'GET',
  path: '/banned/:ip',
  status: [204],
});

/**
 * Always returns banned status for proper CDN handling
 *
 * @class message.Banned
 * @extends connector.Message
 *
 */
exports.Banned = Message.create({
  method: 'GET',
  path: '/banned',
  status: [],
});

/**
 * Clears all rate-limiting information for all IPs
 *
 * @class message.Unban
 * @extends connector.Message
 *
 */
exports.Unban = Message.create({
  method: 'DELETE',
  path: '/banned',
  status: [204],
});

/**
 * Clears rate-limiting information for given IPs
 *
 * @class message.UnbanIp
 * @extends connector.Message
 *
 * @param {string} ip The ip to reset
 */
exports.UnbanIp = Message.create({
  method: 'DELETE',
  path: '/banned/:ip',
  status: [204],
});

/**
 * List all bucket names
 * List all buckets
 *
 * @class message.GetBucketNames
 * @extends connector.Message
 *
 */
exports.GetBucketNames = Message.create({
  method: 'GET',
  path: '/db',
  status: [200],
});

/**
 * List objects in bucket
 * List all object ids of the given bucket
 *
 * @class message.GetBucketIds
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {number} start The offset to skip
 * @param {number} count The upper limit to return
 */
exports.GetBucketIds = Message.create({
  method: 'GET',
  path: '/db/:bucket/ids?start=0&count=-1',
  status: [200],
});

/**
 * Dump objects of bucket
 * Exports the complete data set of the bucket
 *
 * @class message.ExportBucket
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 */
exports.ExportBucket = Message.create({
  method: 'GET',
  path: '/db/:bucket',
  status: [200],
});

/**
 * Upload all objects to the bucket
 * Imports the complete data set. For large uploads, this call will always return the status code 200.
 * If failures occur, they will be returned in the response body.
 *
 * @class message.ImportBucket
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {json} body The massage Content
 */
exports.ImportBucket = Message.create({
  method: 'PUT',
  path: '/db/:bucket',
  status: [200],
});

/**
 * Delete all objects in bucket
 * Delete all objects in the given bucket
 *
 * @class message.TruncateBucket
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 */
exports.TruncateBucket = Message.create({
  method: 'DELETE',
  path: '/db/:bucket',
  status: [200],
});

/**
 * Create object
 * Create the given object.
 * The created object will get a unique id.
 *
 * @class message.CreateObject
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {json} body The massage Content
 */
exports.CreateObject = Message.create({
  method: 'POST',
  path: '/db/:bucket',
  status: [201, 202],
});

/**
 * Get object
 * Returns the specified object. Each object has one unique identifier and therefore only one URL.
 *
 * @class message.GetObject
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique object identifier
 */
exports.GetObject = Message.create({
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
 * @class message.ReplaceObject
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique object identifier
 * @param {json} body The massage Content
 */
exports.ReplaceObject = Message.create({
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
 * @class message.DeleteObject
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique object identifier
 */
exports.DeleteObject = Message.create({
  method: 'DELETE',
  path: '/db/:bucket/:oid',
  status: [202, 204],
});

/**
 * Get all available class schemas
 * Gets the complete schema
 *
 * @class message.GetAllSchemas
 * @extends connector.Message
 *
 */
exports.GetAllSchemas = Message.create({
  method: 'GET',
  path: '/schema',
  status: [200],
});

/**
 * Create new class schemas and update existing class schemas
 * Updates the complete schema, merge all changes, reject the schema update if the schema changes aren't compatible
 *
 * @class message.UpdateAllSchemas
 * @extends connector.Message
 *
 * @param {json} body The massage Content
 */
exports.UpdateAllSchemas = Message.create({
  method: 'POST',
  path: '/schema',
  status: [200],
});

/**
 * Replace all currently created schemas with the new ones
 * Replace the complete schema, with the new one.
 *
 * @class message.ReplaceAllSchemas
 * @extends connector.Message
 *
 * @param {json} body The massage Content
 */
exports.ReplaceAllSchemas = Message.create({
  method: 'PUT',
  path: '/schema',
  status: [200],
});

/**
 * Get the class schema
 * Returns the schema definition of the class
 * The class definition contains a link to its parent class and all persistable fields with there types of the class
 *
 * @class message.GetSchema
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 */
exports.GetSchema = Message.create({
  method: 'GET',
  path: '/schema/:bucket',
  status: [200],
});

/**
 * Update the class schema
 * Modify the schema definition of the class by adding all missing fields
 *
 * @class message.UpdateSchema
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {json} body The massage Content
 */
exports.UpdateSchema = Message.create({
  method: 'POST',
  path: '/schema/:bucket',
  status: [200],
});

/**
 * Replace the class schema
 * Replace the schema definition of the class
 *
 * @class message.ReplaceSchema
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {json} body The massage Content
 */
exports.ReplaceSchema = Message.create({
  method: 'PUT',
  path: '/schema/:bucket',
  status: [200],
});

/**
 * Delete the class schema
 * Delete the schema definition of the class
 *
 * @class message.DeleteSchema
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 */
exports.DeleteSchema = Message.create({
  method: 'DELETE',
  path: '/schema/:bucket',
  status: [204],
});

/**
 * Executes a basic ad-hoc query
 * Executes the given query and returns a list of matching objects.
 *
 * @class message.AdhocQuery
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} q The query
 * @param {boolean} eager indicates if the query result should be sent back as ids or as objects
 * @param {boolean} hinted indicates whether the query should be cached even when capacity limit is reached
 * @param {number} start The offset to start from
 * @param {number} count The number of objects to list
 * @param {string} sort The sort object
 */
exports.AdhocQuery = Message.create({
  method: 'GET',
  path: '/db/:bucket/query?q&start=0&count=-1&sort=&eager=&hinted=',
  status: [200],
});

/**
 * Executes a basic ad-hoc query
 * Executes the given query and returns a list of matching objects.
 *
 * @class message.AdhocQueryPOST
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {number} start The offset to start from
 * @param {number} count The number of objects to list
 * @param {string} sort The sort object
 * @param {string} body The massage Content
 */
exports.AdhocQueryPOST = Message.create({
  method: 'POST',
  path: '/db/:bucket/query?start=0&count=-1&sort=',
  status: [200],
});

/**
 * Executes a count query
 * Executes the given query and returns the number of objects that match the query
 *
 * @class message.AdhocCountQuery
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} q The query
 */
exports.AdhocCountQuery = Message.create({
  method: 'GET',
  path: '/db/:bucket/count?q',
  status: [200],
});

/**
 * Executes a count query
 * Executes the given query and returns the number of objects that match the query
 *
 * @class message.AdhocCountQueryPOST
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} body The massage Content
 */
exports.AdhocCountQueryPOST = Message.create({
  method: 'POST',
  path: '/db/:bucket/count',
  status: [200],
});

/**
 * List all Query subresources
 *
 * @class message.ListQueryResources
 * @extends connector.Message
 *
 */
exports.ListQueryResources = Message.create({
  method: 'GET',
  path: '/query',
  status: [200],
});

/**
 * Creates a prepared query
 *
 * @class message.CreateQuery
 * @extends connector.Message
 *
 * @param {json} body The massage Content
 */
exports.CreateQuery = Message.create({
  method: 'POST',
  path: '/query',
  status: [201],
});

/**
 * List all subresources of a query
 *
 * @class message.ListThisQueryResources
 * @extends connector.Message
 *
 * @param {string} qid The query id
 */
exports.ListThisQueryResources = Message.create({
  method: 'GET',
  path: '/query/:qid',
  status: [200],
});

/**
 * Get the query string
 *
 * @class message.GetQueryCode
 * @extends connector.Message
 *
 * @param {string} qid The query id
 */
exports.GetQueryCode = Message.create({
  method: 'GET',
  path: '/query/:qid/source',
  status: [200],
});

/**
 * Executes a prepared query
 *
 * @class message.RunQuery
 * @extends connector.Message
 *
 * @param {number} start The offset from where to start from
 * @param {number} count The number of objects to enlist
 * @param {string} qid The query id
 */
exports.RunQuery = Message.create({
  method: 'GET',
  path: '/query/:qid/result?start=0&count=-1',
  status: [200],
});

/**
 * Get the declared query parameters
 *
 * @class message.GetQueryParameters
 * @extends connector.Message
 *
 * @param {string} qid The query id
 */
exports.GetQueryParameters = Message.create({
  method: 'GET',
  path: '/query/:qid/parameters',
  status: [200],
});

/**
 * Starts a new Transaction
 *
 * @class message.NewTransaction
 * @extends connector.Message
 *
 */
exports.NewTransaction = Message.create({
  method: 'POST',
  path: '/transaction',
  status: [201],
});

/**
 * Commits the transaction
 * If the transaction can be completed a list of all changed objects with their updated versions are returned.
 *
 * @class message.CommitTransaction
 * @extends connector.Message
 *
 * @param {string} tid The transaction id
 * @param {json} body The massage Content
 */
exports.CommitTransaction = Message.create({
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
 * @class message.UpdatePartially
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique object identifier
 * @param {json} body The massage Content
 */
exports.UpdatePartially = Message.create({
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
 * @class message.UpdateField
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} field The field name
 * @param {string} oid The unique object identifier
 * @param {json} body The massage Content
 */
exports.UpdateField = Message.create({
  method: 'POST',
  path: '/db/:bucket/:oid/:field',
  status: [200],
});

/**
 * Method to login a user
 * Log in a user by it's credentials
 *
 * @class message.Login
 * @extends connector.Message
 *
 * @param {json} body The massage Content
 */
exports.Login = Message.create({
  method: 'POST',
  path: '/db/User/login',
  status: [200],
});

/**
 * Method to register a user
 * Register and creates a new user
 *
 * @class message.Register
 * @extends connector.Message
 *
 * @param {json} body The massage Content
 */
exports.Register = Message.create({
  method: 'POST',
  path: '/db/User/register',
  status: [200, 204],
});

/**
 * Method to load the current user object
 * Gets the user object of the currently logged in user
 *
 * @class message.Me
 * @extends connector.Message
 *
 */
exports.Me = Message.create({
  method: 'GET',
  path: '/db/User/me',
  status: [200],
});

/**
 * Method to validate a user token
 * Validates if a given token is still valid
 *
 * @class message.ValidateUser
 * @extends connector.Message
 *
 */
exports.ValidateUser = Message.create({
  method: 'GET',
  path: '/db/User/validate',
  status: [200],
});

/**
 * Method to remove token cookie
 * Log out a user by removing the cookie token
 *
 * @class message.Logout
 * @extends connector.Message
 *
 */
exports.Logout = Message.create({
  method: 'GET',
  path: '/db/User/logout',
  status: [204],
});

/**
 * Method to change the password
 *
 * @class message.NewPassword
 * @extends connector.Message
 *
 * @param {json} body The massage Content
 */
exports.NewPassword = Message.create({
  method: 'POST',
  path: '/db/User/password',
  status: [200],
});

/**
 * Method to request a new password
 *
 * @class message.ResetPassword
 * @extends connector.Message
 *
 * @param {json} body The massage Content
 */
exports.ResetPassword = Message.create({
  method: 'POST',
  path: '/db/User/reset',
  status: [200],
});

/**
 * Method to verify user by a given token
 *
 * @class message.Verify
 * @extends connector.Message
 *
 * @param {string} token Token to verify the user
 */
exports.Verify = Message.create({
  method: 'GET',
  path: '/db/User/verify?token=',
  status: [204],
});

/**
 * Method to request a change of the username
 *
 * @class message.ChangeUsername
 * @extends connector.Message
 *
 * @param {json} body The massage Content
 */
exports.ChangeUsername = Message.create({
  method: 'POST',
  path: '/db/User/changeUsername',
  status: [204],
});

/**
 * Method to verify a username by a given token
 *
 * @class message.VerifyUsername
 * @extends connector.Message
 *
 * @param {string} token Token to verify the user
 */
exports.VerifyUsername = Message.create({
  method: 'GET',
  path: '/db/User/verifyUsername?token=',
  status: [204],
});

/**
 * Method to register or login using an OAuth provider.
 * This resource is should be invoked by the provider with a redirect after the user granted permission.
 *
 * @class message.OAuth2
 * @extends connector.Message
 *
 * @param {string} oauth_verifier OAuth 1.0 code
 * @param {string} code The code written by the provider
 * @param {string} provider The OAuth provider
 * @param {string} oauth_token OAuth 1.0 identifier
 * @param {string} error_description The error description of the oauth provider
 * @param {string} state Additional form encoded state. Can contain an optional redirect (url) that will be called after login with the user token attached as query parameter.
 */
exports.OAuth2 = Message.create({
  method: 'GET',
  path: '/db/User/OAuth/:provider?state=&code=&oauth_verifier=&oauth_token=&error_description=',
  status: [200],
});

/**
 * Method to invoke a OAuth-1.0 login/register
 * The resource requests a request-token and redirects the user to the provider page to log-in and grant permission for
 * your application.
 *
 * @class message.OAuth1
 * @extends connector.Message
 *
 * @param {string} provider The OAuth provider
 */
exports.OAuth1 = Message.create({
  method: 'GET',
  path: '/db/User/OAuth1/:provider',
  status: [200],
});

/**
 * Generate a token without lifetime
 * Method to generate a token without lifetime
 *
 * @class message.UserToken
 * @extends connector.Message
 *
 * @param {string} oid The unique object identifier
 */
exports.UserToken = Message.create({
  method: 'POST',
  path: '/db/User/:oid/token',
  status: [200],
});

/**
 * Revoke all tokens
 * Method to revoke all previously created tokens
 *
 * @class message.RevokeUserToken
 * @extends connector.Message
 *
 * @param {string} oid The unique object identifier
 */
exports.RevokeUserToken = Message.create({
  method: 'DELETE',
  path: '/db/User/:oid/token',
  status: [204],
});

/**
 * Gets the code of the the given bucket and type
 *
 * @class message.GetBaqendCode
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} type The type of the script
 */
exports.GetBaqendCode = Message.create({
  method: 'GET',
  path: '/code/:bucket/:type',
  status: [200],
});

/**
 * Sets the code of the bucket and type
 *
 * @class message.SetBaqendCode
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} type The type of the script
 * @param {string} body The massage Content
 */
exports.SetBaqendCode = Message.create({
  method: 'PUT',
  path: '/code/:bucket/:type',
  status: [200, 202],
});

/**
 * Delete the code of the given bucket and type
 *
 * @class message.DeleteBaqendCode
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} type The type of the script
 */
exports.DeleteBaqendCode = Message.create({
  method: 'DELETE',
  path: '/code/:bucket/:type',
  status: [202, 204],
});

/**
 * Calls the module of the specific bucket
 *
 * @class message.PostBaqendModule
 * @extends connector.Message
 *
 * @param {string} bucket The method name
 */
exports.PostBaqendModule = Message.create({
  method: 'POST',
  path: '/code/:bucket',
  status: [200, 204],
});

/**
 * Calls the module of the specific bucket
 *
 * @class message.GetBaqendModule
 * @extends connector.Message
 *
 * @param {string} bucket The module name
 */
exports.GetBaqendModule = Message.create({
  method: 'GET',
  path: '/code/:bucket',
  status: [200, 204],
});

/**
 * List all available modules
 *
 * @class message.GetAllModules
 * @extends connector.Message
 *
 */
exports.GetAllModules = Message.create({
  method: 'GET',
  path: '/code',
  status: [200],
});

/**
 * Get all file ID's in the given folder
 * Retrieve meta-information about all accessible Files and folders in a specified folder.
 *
 * @class message.ListFiles
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} path The folder to list
 * @param {boolean} deep If true, files of subdirectories are returned as well
 * @param {string} start The file/folder name from where to start listing
 * @param {number} count The upper limit to return, -1 is equal to the upper limit of 1000
 */
exports.ListFiles = Message.create({
  method: 'GET',
  path: '/file/:bucket/ids?path=/&start=&count=-1&deep=false',
  status: [200],
});

/**
 * Get all buckets
 * Gets all buckets.
 *
 * @class message.ListBuckets
 * @extends connector.Message
 *
 */
exports.ListBuckets = Message.create({
  method: 'GET',
  path: '/file/buckets',
  status: [200],
});

/**
 * Download a bucket archive
 * Downloads an archive containing the bucket contents.
 *
 * @class message.DownloadArchive
 * @extends connector.Message
 *
 * @param {string} archive The archive file name
 */
exports.DownloadArchive = Message.create({
  method: 'GET',
  path: '/file',
  status: [200],
});

/**
 * Upload a patch bucket archive
 * Uploads an archive; files contained within that archive will be replaced within the bucket.
 *
 * @class message.UploadPatchArchive
 * @extends connector.Message
 *
 * @param {string} archive The archive file name
 * @param {string} body The massage Content
 */
exports.UploadPatchArchive = Message.create({
  method: 'POST',
  path: '/file',
  status: [200],
});

/**
 * Retrieve the bucket Metadata
 * The bucket metadata object contains the bucketAcl.
 *
 * @class message.GetFileBucketMetadata
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 */
exports.GetFileBucketMetadata = Message.create({
  method: 'GET',
  path: '/file/:bucket',
  status: [200],
});

/**
 * Set the Bucket Metadata
 * Creates or replaces the bucket Metadata to control permission access to all included Files.
 *
 * @class message.SetFileBucketMetadata
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {json} body The massage Content
 */
exports.SetFileBucketMetadata = Message.create({
  method: 'PUT',
  path: '/file/:bucket',
  status: [204],
});

/**
 * Delete all files of a file Bucket
 * Deletes the bucket and all its content.
 *
 * @class message.DeleteFileBucket
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 */
exports.DeleteFileBucket = Message.create({
  method: 'DELETE',
  path: '/file/:bucket',
  status: [204],
});

/**
 * Creates a new file with a random UUID
 * Creates a file with a random ID, only Insert permissions are required.
 *
 * @class message.CreateFile
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 */
exports.CreateFile = Message.create({
  method: 'POST',
  path: '/file/:bucket',
  status: [200],
});

/**
 * Download a file
 * Downloads a file by its ID.
 *
 * @class message.DownloadFile
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique object identifier
 */
exports.DownloadFile = Message.create({
  method: 'GET',
  path: '/file/:bucket/*oid',
  status: [200, 304],
});

/**
 * Upload a new file
 * Uploads and replace an existing file with a new one.
 * The If-Match or If-Unmodified-Since header can be used to make a conditional update
 *
 * @class message.UploadFile
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique file identifier
 */
exports.UploadFile = Message.create({
  method: 'PUT',
  path: '/file/:bucket/*oid',
  status: [200],
});

/**
 * Get the file metadata
 * Gets the file Acl and metadata.
 *
 * @class message.GetFileMetadata
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique object identifier
 */
exports.GetFileMetadata = Message.create({
  method: 'HEAD',
  path: '/file/:bucket/*oid',
  status: [200],
});

/**
 * Update File Metadata
 * Updates the file Metadata.
 *
 * @class message.UpdateFileMetadata
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique object identifier
 * @param {json} body The massage Content
 */
exports.UpdateFileMetadata = Message.create({
  method: 'POST',
  path: '/file/:bucket/*oid',
  status: [200],
});

/**
 * Delete a file
 * Deletes a file or a folder with all its contents.
 * The If-Match or If-Unmodified-Since header can be used to make a conditional deletion
 *
 * @class message.DeleteFile
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {string} oid The unique file identifier
 */
exports.DeleteFile = Message.create({
  method: 'DELETE',
  path: '/file/:bucket/*oid',
  status: [200, 204],
});

/**
 * Creates the manifest
 * Creates the manifest with the given data
 *
 * @class message.CreateManifest
 * @extends connector.Message
 *
 * @param {json} body The massage Content
 */
exports.CreateManifest = Message.create({
  method: 'POST',
  path: '/pwa/manifest',
  status: [202],
});

/**
 * Downloads (and clones) an external asset
 * Downloads an external file.
 *
 * @class message.DownloadAsset
 * @extends connector.Message
 *
 * @param {string} url The url of the external asset to download
 */
exports.DownloadAsset = Message.create({
  method: 'GET',
  path: '/asset/*url',
  status: [200, 304],
});

/**
 * Checks and purges assets
 * Checks and purges assets for the SpeedKit.
 *
 * @class message.RevalidateAssets
 * @extends connector.Message
 *
 * @param {json} body The massage Content
 */
exports.RevalidateAssets = Message.create({
  method: 'POST',
  path: '/asset/revalidate',
  status: [202],
});

/**
 * Gets the status
 * Get the current status of the revalidation
 *
 * @class message.GetRevalidationStatus
 * @extends connector.Message
 *
 * @param {string} id The status id
 */
exports.GetRevalidationStatus = Message.create({
  method: 'GET',
  path: '/asset/revalidate/:id',
  status: [200, 202],
});

/**
 * List bucket indexes
 * List all indexes of the given bucket
 *
 * @class message.ListIndexes
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 */
exports.ListIndexes = Message.create({
  method: 'GET',
  path: '/index/:bucket',
  status: [200],
});

/**
 * Create or drop bucket index
 * Create or drop a index for the given bucket
 *
 * @class message.CreateDropIndex
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 * @param {json} body The massage Content
 */
exports.CreateDropIndex = Message.create({
  method: 'POST',
  path: '/index/:bucket',
  status: [202],
});

/**
 * Drop all indexes
 * Drop all indexes on the given bucket
 *
 * @class message.DropAllIndexes
 * @extends connector.Message
 *
 * @param {string} bucket The bucket name
 */
exports.DropAllIndexes = Message.create({
  method: 'DELETE',
  path: '/index/:bucket',
  status: [202],
});

/**
 * Method to register a new device
 * Registers a new devices
 *
 * @class message.DeviceRegister
 * @extends connector.Message
 *
 * @param {json} body The massage Content
 */
exports.DeviceRegister = Message.create({
  method: 'POST',
  path: '/db/Device/register',
  status: [200],
});

/**
 * Method to push a message to devices
 * Pushes a message to devices
 *
 * @class message.DevicePush
 * @extends connector.Message
 *
 * @param {json} body The massage Content
 */
exports.DevicePush = Message.create({
  method: 'POST',
  path: '/db/Device/push',
  status: [204],
});

/**
 * Check if device is registered
 * Checks if the device is already registered
 *
 * @class message.DeviceRegistered
 * @extends connector.Message
 *
 */
exports.DeviceRegistered = Message.create({
  method: 'GET',
  path: '/db/Device/registered',
  status: [200],
});

/**
 * Generate VAPID Keys
 * Generate VAPID Keys for web push
 *
 * @class message.VAPIDKeys
 * @extends connector.Message
 *
 */
exports.VAPIDKeys = Message.create({
  method: 'POST',
  path: '/config/VAPIDKeys',
  status: [200],
});

/**
 * Get VAPID Public Key
 * Get VAPID Public Key for web push
 *
 * @class message.VAPIDPublicKey
 * @extends connector.Message
 *
 */
exports.VAPIDPublicKey = Message.create({
  method: 'GET',
  path: '/config/VAPIDPublicKey',
  status: [200],
});

/**
 * Set GCM-API-Key
 * Sets the GCM/FCM API-Key for Android Push
 *
 * @class message.GCMAKey
 * @extends connector.Message
 *
 * @param {string} body The massage Content
 */
exports.GCMAKey = Message.create({
  method: 'POST',
  path: '/config/GCMKey',
  status: [204],
});

/**
 * Upload APNS certificate
 * Upload APNS certificate for IOS Push
 *
 * @class message.UploadAPNSCertificate
 * @extends connector.Message
 *
 */
exports.UploadAPNSCertificate = Message.create({
  method: 'POST',
  path: '/config/APNSCert',
  status: [204],
});

/**
 * Executes a basic sqlquery
 * Executes the given query and returns a list of matching objects.
 *
 * @class message.SqlQuery
 * @extends connector.Message
 *
 * @param {string} q The query
 * @param {boolean} eager indicates if the query result should be sent back as ids or as objects
 * @param {boolean} hinted indicates whether the query should be cached even when capacity limit is reached
 * @param {number} start The offset to start from
 * @param {number} count The number of objects to list
 * @param {string} sort The sort object
 */
exports.SqlQuery = Message.create({
  method: 'GET',
  path: '/db/query?ptq',
  status: [200,465,468],
});