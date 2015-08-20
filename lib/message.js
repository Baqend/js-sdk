var Message = require('./connector/Message');

/**
 * Get the list of all available subresources
 * 
 * @class baqend.message.ListAllResources
 * @extends baqend.connector.Message
 *
 */
exports.ListAllResources = Message.create({
    method: 'GET',
    params: ['/'],
    status: [200]
});

/**
 * Get the API version of the Orestes-Server
 * 
 * @class baqend.message.ApiVersion
 * @extends baqend.connector.Message
 *
 */
exports.ApiVersion = Message.create({
    method: 'GET',
    params: ['/version'],
    status: [200]
});

/**
 * The Swagger specification of the Orestes-Server
 * 
 * @class baqend.message.Specification
 * @extends baqend.connector.Message
 *
 */
exports.Specification = Message.create({
    method: 'GET',
    params: ['/spec'],
    status: [200]
});

/**
 * Returns all changed objects
 * 
 * @class baqend.message.GetBloomFilter
 * @extends baqend.connector.Message
 *
 */
exports.GetBloomFilter = Message.create({
    method: 'GET',
    params: ['/replication'],
    status: [200]
});

/**
 * Get the current Orestes config
 * 
 * @class baqend.message.GetOrestesConfig
 * @extends baqend.connector.Message
 *
 */
exports.GetOrestesConfig = Message.create({
    method: 'GET',
    params: ['/config'],
    status: [200]
});

/**
 * Updates the current Orestes config
 * 
 * @class baqend.message.UpdateOrestesConfig
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.UpdateOrestesConfig = Message.create({
    method: 'PUT',
    params: ['/config'],
    status: [202, 204]
});

/**
 * Initialize the database and creates predefined objects
 * 
 * @class baqend.message.Create
 * @extends baqend.connector.Message
 *
 */
exports.Create = Message.create({
    method: 'POST',
    params: ['/create'],
    status: [201]
});

/**
 * Connects a browser to this server
 * 
 * @class baqend.message.Connect
 * @extends baqend.connector.Message
 *
 */
exports.Connect = Message.create({
    method: 'GET',
    params: ['/connect'],
    status: [200]
});

/**
 * List all available bucket names
 * List all bucket
 * 
 * @class baqend.message.GetBucketNames
 * @extends baqend.connector.Message
 *
 */
exports.GetBucketNames = Message.create({
    method: 'GET',
    params: ['/db'],
    status: [200]
});

/**
 * List all bucket objects
 * List all object ids of the bucket
 * 
 * @class baqend.message.GetBucketIds
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param start {Object} The offset to skip
 * @param count {Object} The upper limit to return
 */
exports.GetBucketIds = Message.create({
    method: 'GET',
    params: ['/db/', 0, '/ids?start=', 1, '&count=', 2],
    status: [200]
});

/**
 * Dumps all objects of the bucket
 * Exports the complete Bucket content
 * 
 * @class baqend.message.ExportBucket
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.ExportBucket = Message.create({
    method: 'GET',
    params: ['/db/', 0],
    status: [200]
});

/**
 * Upload all objects to the bucket
 * Imports the complete Bucket content
 * 
 * @class baqend.message.ImportBucket
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.ImportBucket = Message.create({
    method: 'PUT',
    params: ['/db/', 0],
    status: [200]
});

/**
 * Create object
 * Create the given Object.
 * The object will be created and gets a unique oid.
 * 
 * @class baqend.message.CreateObject
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
 */
exports.CreateObject = Message.create({
    method: 'POST',
    params: ['/db/', 0],
    status: [201, 202]
});

/**
 * Get object
 * Returns the specified object. Each object has one unique identifier and therefore only one location.
 * 
 * @class baqend.message.GetObject
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 */
exports.GetObject = Message.create({
    method: 'GET',
    params: ['/db/', 0, '/', 1],
    status: [200, 304]
});

/**
 * Replace object
 * Replace the current object with the updated one.
 * To update a specific version of the object a version Number can be provided in the If-Match header.
 * The update will only be accepted, if the current version matches the provided one, otherwise the update
 * will be rejected.
 * You can use the * wildcard to match any existing object, but prevents a insertion if the object doesn't exists.
 * 
 * @class baqend.message.ReplaceObject
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param body {object} The massage Content
 */
exports.ReplaceObject = Message.create({
    method: 'PUT',
    params: ['/db/', 0, '/', 1],
    status: [200, 202]
});

/**
 * Deletes the object
 * Deletes the object. The If-Match Header can be used to specify an expected version. The object will
 * only be deleted if the version matches the provided one. The * wildcard can be used to match any existing
 * version but results in an error if the object doesn't exists.
 * 
 * @class baqend.message.DeleteObject
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 */
exports.DeleteObject = Message.create({
    method: 'DELETE',
    params: ['/db/', 0, '/', 1],
    status: [202, 204]
});

/**
 * Get all available class schemas
 * Gets the complete schema
 * 
 * @class baqend.message.GetAllSchemas
 * @extends baqend.connector.Message
 *
 */
exports.GetAllSchemas = Message.create({
    method: 'GET',
    params: ['/schema'],
    status: [200]
});

/**
 * Create new class schemas and update existing class schemas
 * Updates the complete schema, merge all changes, reject the schema update if the schema changes aren't compatible
 * 
 * @class baqend.message.UpdateAllSchemas
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.UpdateAllSchemas = Message.create({
    method: 'POST',
    params: ['/schema'],
    status: [200]
});

/**
 * Replace all currently created schemas with the new ones
 * Replace the complete schema, with the new one.
 * 
 * @class baqend.message.ReplaceAllSchemas
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.ReplaceAllSchemas = Message.create({
    method: 'PUT',
    params: ['/schema'],
    status: [200]
});

/**
 * Get the class schema
 * Returns the schema definition of the class
 * The class definition contains a link to its parent class and all persistable fields with there types of the class
 * 
 * @class baqend.message.GetSchema
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.GetSchema = Message.create({
    method: 'GET',
    params: ['/schema/', 0],
    status: [200]
});

/**
 * Update the class schema
 * Modify the schema definition of the class by adding all missing fields
 * 
 * @class baqend.message.UpdateSchema
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
 */
exports.UpdateSchema = Message.create({
    method: 'POST',
    params: ['/schema/', 0],
    status: [200]
});

/**
 * Replace the class schema
 * Replace the schema definition of the class
 * 
 * @class baqend.message.ReplaceSchema
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
 */
exports.ReplaceSchema = Message.create({
    method: 'PUT',
    params: ['/schema/', 0],
    status: [200]
});

/**
 * Delete the class schema
 * Delete the schema definition of the class
 * 
 * @class baqend.message.DeleteSchema
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.DeleteSchema = Message.create({
    method: 'DELETE',
    params: ['/schema/', 0],
    status: [204]
});

/**
 * Executes an ad-hoc query
 * Executes the given query and returns a list of matching ids.
 * 
 * @class baqend.message.AdhocQueryIds
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param query {Object} The query
 * @param start {Object} The offset to start from
 * @param count {Object} The number of objects to list
 * @param sort {Object} The sort object
 */
exports.AdhocQueryIds = Message.create({
    method: 'GET',
    params: ['/db/', 0, '/ids?query=', 1, '&start=', 2, '&count=', 3, '&sort=', 4],
    status: [200]
});

/**
 * Executes an ad-hoc query
 * Executes the given query and returns a list of matching ids.
 * 
 * @class baqend.message.AdhocQueryIdsPOST
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param start {Object} The offset to start from
 * @param count {Object} The number of objects to list
 * @param sort {Object} The sort object
 * @param body {object} The massage Content
 */
exports.AdhocQueryIdsPOST = Message.create({
    method: 'POST',
    params: ['/db/', 0, '/ids?start=', 1, '&count=', 2, '&sort=', 3],
    status: [200]
});

/**
 * Executes a basic ad-hoc query
 * Executes the given query and returns a list of matching objects.
 * 
 * @class baqend.message.AdhocQuery
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param query {Object} The query
 * @param start {Object} The offset to start from
 * @param count {Object} The number of objects to list
 * @param sort {Object} The sort object
 */
exports.AdhocQuery = Message.create({
    method: 'GET',
    params: ['/db/', 0, '?query=', 1, '&start=', 2, '&count=', 3, '&sort=', 4],
    status: [200]
});

/**
 * Executes a basic ad-hoc query
 * Executes the given query and returns a list of matching objects.
 * 
 * @class baqend.message.AdhocQueryPOST
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param start {Object} The offset to start from
 * @param count {Object} The number of objects to list
 * @param sort {Object} The sort object
 * @param body {object} The massage Content
 */
exports.AdhocQueryPOST = Message.create({
    method: 'POST',
    params: ['/db/', 0, '/query?start=', 1, '&count=', 2, '&sort=', 3],
    status: [200]
});

/**
 * Executes a count query
 * Executes the given query and returns the number of objects that match the query
 * 
 * @class baqend.message.AdhocCountQuery
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param query {Object} The query
 */
exports.AdhocCountQuery = Message.create({
    method: 'GET',
    params: ['/db/', 0, '/count?query=', 1],
    status: [200]
});

/**
 * Executes a count query
 * Executes the given query and returns the number of objects that match the query
 * 
 * @class baqend.message.AdhocCountQueryPOST
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
 */
exports.AdhocCountQueryPOST = Message.create({
    method: 'POST',
    params: ['/db/', 0, '/count'],
    status: [200]
});

/**
 * List all Query subresources
 * 
 * @class baqend.message.ListQueryResources
 * @extends baqend.connector.Message
 *
 */
exports.ListQueryResources = Message.create({
    method: 'GET',
    params: ['/query'],
    status: [200]
});

/**
 * Creates a prepared query
 * 
 * @class baqend.message.CreateQuery
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.CreateQuery = Message.create({
    method: 'POST',
    params: ['/query'],
    status: [201]
});

/**
 * List all subresources of a query
 * 
 * @class baqend.message.ListThisQueryResources
 * @extends baqend.connector.Message
 *
 * @param qid {Object} The query id
 */
exports.ListThisQueryResources = Message.create({
    method: 'GET',
    params: ['/query/', 0],
    status: [200]
});

/**
 * Get the query string
 * 
 * @class baqend.message.GetQueryCode
 * @extends baqend.connector.Message
 *
 * @param qid {Object} The query id
 */
exports.GetQueryCode = Message.create({
    method: 'GET',
    params: ['/query/', 0, '/source'],
    status: [200]
});

/**
 * Executes a prepared query
 * 
 * @class baqend.message.RunQuery
 * @extends baqend.connector.Message
 *
 * @param start {Object} The offset from where to start from
 * @param count {Object} The number of objects to enlist
 * @param qid {Object} The query id
 */
exports.RunQuery = Message.create({
    method: 'GET',
    params: ['/query/', 0, '/result;start=', 1, ';count=', 2],
    status: [200]
});

/**
 * Get the declared query parameters
 * 
 * @class baqend.message.GetQueryParameters
 * @extends baqend.connector.Message
 *
 * @param qid {Object} The query id
 */
exports.GetQueryParameters = Message.create({
    method: 'GET',
    params: ['/query/', 0, '/parameters'],
    status: [200]
});

/**
 * List all active transactions
 * 
 * @class baqend.message.GetActiveTransactions
 * @extends baqend.connector.Message
 *
 */
exports.GetActiveTransactions = Message.create({
    method: 'GET',
    params: ['/transaction'],
    status: [200]
});

/**
 * Starts a new Transaction
 * 
 * @class baqend.message.NewTransaction
 * @extends baqend.connector.Message
 *
 */
exports.NewTransaction = Message.create({
    method: 'POST',
    params: ['/transaction'],
    status: [201]
});

/**
 * List all subresources
 * 
 * @class baqend.message.ListTransactionalSubresurces
 * @extends baqend.connector.Message
 *
 * @param tid {Object} The transaction id
 */
exports.ListTransactionalSubresurces = Message.create({
    method: 'GET',
    params: ['/transaction/', 0],
    status: [200]
});

/**
 * Aborts a active transaction
 * 
 * @class baqend.message.AbortTransaction
 * @extends baqend.connector.Message
 *
 * @param tid {Object} The transaction id
 */
exports.AbortTransaction = Message.create({
    method: 'PUT',
    params: ['/transaction/', 0, '/aborted'],
    status: [204]
});

/**
 * List all transactional changed objects
 * 
 * @class baqend.message.GetTransactionChangeset
 * @extends baqend.connector.Message
 *
 * @param tid {Object} The transaction id
 */
exports.GetTransactionChangeset = Message.create({
    method: 'GET',
    params: ['/transaction/', 0, '/changeset'],
    status: [200]
});

/**
 * Commits the transaction
 * If the transaction can be completed a list of all changed objects with their updated versions are returned.
 * 
 * @class baqend.message.CommitTransaction
 * @extends baqend.connector.Message
 *
 * @param tid {Object} The transaction id
 * @param body {object} The massage Content
 */
exports.CommitTransaction = Message.create({
    method: 'PUT',
    params: ['/transaction/', 0, '/committed'],
    status: [200]
});

/**
 * List all subresources
 * 
 * @class baqend.message.ListTransactionResources
 * @extends baqend.connector.Message
 *
 * @param tid {Object} The transaction id
 */
exports.ListTransactionResources = Message.create({
    method: 'GET',
    params: ['/transaction/', 0, '/dbview'],
    status: [200]
});

/**
 * List all subresources
 * 
 * @class baqend.message.ListTransactionBucketResources
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param tid {Object} The transaction id
 */
exports.ListTransactionBucketResources = Message.create({
    method: 'GET',
    params: ['/transaction/', 0, '/dbview/', 1],
    status: [200]
});

/**
 * Get the transactional modified version of the object
 * 
 * @class baqend.message.GetTransactionStateObject
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param tid {Object} The transaction id
 */
exports.GetTransactionStateObject = Message.create({
    method: 'GET',
    params: ['/transaction/', 0, '/dbview/', 1, '/', 2],
    status: [200]
});

/**
 * Executes an transactional adhoc query
 * Executes an adhoc query and returns a list of matched object identifiers
 * 
 * @class baqend.message.QueryTransactional
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param query {Object} The query
 * @param start {Object} The offset to start from
 * @param count {Object} The number of objects to list
 * @param tid {Object} The transaction id
 */
exports.QueryTransactional = Message.create({
    method: 'GET',
    params: ['/transaction/', 0, '/dbview/', 1, '?query=', 2, '&start=', 3, '&count=', 4],
    status: [200]
});

/**
 * Executes a transactional prepared query
 * 
 * @class baqend.message.RunQueryTransactional
 * @extends baqend.connector.Message
 *
 * @param start {Object} The offset which will be skipped
 * @param count {Object} The number of objects to enlist
 * @param qid {Object} The query id
 * @param tid {Object} The transaction id
 */
exports.RunQueryTransactional = Message.create({
    method: 'GET',
    params: ['/transaction/', 0, '/queryview/', 1, '/result;start=', 2, ';count=', 3],
    status: [200]
});

/**
 * Update the object
 * Executes the partial updates on the object.
 * To update an object an explicit version must be provided in the If-Match header.
 * If the version is not equal to the current object version the update will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the update will always be applied.
 * 
 * @class baqend.message.UpdatePartially
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param body {object} The massage Content
 */
exports.UpdatePartially = Message.create({
    method: 'POST',
    params: ['/db/', 0, '/', 1],
    status: [204]
});

/**
 * Update the object field
 * Executes the partial update on a object field.
 * To update an object an explicit version must be provided in the If-Match header.
 * If the version is not equal to the current object version the update will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the update will always be applied.
 * 
 * @class baqend.message.UpdateField
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param field {Object} The field name
 * @param oid {Object} The unique object identifier
 * @param body {object} The massage Content
 */
exports.UpdateField = Message.create({
    method: 'POST',
    params: ['/db/', 0, '/', 1, '/', 2],
    status: [204]
});

/**
 * Method to login a user
 * Log in a user by it's credentials
 * 
 * @class baqend.message.Login
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.Login = Message.create({
    method: 'POST',
    params: ['/db/User/login'],
    status: [200]
});

/**
 * Method to register a user
 * Register and creates a new user
 * 
 * @class baqend.message.Register
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.Register = Message.create({
    method: 'POST',
    params: ['/db/User/register'],
    status: [200]
});

/**
 * Method to load the current user object
 * Gets the user object of the currently logged in user
 * 
 * @class baqend.message.Me
 * @extends baqend.connector.Message
 *
 */
exports.Me = Message.create({
    method: 'GET',
    params: ['/db/User/me'],
    status: [200]
});

/**
 * Method to validate a user token
 * Validates if a given token is still valid
 * 
 * @class baqend.message.ValidateUser
 * @extends baqend.connector.Message
 *
 */
exports.ValidateUser = Message.create({
    method: 'GET',
    params: ['/db/User/validate'],
    status: [200]
});

/**
 * Method to remove token cookie
 * Log out a user by removing the cookie token
 * 
 * @class baqend.message.Logout
 * @extends baqend.connector.Message
 *
 */
exports.Logout = Message.create({
    method: 'GET',
    params: ['/db/User/logout'],
    status: [204]
});

/**
 * Method to change the password
 * 
 * @class baqend.message.NewPassword
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.NewPassword = Message.create({
    method: 'POST',
    params: ['/db/User/password'],
    status: [200]
});

/**
 * Gets the code of the the given bucket and type
 * 
 * @class baqend.message.GetBaqendCode
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The type of the script
 */
exports.GetBaqendCode = Message.create({
    method: 'GET',
    params: ['/code/', 0, '/', 1],
    status: [200]
});

/**
 * Sets the code of the bucket and type
 * 
 * @class baqend.message.SetBaqendCode
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The type of the script
 * @param body {object} The massage Content
 */
exports.SetBaqendCode = Message.create({
    method: 'PUT',
    params: ['/code/', 0, '/', 1],
    status: [200]
});

/**
 * Delete the code of the given bucket and type
 * 
 * @class baqend.message.DeleteBaqendCode
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The type of the script
 */
exports.DeleteBaqendCode = Message.create({
    method: 'DELETE',
    params: ['/code/', 0, '/', 1],
    status: [204]
});

/**
 * Calls the method of the specific bucket
 * 
 * @class baqend.message.PostBaqendMethod
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The method name
 */
exports.PostBaqendMethod = Message.create({
    method: 'POST',
    params: ['/code/', 0],
    status: [200, 204]
});

/**
 * Calls the method of the specific bucket
 * 
 * @class baqend.message.GetBaqendMethod
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The method name
 */
exports.GetBaqendMethod = Message.create({
    method: 'GET',
    params: ['/code/', 0],
    status: [200, 204]
});

/**
 * List all available methods
 * 
 * @class baqend.message.GetAllMethods
 * @extends baqend.connector.Message
 *
 */
exports.GetAllMethods = Message.create({
    method: 'GET',
    params: ['/code'],
    status: [200]
});

/**
 * Get all file ID's   File-Bucket
 * retrieve meta-information about all accessible Files in a specific Bucket.
 * 
 * @class baqend.message.ListFiles
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param start {Object} The unique object identifier
 * @param count {Object} The upper limit to return.
 */
exports.ListFiles = Message.create({
    method: 'GET',
    params: ['/file/', 0, '/ids?start=', 1, '&count=', 2],
    status: []
});

/**
 * retrieves bucket acl
 * The bucket metadata object contains the bucketAcl
 * 
 * @class baqend.message.GetBucketMetadata
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.GetBucketMetadata = Message.create({
    method: 'GET',
    params: ['/file/', 0],
    status: []
});

/**
 * replaces Folder ACL
 * creates or replaces Folder ACL's to control permission access to all included Files.
 * 
 * @class baqend.message.SetFileStoreACL
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
 */
exports.SetFileStoreACL = Message.create({
    method: 'PUT',
    params: ['/file/', 0],
    status: []
});

/**
 * deletes all files of a File Bucket
 * creates or replaces Folder ACL's to control permission access to all included Files.
 * 
 * @class baqend.message.DeleteFileBucket
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.DeleteFileBucket = Message.create({
    method: 'DELETE',
    params: ['/file/', 0],
    status: []
});

/**
 * Creates a new file with a UUID
 * Creates a File with a random ID, only Insert permissions are required
 * 
 * @class baqend.message.PostToFileBucket
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.PostToFileBucket = Message.create({
    method: 'POST',
    params: ['/file/', 0],
    status: []
});

/**
 * Download a file  File-Bucket-OID
 * Download a chunk of Data.
 * 
 * @class baqend.message.GetFile
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 */
exports.GetFile = Message.create({
    method: 'GET',
    params: ['/file/', 0, '/', 1],
    status: [200, 304]
});

/**
 * replaces File ACL
 * replaces File Access control listing  Files.
 * 
 * @class baqend.message.SetFileACL
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param body {object} The massage Content
 */
exports.SetFileACL = Message.create({
    method: 'POST',
    params: ['/file/', 0, '/', 1],
    status: []
});

/**
 * Replace a file
 * Replace an File with some other file.
 * Like objects, you can specify an explicit version in the
 * If-Match Header or use * to replace any version but error if the File dose not exist.
 * 
 * @class baqend.message.ReplaceFile
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 */
exports.ReplaceFile = Message.create({
    method: 'PUT',
    params: ['/file/', 0, '/', 1],
    status: [203]
});

/**
 * Delete a file
 * Deletes a file.
 * Like objects, you can specify an explicit version in the
 * If-Match Header or use * to replace any version but error if the File dose not exist.
 * 
 * @class baqend.message.DeleteFile
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 */
exports.DeleteFile = Message.create({
    method: 'DELETE',
    params: ['/file/', 0, '/', 1],
    status: [203]
});

/**
 * List bucket indexes
 * List all indexes of the given bucket
 * 
 * @class baqend.message.ListIndexes
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.ListIndexes = Message.create({
    method: 'GET',
    params: ['/index/', 0],
    status: [200]
});

/**
 * Create or drop bucket index
 * Create or drop a index for the given bucket
 * 
 * @class baqend.message.CreateDropIndex
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param body {object} The massage Content
 */
exports.CreateDropIndex = Message.create({
    method: 'POST',
    params: ['/index/', 0],
    status: [202]
});

/**
 * Drop all indexes
 * Drop all indexes on the given bucket
 * 
 * @class baqend.message.DropAllIndexes
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.DropAllIndexes = Message.create({
    method: 'DELETE',
    params: ['/index/', 0],
    status: [202]
});

/**
 * Method to register a new device
 * Registers a new devices
 * 
 * @class baqend.message.DeviceRegister
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.DeviceRegister = Message.create({
    method: 'POST',
    params: ['/db/Device/register'],
    status: [204]
});

/**
 * Method to push a message to devices
 * Pushes a message to devices
 * 
 * @class baqend.message.Push
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.Push = Message.create({
    method: 'POST',
    params: ['/db/Device/push'],
    status: [204]
});

/**
 * Upload APNS certificate
 * Upload APNS certificate
 * 
 * @class baqend.message.UploadAPNSCertificate
 * @extends baqend.connector.Message
 *
 */
exports.UploadAPNSCertificate = Message.create({
    method: 'POST',
    params: ['/config/APNSCert'],
    status: [204]
});

/**
 * Set GCM-API-Key
 * Sets the GCM-API-Key
 * 
 * @class baqend.message.GCMAKey
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.GCMAKey = Message.create({
    method: 'POST',
    params: ['/config/GCMKey'],
    status: [204]
});

