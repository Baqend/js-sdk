var Message = require('./connector/Message').Message;

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
 * List all API specification parts of the Orestes-Server
 * 
 * @class baqend.message.ListAllApis
 * @extends baqend.connector.Message
 *
 */
exports.ListAllApis = Message.create({
    method: 'GET',
    params: ['/spec'],
    status: [200]
});

/**
 * Get the API specification part of the Orestes-Server
 * 
 * @class baqend.message.ListApiSpecification
 * @extends baqend.connector.Message
 *
 * @param part {Object} The specification part name
 */
exports.ListApiSpecification = Message.create({
    method: 'GET',
    params: ['/spec/', 0],
    status: [200]
});

/**
 * List all subresources
 * 
 * @class baqend.message.ListDbResources
 * @extends baqend.connector.Message
 *
 */
exports.ListDbResources = Message.create({
    method: 'GET',
    params: ['/db'],
    status: [200]
});

/**
 * List all available bucket names
 * 
 * @class baqend.message.GetBucketNames
 * @extends baqend.connector.Message
 *
 */
exports.GetBucketNames = Message.create({
    method: 'GET',
    params: ['/db/all_buckets'],
    status: [200]
});

/**
 * List all available subresources of an bucket resource
 * 
 * @class baqend.message.ListBucketSubresurces
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 */
exports.ListBucketSubresurces = Message.create({
    method: 'GET',
    params: ['/db/', 0],
    status: [200]
});

/**
 * get List all subresources
 * 
 * @class baqend.message.ListReplicationResources
 * @extends baqend.connector.Message
 *
 */
exports.ListReplicationResources = Message.create({
    method: 'GET',
    params: ['/replication'],
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
    params: ['/replication/bloomfilter'],
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
 * List all bucket elements
 * List all elements of the bucket
 * 
 * @class baqend.message.GetBucketOids
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param start {Object} The offset from where to start from
 * @param count {Object} The number of objects to enlist
 */
exports.GetBucketOids = Message.create({
    method: 'GET',
    params: ['/db/', 0, '/all_oids;start=', 1, ';count=', 2],
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
 * To update an specific version you can specify its version Number in the If-Match Header.
 * You can use a * to override any Version, but error if the Object dose not exist or don't
 * set the Header to upsert.
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
 * Deletes the object from the underling database. You can use the if Match Header to specify
 * an File Version to Delete or send * as If-Match Value to get an error response if the Object
 * was not found.
 * 
 * @class baqend.message.DeleteObject
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param oid {Object} The unique object identifier
 * @param body {object} The massage Content
 */
exports.DeleteObject = Message.create({
    method: 'DELETE',
    params: ['/db/', 0, '/', 1],
    status: [202, 204]
});

/**
 * Get all available class schemas
 * 
 * @class baqend.message.GetAllSchemas
 * @extends baqend.connector.Message
 *
 */
exports.GetAllSchemas = Message.create({
    method: 'GET',
    params: ['/db/schema'],
    status: [200]
});

/**
 * Create new class schemas and update existing class schemas
 * 
 * @class baqend.message.UpdateAllSchemas
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.UpdateAllSchemas = Message.create({
    method: 'POST',
    params: ['/db/schema'],
    status: [200]
});

/**
 * Replace all currently created schemas with the new ones
 * 
 * @class baqend.message.ReplaceAllSchemas
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.ReplaceAllSchemas = Message.create({
    method: 'PUT',
    params: ['/db/schema'],
    status: [200]
});

/**
 * Remove all currently created schemas
 * 
 * @class baqend.message.DeleteAllSchemas
 * @extends baqend.connector.Message
 *
 */
exports.DeleteAllSchemas = Message.create({
    method: 'DELETE',
    params: ['/db/schema'],
    status: [204, 304]
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
    params: ['/db/schema/', 0],
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
    params: ['/db/schema/', 0],
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
    params: ['/db/schema/', 0],
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
    params: ['/db/schema/', 0],
    status: [204, 304]
});

/**
 * Executes a basic ad-hoc query
 * Returns a list of matching object ids.
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
    params: ['/db/', 0, '/all_oid?query=', 1, '&start=', 2, '&count=', 3, '&sort=', 4],
    status: [200]
});

/**
 * Executes a basic ad-hoc query
 * Returns a list of matching objects.
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
 * 
 * @class baqend.message.Login
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.Login = Message.create({
    method: 'POST',
    params: ['/db/_native.User/login'],
    status: [200]
});

/**
 * Method to register a user
 * 
 * @class baqend.message.Register
 * @extends baqend.connector.Message
 *
 * @param body {object} The massage Content
 */
exports.Register = Message.create({
    method: 'POST',
    params: ['/db/_native.User/register'],
    status: [200]
});

/**
 * Method to renew a user token
 * 
 * @class baqend.message.RenewToken
 * @extends baqend.connector.Message
 *
 */
exports.RenewToken = Message.create({
    method: 'GET',
    params: ['/db/_native.User/renew'],
    status: [200]
});

/**
 * Method to validate a user token
 * 
 * @class baqend.message.ValidateUser
 * @extends baqend.connector.Message
 *
 */
exports.ValidateUser = Message.create({
    method: 'GET',
    params: ['/db/_native.User/validate'],
    status: [200]
});

/**
 * Method to remove token cookie
 * 
 * @class baqend.message.Logout
 * @extends baqend.connector.Message
 *
 */
exports.Logout = Message.create({
    method: 'GET',
    params: ['/db/_native.User/logout'],
    status: [200]
});

/**
 * Gets the code of the handler for the given bucket and type
 * 
 * @class baqend.message.GetBaqendHandler
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The handler type of the script
 */
exports.GetBaqendHandler = Message.create({
    method: 'GET',
    params: ['/code/', 0, '/', 1],
    status: [200]
});

/**
 * Sets the code of the handler for the given bucket and type
 * 
 * @class baqend.message.SetBaqendHandler
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The handler type of the script
 * @param body {object} The massage Content
 */
exports.SetBaqendHandler = Message.create({
    method: 'PUT',
    params: ['/code/', 0, '/', 1],
    status: [200]
});

/**
 * Delete the code of the handler for the given bucket and type
 * 
 * @class baqend.message.DeleteBaqendHandler
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The handler type of the script
 */
exports.DeleteBaqendHandler = Message.create({
    method: 'DELETE',
    params: ['/code/', 0, '/', 1],
    status: [204]
});

/**
 * Sets the script for an specific code bucket
 * 
 * @class baqend.message.SetBaqendCode
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The function name
 * @param body {object} The massage Content
 */
exports.SetBaqendCode = Message.create({
    method: 'PUT',
    params: ['/code/', 0],
    status: [200]
});

/**
 * Gets the code for an specific code bucket
 * 
 * @class baqend.message.GetBaqendCode
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The script name
 */
exports.GetBaqendCode = Message.create({
    method: 'GET',
    params: ['/code/', 0],
    status: [200]
});

/**
 * Deletes the code for an specific bucket name
 * 
 * @class baqend.message.DeleteBaqendCode
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The script name
 */
exports.DeleteBaqendCode = Message.create({
    method: 'DELETE',
    params: ['/code/', 0],
    status: [204]
});

/**
 * Calls the code of the specific code bucket
 * 
 * @class baqend.message.CallBaqendCode
 * @extends baqend.connector.Message
 *
 * @param bucket {Object} The function name
 * @param body {object} The massage Content
 */
exports.CallBaqendCode = Message.create({
    method: 'POST',
    params: ['/code/', 0],
    status: [200, 204]
});

/**
 * Download a file
 * Download an oversized information package, like some picture maybe.
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

