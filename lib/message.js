var Message = require('./connector/Message').Message;

/**
 * Get the list of all available subresources
 * 
 * @class jspa.message.ListAllResources
 * @extends jspa.message.Message
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
 * @class jspa.message.ApiVersion
 * @extends jspa.message.Message
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
 * @class jspa.message.ListAllApis
 * @extends jspa.message.Message
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
 * @class jspa.message.ListApiSpecification
 * @extends jspa.message.Message
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
 * @class jspa.message.ListDbResources
 * @extends jspa.message.Message
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
 * @class jspa.message.GetBucketNames
 * @extends jspa.message.Message
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
 * @class jspa.message.ListBucketSubresurces
 * @extends jspa.message.Message
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
 * @class jspa.message.ListReplicationResources
 * @extends jspa.message.Message
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
 * @class jspa.message.GetBloomFilter
 * @extends jspa.message.Message
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
 * @class jspa.message.GetOrestesConfig
 * @extends jspa.message.Message
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
 * @class jspa.message.UpdateOrestesConfig
 * @extends jspa.message.Message
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
 * @class jspa.message.Create
 * @extends jspa.message.Message
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
 * @class jspa.message.Connect
 * @extends jspa.message.Message
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
 * @class jspa.message.GetBucketOids
 * @extends jspa.message.Message
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
 * @class jspa.message.CreateObject
 * @extends jspa.message.Message
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
 * @class jspa.message.GetObject
 * @extends jspa.message.Message
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
 * To update an object an explicit version must be provided in the Etag-Header.
 * If the version is not equal to the current object version the update will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the update will always be applied.
 * 
 * @class jspa.message.ReplaceObject
 * @extends jspa.message.Message
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
 * Deletes the object from the underling database. If the object was already deleted the
 * request will be ignored.
 * To delete an object an explicit version must be provided in the Etag-Header.
 * If the version is not equal to the current object version the deletion will be aborted.
 * The version identifier Any (*) can be used to skip the version validation and therefore
 * the delete will always be applied.
 * 
 * @class jspa.message.DeleteObject
 * @extends jspa.message.Message
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
 * @class jspa.message.GetAllSchemas
 * @extends jspa.message.Message
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
 * @class jspa.message.UpdateAllSchemas
 * @extends jspa.message.Message
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
 * @class jspa.message.ReplaceAllSchemas
 * @extends jspa.message.Message
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
 * @class jspa.message.DeleteAllSchemas
 * @extends jspa.message.Message
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
 * @class jspa.message.GetSchema
 * @extends jspa.message.Message
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
 * @class jspa.message.UpdateSchema
 * @extends jspa.message.Message
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
 * @class jspa.message.ReplaceSchema
 * @extends jspa.message.Message
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
 * @class jspa.message.DeleteSchema
 * @extends jspa.message.Message
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
 * @class jspa.message.QueryByExampel
 * @extends jspa.message.Message
 *
 * @param bucket {Object} The bucket name
 * @param query {Object} The query
 * @param start {Object} The offset to start from
 * @param count {Object} The number of objects to list
 */
exports.QueryByExampel = Message.create({
    method: 'GET',
    params: ['/db/', 0, '?query=', 1, '&start=', 2, '&count=', 3],
    status: [200]
});

/**
 * Executes an adhoc query
 * Executes an adhoc query and returns a list of matching object identifiers
 * 
 * @class jspa.message.Query
 * @extends jspa.message.Message
 *
 * @param bucket {Object} The bucket name
 * @param start {Object} The offset from where to start from
 * @param count {Object} The number of objects to list
 */
exports.Query = Message.create({
    method: 'POST',
    params: ['/db/', 0, '?start=', 1, '&count=', 2],
    status: [200]
});

/**
 * List all Query subresources
 * 
 * @class jspa.message.ListQueryResources
 * @extends jspa.message.Message
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
 * @class jspa.message.CreateQuery
 * @extends jspa.message.Message
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
 * @class jspa.message.ListThisQueryResources
 * @extends jspa.message.Message
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
 * @class jspa.message.GetQueryCode
 * @extends jspa.message.Message
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
 * @class jspa.message.RunQuery
 * @extends jspa.message.Message
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
 * @class jspa.message.GetQueryParameters
 * @extends jspa.message.Message
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
 * @class jspa.message.GetActiveTransactions
 * @extends jspa.message.Message
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
 * @class jspa.message.NewTransaction
 * @extends jspa.message.Message
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
 * @class jspa.message.ListTransactionalSubresurces
 * @extends jspa.message.Message
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
 * @class jspa.message.AbortTransaction
 * @extends jspa.message.Message
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
 * @class jspa.message.GetTransactionChangeset
 * @extends jspa.message.Message
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
 * @class jspa.message.CommitTransaction
 * @extends jspa.message.Message
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
 * @class jspa.message.ListTransactionResources
 * @extends jspa.message.Message
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
 * @class jspa.message.ListTransactionBucketResources
 * @extends jspa.message.Message
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
 * @class jspa.message.GetTransactionStateObject
 * @extends jspa.message.Message
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
 * @class jspa.message.QueryTransactional
 * @extends jspa.message.Message
 *
 * @param start {Object} The offset from where to start from
 * @param count {Object} The number of objects to enlist
 * @param tid {Object} The transaction id
 */
exports.QueryTransactional = Message.create({
    method: 'POST',
    params: ['/transaction/', 0, '/queryview/adhoc;start=', 1, ';count=', 2],
    status: [200]
});

/**
 * Executes a transactional prepared query
 * 
 * @class jspa.message.RunQueryTransactional
 * @extends jspa.message.Message
 *
 * @param start {Object} The offset from where to start fromS
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
 * @class jspa.message.UpdatePartially
 * @extends jspa.message.Message
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
 * @class jspa.message.UpdateField
 * @extends jspa.message.Message
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
 * @class jspa.message.Login
 * @extends jspa.message.Message
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
 * @class jspa.message.Register
 * @extends jspa.message.Message
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
 * @class jspa.message.RenewToken
 * @extends jspa.message.Message
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
 * @class jspa.message.ValidateUser
 * @extends jspa.message.Message
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
 * @class jspa.message.Logout
 * @extends jspa.message.Message
 *
 */
exports.Logout = Message.create({
    method: 'GET',
    params: ['/db/_native.User/logout'],
    status: [200]
});

/**
 * Get the code for an specific class script
 * Returns the specified baqend script code
 * 
 * @class jspa.message.GetBaqendCode
 * @extends jspa.message.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The handler type of the script
 */
exports.GetBaqendCode = Message.create({
    method: 'GET',
    params: ['/code/', 0, '/', 1],
    status: [200]
});

/**
 * Sets the code for an specific class script
 * Replace the specified baqend script code
 * 
 * @class jspa.message.SetBaqendCode
 * @extends jspa.message.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The handler type of the script
 * @param body {object} The massage Content
 */
exports.SetBaqendCode = Message.create({
    method: 'PUT',
    params: ['/code/', 0, '/', 1],
    status: [200]
});

/**
 * Delete the code for an specific class script
 * Delete the specified baqend script code
 * 
 * @class jspa.message.DeleteBaqendCode
 * @extends jspa.message.Message
 *
 * @param bucket {Object} The bucket name
 * @param type {Object} The handler type of the script
 */
exports.DeleteBaqendCode = Message.create({
    method: 'DELETE',
    params: ['/code/', 0, '/', 1],
    status: [204]
});

