/* DO NOT TOUCH THIS AUTO-GENERATED FILE */
/* eslint-disable max-len,@typescript-eslint/no-redeclare */
import { Message } from './connector';
import { Json as json } from './util';

interface ListAllResources {
  /**
   * Get the list of all available subresources
   */
  new(): Message;
}
export const ListAllResources = Message.create<ListAllResources>({
  method: 'GET',
  path: '/',
  status: [200],
});

interface ApiVersion {
  /**
   * Get the API version of the Orestes-Server
   */
  new(): Message;
}
export const ApiVersion = Message.create<ApiVersion>({
  method: 'GET',
  path: '/version',
  status: [200],
});

interface Specification {
  /**
   * The Swagger specification of the Orestes-Server
   */
  new(): Message;
}
export const Specification = Message.create<Specification>({
  method: 'GET',
  path: '/spec',
  status: [200],
});

interface GetBloomFilter {
  /**
   * Returns all changed objects
   *
   * @param rules indicates whether the AssetFilter rules should be returned with the current BloomFilter
   */
  new(rules?: boolean): Message;
}
export const GetBloomFilter = Message.create<GetBloomFilter>({
  method: 'GET',
  path: '/bloomfilter?rules=false',
  status: [200],
});

interface GetBloomFilterExpirations {
  /**
   * Returns all changed objects
   */
  new(): Message;
}
export const GetBloomFilterExpirations = Message.create<GetBloomFilterExpirations>({
  method: 'GET',
  path: '/bloomfilter/expirations',
  status: [200],
});

interface DeleteBloomFilter {
  /**
   * Clears the Bloom filter (TTLs and stale entries)
   *
   * @param flush indeicates all maintained caches should also be flushed (CDN and SW Caches)
   */
  new(flush?: boolean): Message;
}
export const DeleteBloomFilter = Message.create<DeleteBloomFilter>({
  method: 'DELETE',
  path: '/bloomfilter?flush=true',
  status: [204],
});

interface GetOrestesConfig {
  /**
   * Get the current Orestes config
   */
  new(): Message;
}
export const GetOrestesConfig = Message.create<GetOrestesConfig>({
  method: 'GET',
  path: '/config',
  status: [200],
});

interface UpdateOrestesConfig {
  /**
   * Updates the current Orestes config
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const UpdateOrestesConfig = Message.create<UpdateOrestesConfig>({
  method: 'PUT',
  path: '/config',
  status: [200, 202],
});

interface Connect {
  /**
   * Connects a browser to this server
   */
  new(): Message;
}
export const Connect = Message.create<Connect>({
  method: 'GET',
  path: '/connect',
  status: [200],
});

interface ConnectViaPost {
  /**
   * Connects a browser to this server via a post request
   */
  new(): Message;
}
export const ConnectViaPost = Message.create<ConnectViaPost>({
  method: 'POST',
  path: '/connect',
  status: [200],
});

interface Status {
  /**
   * Gets the status of the server health
   */
  new(): Message;
}
export const Status = Message.create<Status>({
  method: 'GET',
  path: '/status',
  status: [200],
});

interface EventsUrl {
  /**
   * Gets the event Endpoint
   */
  new(): Message;
}
export const EventsUrl = Message.create<EventsUrl>({
  method: 'GET',
  path: '/events-url',
  status: [200],
});

interface BannedIp {
  /**
   * Determines whether the IP has exceeded its rate limit
   *
   * @param ip The ip to test
   */
  new(ip: string): Message;
}
export const BannedIp = Message.create<BannedIp>({
  method: 'GET',
  path: '/banned/:ip',
  status: [204],
});

interface Banned {
  /**
   * Always returns banned status for proper CDN handling
   */
  new(): Message;
}
export const Banned = Message.create<Banned>({
  method: 'GET',
  path: '/banned',
  status: [],
});

interface Unban {
  /**
   * Clears all rate-limiting information for all IPs
   */
  new(): Message;
}
export const Unban = Message.create<Unban>({
  method: 'DELETE',
  path: '/banned',
  status: [204],
});

interface UnbanIp {
  /**
   * Clears rate-limiting information for given IPs
   *
   * @param ip The ip to reset
   */
  new(ip: string): Message;
}
export const UnbanIp = Message.create<UnbanIp>({
  method: 'DELETE',
  path: '/banned/:ip',
  status: [204],
});

interface GetBucketNames {
  /**
   * List all bucket names
   * List all buckets
   */
  new(): Message;
}
export const GetBucketNames = Message.create<GetBucketNames>({
  method: 'GET',
  path: '/db',
  status: [200],
});

interface GetBucketIds {
  /**
   * List objects in bucket
   * List all object ids of the given bucket
   *
   * @param bucket The bucket name
   * @param start The offset to skip
   * @param count The upper limit to return
   */
  new(bucket: string, start?: number, count?: number): Message;
}
export const GetBucketIds = Message.create<GetBucketIds>({
  method: 'GET',
  path: '/db/:bucket/ids?start=0&count=-1',
  status: [200],
});

interface ExportBucket {
  /**
   * Dump objects of bucket
   * Exports the complete data set of the bucket
   *
   * @param bucket The bucket name
   */
  new(bucket: string): Message;
}
export const ExportBucket = Message.create<ExportBucket>({
  method: 'GET',
  path: '/db/:bucket',
  status: [200],
});

interface ImportBucket {
  /**
   * Upload all objects to the bucket
   * Imports the complete data set. For large uploads, this call will always return the status code 200.
   * If failures occur, they will be returned in the response body.
   *
   * @param bucket The bucket name
   * @param body The massage Content
   */
  new(bucket: string, body?: json): Message;
}
export const ImportBucket = Message.create<ImportBucket>({
  method: 'PUT',
  path: '/db/:bucket',
  status: [200],
});

interface TruncateBucket {
  /**
   * Delete all objects in bucket
   * Delete all objects in the given bucket
   *
   * @param bucket The bucket name
   */
  new(bucket: string): Message;
}
export const TruncateBucket = Message.create<TruncateBucket>({
  method: 'DELETE',
  path: '/db/:bucket',
  status: [200],
});

interface CreateObject {
  /**
   * Create object
   * Create the given object.
   * The created object will get a unique id.
   *
   * @param bucket The bucket name
   * @param body The massage Content
   */
  new(bucket: string, body?: json): Message;
}
export const CreateObject = Message.create<CreateObject>({
  method: 'POST',
  path: '/db/:bucket',
  status: [201, 202],
});

interface GetObject {
  /**
   * Get object
   * Returns the specified object. Each object has one unique identifier and therefore only one URL.
   *
   * @param bucket The bucket name
   * @param oid The unique object identifier
   */
  new(bucket: string, oid: string): Message;
}
export const GetObject = Message.create<GetObject>({
  method: 'GET',
  path: '/db/:bucket/:oid',
  status: [200, 304],
});

interface ReplaceObject {
  /**
   * Replace object
   * Replace the current object with the updated one.
   * To update a specific version of the object a version can be provided in the If-Match header.
   * The update will only be accepted, if the current version matches the provided one, otherwise the update
   * will be rejected.
   * The * wildcard matches any existing object but prevents an insertion if the object does not exist.
   *
   * @param bucket The bucket name
   * @param oid The unique object identifier
   * @param body The massage Content
   */
  new(bucket: string, oid: string, body?: json): Message;
}
export const ReplaceObject = Message.create<ReplaceObject>({
  method: 'PUT',
  path: '/db/:bucket/:oid',
  status: [200, 202],
});

interface DeleteObject {
  /**
   * Delete object
   * Deletes the object. The If-Match Header can be used to specify an expected version. The object will
   * only be deleted if the version matches the provided one. The * wildcard can be used to match any existing
   * version but results in an error if the object does not exist.
   *
   * @param bucket The bucket name
   * @param oid The unique object identifier
   */
  new(bucket: string, oid: string): Message;
}
export const DeleteObject = Message.create<DeleteObject>({
  method: 'DELETE',
  path: '/db/:bucket/:oid',
  status: [202, 204],
});

interface GetAllSchemas {
  /**
   * Get all available class schemas
   * Gets the complete schema
   */
  new(): Message;
}
export const GetAllSchemas = Message.create<GetAllSchemas>({
  method: 'GET',
  path: '/schema',
  status: [200],
});

interface UpdateAllSchemas {
  /**
   * Create new class schemas and update existing class schemas
   * Updates the complete schema, merge all changes, reject the schema update if the schema changes aren't compatible
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const UpdateAllSchemas = Message.create<UpdateAllSchemas>({
  method: 'POST',
  path: '/schema',
  status: [200],
});

interface ReplaceAllSchemas {
  /**
   * Replace all currently created schemas with the new ones
   * Replace the complete schema, with the new one.
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const ReplaceAllSchemas = Message.create<ReplaceAllSchemas>({
  method: 'PUT',
  path: '/schema',
  status: [200],
});

interface GetSchema {
  /**
   * Get the class schema
   * Returns the schema definition of the class
   * The class definition contains a link to its parent class and all persistable fields with there types of the class
   *
   * @param bucket The bucket name
   */
  new(bucket: string): Message;
}
export const GetSchema = Message.create<GetSchema>({
  method: 'GET',
  path: '/schema/:bucket',
  status: [200],
});

interface UpdateSchema {
  /**
   * Update the class schema
   * Modify the schema definition of the class by adding all missing fields
   *
   * @param bucket The bucket name
   * @param body The massage Content
   */
  new(bucket: string, body?: json): Message;
}
export const UpdateSchema = Message.create<UpdateSchema>({
  method: 'POST',
  path: '/schema/:bucket',
  status: [200],
});

interface ReplaceSchema {
  /**
   * Replace the class schema
   * Replace the schema definition of the class
   *
   * @param bucket The bucket name
   * @param body The massage Content
   */
  new(bucket: string, body?: json): Message;
}
export const ReplaceSchema = Message.create<ReplaceSchema>({
  method: 'PUT',
  path: '/schema/:bucket',
  status: [200],
});

interface DeleteSchema {
  /**
   * Delete the class schema
   * Delete the schema definition of the class
   *
   * @param bucket The bucket name
   */
  new(bucket: string): Message;
}
export const DeleteSchema = Message.create<DeleteSchema>({
  method: 'DELETE',
  path: '/schema/:bucket',
  status: [204],
});

interface AdhocQuery {
  /**
   * Executes a basic ad-hoc query
   * Executes the given query and returns a list of matching objects.
   *
   * @param bucket The bucket name
   * @param q The query
   * @param start The offset to start from
   * @param count The number of objects to list
   * @param sort The sort object
   * @param eager indicates if the query result should be sent back as ids or as objects
   * @param hinted indicates whether the query should be cached even when capacity limit is reached
   */
  new(bucket: string, q: string, start?: number, count?: number, sort?: string, eager?: boolean, hinted?: boolean): Message;
}
export const AdhocQuery = Message.create<AdhocQuery>({
  method: 'GET',
  path: '/db/:bucket/query?q&start=0&count=-1&sort=&eager=&hinted=',
  status: [200],
});

interface AdhocQueryPOST {
  /**
   * Executes a basic ad-hoc query
   * Executes the given query and returns a list of matching objects.
   *
   * @param bucket The bucket name
   * @param start The offset to start from
   * @param count The number of objects to list
   * @param sort The sort object
   * @param body The massage Content
   */
  new(bucket: string, start?: number, count?: number, sort?: string, body?: string): Message;
}
export const AdhocQueryPOST = Message.create<AdhocQueryPOST>({
  method: 'POST',
  path: '/db/:bucket/query?start=0&count=-1&sort=',
  status: [200],
});

interface AdhocCountQuery {
  /**
   * Executes a count query
   * Executes the given query and returns the number of objects that match the query
   *
   * @param bucket The bucket name
   * @param q The query
   */
  new(bucket: string, q: string): Message;
}
export const AdhocCountQuery = Message.create<AdhocCountQuery>({
  method: 'GET',
  path: '/db/:bucket/count?q',
  status: [200],
});

interface AdhocCountQueryPOST {
  /**
   * Executes a count query
   * Executes the given query and returns the number of objects that match the query
   *
   * @param bucket The bucket name
   * @param body The massage Content
   */
  new(bucket: string, body?: string): Message;
}
export const AdhocCountQueryPOST = Message.create<AdhocCountQueryPOST>({
  method: 'POST',
  path: '/db/:bucket/count',
  status: [200],
});

interface ListQueryResources {
  /**
   * List all Query subresources
   */
  new(): Message;
}
export const ListQueryResources = Message.create<ListQueryResources>({
  method: 'GET',
  path: '/query',
  status: [200],
});

interface CreateQuery {
  /**
   * Creates a prepared query
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const CreateQuery = Message.create<CreateQuery>({
  method: 'POST',
  path: '/query',
  status: [201],
});

interface ListThisQueryResources {
  /**
   * List all subresources of a query
   *
   * @param qid The query id
   */
  new(qid: string): Message;
}
export const ListThisQueryResources = Message.create<ListThisQueryResources>({
  method: 'GET',
  path: '/query/:qid',
  status: [200],
});

interface GetQueryCode {
  /**
   * Get the query string
   *
   * @param qid The query id
   */
  new(qid: string): Message;
}
export const GetQueryCode = Message.create<GetQueryCode>({
  method: 'GET',
  path: '/query/:qid/source',
  status: [200],
});

interface RunQuery {
  /**
   * Executes a prepared query
   *
   * @param qid The query id
   * @param start The offset from where to start from
   * @param count The number of objects to enlist
   */
  new(qid: string, start?: number, count?: number): Message;
}
export const RunQuery = Message.create<RunQuery>({
  method: 'GET',
  path: '/query/:qid/result?start=0&count=-1',
  status: [200],
});

interface GetQueryParameters {
  /**
   * Get the declared query parameters
   *
   * @param qid The query id
   */
  new(qid: string): Message;
}
export const GetQueryParameters = Message.create<GetQueryParameters>({
  method: 'GET',
  path: '/query/:qid/parameters',
  status: [200],
});

interface NewTransaction {
  /**
   * Starts a new Transaction
   */
  new(): Message;
}
export const NewTransaction = Message.create<NewTransaction>({
  method: 'POST',
  path: '/transaction',
  status: [201],
});

interface CommitTransaction {
  /**
   * Commits the transaction
   * If the transaction can be completed a list of all changed objects with their updated versions are returned.
   *
   * @param tid The transaction id
   * @param body The massage Content
   */
  new(tid: string, body?: json): Message;
}
export const CommitTransaction = Message.create<CommitTransaction>({
  method: 'PUT',
  path: '/transaction/:tid/committed',
  status: [200],
});

interface UpdatePartially {
  /**
   * Update the object
   * Executes the partial updates on the object.
   * To update an object an explicit version must be provided in the If-Match header.
   * If the version is not equal to the current object version the update will be aborted.
   * The version identifier Any (*) can be used to skip the version validation and therefore
   * the update will always be applied.
   *
   * @param bucket The bucket name
   * @param oid The unique object identifier
   * @param body The massage Content
   */
  new(bucket: string, oid: string, body?: json): Message;
}
export const UpdatePartially = Message.create<UpdatePartially>({
  method: 'POST',
  path: '/db/:bucket/:oid',
  status: [200],
});

interface UpdateField {
  /**
   * Update the object field
   * Executes the partial update on a object field.
   * To update an object an explicit version must be provided in the If-Match header.
   * If the version is not equal to the current object version the update will be aborted.
   * The version identifier Any (*) can be used to skip the version validation and therefore
   * the update will always be applied.
   *
   * @param bucket The bucket name
   * @param oid The unique object identifier
   * @param field The field name
   * @param body The massage Content
   */
  new(bucket: string, oid: string, field: string, body?: json): Message;
}
export const UpdateField = Message.create<UpdateField>({
  method: 'POST',
  path: '/db/:bucket/:oid/:field',
  status: [200],
});

interface Login {
  /**
   * Method to login a user
   * Log in a user by it's credentials
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const Login = Message.create<Login>({
  method: 'POST',
  path: '/db/User/login',
  status: [200],
});

interface Register {
  /**
   * Method to register a user
   * Register and creates a new user
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const Register = Message.create<Register>({
  method: 'POST',
  path: '/db/User/register',
  status: [200, 204],
});

interface Me {
  /**
   * Method to load the current user object
   * Gets the user object of the currently logged in user
   */
  new(): Message;
}
export const Me = Message.create<Me>({
  method: 'GET',
  path: '/db/User/me',
  status: [200],
});

interface ValidateUser {
  /**
   * Method to validate a user token
   * Validates if a given token is still valid
   */
  new(): Message;
}
export const ValidateUser = Message.create<ValidateUser>({
  method: 'GET',
  path: '/db/User/validate',
  status: [200],
});

interface Logout {
  /**
   * Method to remove token cookie
   * Log out a user by removing the cookie token
   */
  new(): Message;
}
export const Logout = Message.create<Logout>({
  method: 'GET',
  path: '/db/User/logout',
  status: [204],
});

interface NewPassword {
  /**
   * Method to change the password
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const NewPassword = Message.create<NewPassword>({
  method: 'POST',
  path: '/db/User/password',
  status: [200],
});

interface ResetPassword {
  /**
   * Method to request a new password
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const ResetPassword = Message.create<ResetPassword>({
  method: 'POST',
  path: '/db/User/reset',
  status: [200],
});

interface Verify {
  /**
   * Method to verify user by a given token
   *
   * @param token Token to verify the user
   */
  new(token?: string): Message;
}
export const Verify = Message.create<Verify>({
  method: 'GET',
  path: '/db/User/verify?token=',
  status: [204],
});

interface ChangeUsername {
  /**
   * Method to request a change of the username
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const ChangeUsername = Message.create<ChangeUsername>({
  method: 'POST',
  path: '/db/User/changeUsername',
  status: [204],
});

interface VerifyUsername {
  /**
   * Method to verify a username by a given token
   *
   * @param token Token to verify the user
   */
  new(token?: string): Message;
}
export const VerifyUsername = Message.create<VerifyUsername>({
  method: 'GET',
  path: '/db/User/verifyUsername?token=',
  status: [204],
});

interface OAuth2 {
  /**
   * Method to register or login using an OAuth provider.
   * This resource is should be invoked by the provider with a redirect after the user granted permission.
   *
   * @param provider The OAuth provider
   * @param state Additional form encoded state. Can contain an optional redirect (url) that will be called after login with the user token attached as query parameter.
   * @param code The code written by the provider
   * @param oauth_verifier OAuth 1.0 code
   * @param oauth_token OAuth 1.0 identifier
   * @param error_description The error description of the oauth provider
   */
  new(provider: string, state?: string, code?: string, oauth_verifier?: string, oauth_token?: string, error_description?: string): Message;
}
export const OAuth2 = Message.create<OAuth2>({
  method: 'GET',
  path: '/db/User/OAuth/:provider?state=&code=&oauth_verifier=&oauth_token=&error_description=',
  status: [200],
});

interface OAuth1 {
  /**
   * Method to invoke a OAuth-1.0 login/register
   * The resource requests a request-token and redirects the user to the provider page to log-in and grant permission for
   * your application.
   *
   * @param provider The OAuth provider
   */
  new(provider: string): Message;
}
export const OAuth1 = Message.create<OAuth1>({
  method: 'GET',
  path: '/db/User/OAuth1/:provider',
  status: [200],
});

interface DeletePassword {
  /**
   * Deletes the password of the currently logged in user
   * Method to delete the password of the currently logged in user
   */
  new(): Message;
}
export const DeletePassword = Message.create<DeletePassword>({
  method: 'DELETE',
  path: '/db/User/password',
  status: [204],
});

interface UserToken {
  /**
   * Generate a token without lifetime
   * Method to generate a token without lifetime
   *
   * @param oid The unique object identifier
   */
  new(oid: string): Message;
}
export const UserToken = Message.create<UserToken>({
  method: 'POST',
  path: '/db/User/:oid/token',
  status: [200],
});

interface RevokeUserToken {
  /**
   * Revoke all tokens
   * Method to revoke all previously created tokens
   *
   * @param oid The unique object identifier
   */
  new(oid: string): Message;
}
export const RevokeUserToken = Message.create<RevokeUserToken>({
  method: 'DELETE',
  path: '/db/User/:oid/token',
  status: [204],
});

interface MFAInitChallenge {
  /**
   * Starts MFA initialization
   * Method to create a MFA
   */
  new(): Message;
}
export const MFAInitChallenge = Message.create<MFAInitChallenge>({
  method: 'GET',
  path: '/db/User/mfa/init',
  status: [200],
});

interface MFAInitFinish {
  /**
   * Finishes MFA initialization
   * Method to create a MFA
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const MFAInitFinish = Message.create<MFAInitFinish>({
  method: 'POST',
  path: '/db/User/mfa/init',
  status: [200],
});

interface MFAToken {
  /**
   * Finalize the generation of the shared secret for MFA
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const MFAToken = Message.create<MFAToken>({
  method: 'POST',
  path: '/db/User/mfa/token',
  status: [200],
});

interface MFADelete {
  /**
   * Deletes the users mfaSecret and mfaService
   */
  new(): Message;
}
export const MFADelete = Message.create<MFADelete>({
  method: 'DELETE',
  path: '/db/User/mfa',
  status: [204],
});

interface MFAStatus {
  /**
   * Returns the current state of MFA
   */
  new(): Message;
}
export const MFAStatus = Message.create<MFAStatus>({
  method: 'GET',
  path: '/db/User/mfa/status',
  status: [200],
});

interface AssumeRole {
  /**
   * Assumes a role
   * Assumes a role if it is permitted to the requesting user and returns a new token wich represents
   * the assumed role
   *
   * @param oid The unique role identifier
   */
  new(oid: string): Message;
}
export const AssumeRole = Message.create<AssumeRole>({
  method: 'POST',
  path: '/db/Role/:oid/assume',
  status: [200],
});

interface GetBaqendCode {
  /**
   * Gets the code of the the given bucket and type
   *
   * @param bucket The bucket name
   * @param type The type of the script
   */
  new(bucket: string, type: string): Message;
}
export const GetBaqendCode = Message.create<GetBaqendCode>({
  method: 'GET',
  path: '/code/:bucket/:type',
  status: [200],
});

interface SetBaqendCode {
  /**
   * Sets the code of the bucket and type
   *
   * @param bucket The bucket name
   * @param type The type of the script
   * @param body The massage Content
   */
  new(bucket: string, type: string, body?: string): Message;
}
export const SetBaqendCode = Message.create<SetBaqendCode>({
  method: 'PUT',
  path: '/code/:bucket/:type',
  status: [200, 202],
});

interface DeleteBaqendCode {
  /**
   * Delete the code of the given bucket and type
   *
   * @param bucket The bucket name
   * @param type The type of the script
   */
  new(bucket: string, type: string): Message;
}
export const DeleteBaqendCode = Message.create<DeleteBaqendCode>({
  method: 'DELETE',
  path: '/code/:bucket/:type',
  status: [202, 204],
});

interface PostBaqendModule {
  /**
   * Calls the module of the specific bucket
   *
   * @param bucket The method name
   */
  new(bucket: string): Message;
}
export const PostBaqendModule = Message.create<PostBaqendModule>({
  method: 'POST',
  path: '/code/:bucket',
  status: [200, 204],
});

interface GetBaqendModule {
  /**
   * Calls the module of the specific bucket
   *
   * @param bucket The module name
   */
  new(bucket: string): Message;
}
export const GetBaqendModule = Message.create<GetBaqendModule>({
  method: 'GET',
  path: '/code/:bucket',
  status: [200, 204],
});

interface GetAllModules {
  /**
   * List all available modules
   */
  new(): Message;
}
export const GetAllModules = Message.create<GetAllModules>({
  method: 'GET',
  path: '/code',
  status: [200],
});

interface ListFiles {
  /**
   * Get all file ID's in the given folder
   * Retrieve meta-information about all accessible Files and folders in a specified folder.
   *
   * @param bucket The bucket name
   * @param path The folder to list
   * @param start The file/folder name from where to start listing
   * @param count The upper limit to return, -1 is equal to the upper limit of 1000
   * @param deep If true, files of subdirectories are returned as well
   */
  new(bucket: string, path?: string, start?: string, count?: number, deep?: boolean): Message;
}
export const ListFiles = Message.create<ListFiles>({
  method: 'GET',
  path: '/file/:bucket/ids?path=/&start=&count=-1&deep=false',
  status: [200],
});

interface ListBuckets {
  /**
   * Get all buckets
   * Gets all buckets.
   */
  new(): Message;
}
export const ListBuckets = Message.create<ListBuckets>({
  method: 'GET',
  path: '/file/buckets',
  status: [200],
});

interface DownloadArchive {
  /**
   * Download a bucket archive
   * Downloads an archive containing the bucket contents.
   *
   * @param archive The archive file name
   */
  new(archive: string): Message;
}
export const DownloadArchive = Message.create<DownloadArchive>({
  method: 'GET',
  path: '/file',
  status: [200],
});

interface UploadPatchArchive {
  /**
   * Upload a patch bucket archive
   * Uploads an archive; files contained within that archive will be replaced within the bucket.
   *
   * @param archive The archive file name
   * @param body The massage Content
   */
  new(archive: string, body?: string): Message;
}
export const UploadPatchArchive = Message.create<UploadPatchArchive>({
  method: 'POST',
  path: '/file',
  status: [200],
});

interface GetFileBucketMetadata {
  /**
   * Retrieve the bucket Metadata
   * The bucket metadata object contains the bucketAcl.
   *
   * @param bucket The bucket name
   */
  new(bucket: string): Message;
}
export const GetFileBucketMetadata = Message.create<GetFileBucketMetadata>({
  method: 'GET',
  path: '/file/:bucket',
  status: [200],
});

interface SetFileBucketMetadata {
  /**
   * Set the Bucket Metadata
   * Creates or replaces the bucket Metadata to control permission access to all included Files.
   *
   * @param bucket The bucket name
   * @param body The massage Content
   */
  new(bucket: string, body?: json): Message;
}
export const SetFileBucketMetadata = Message.create<SetFileBucketMetadata>({
  method: 'PUT',
  path: '/file/:bucket',
  status: [204],
});

interface DeleteFileBucket {
  /**
   * Delete all files of a file Bucket
   * Deletes the bucket and all its content.
   *
   * @param bucket The bucket name
   */
  new(bucket: string): Message;
}
export const DeleteFileBucket = Message.create<DeleteFileBucket>({
  method: 'DELETE',
  path: '/file/:bucket',
  status: [204],
});

interface CreateFile {
  /**
   * Creates a new file with a random UUID
   * Creates a file with a random ID, only Insert permissions are required.
   *
   * @param bucket The bucket name
   */
  new(bucket: string): Message;
}
export const CreateFile = Message.create<CreateFile>({
  method: 'POST',
  path: '/file/:bucket',
  status: [200],
});

interface DownloadFile {
  /**
   * Download a file
   * Downloads a file by its ID.
   *
   * @param bucket The bucket name
   * @param oid The unique object identifier
   */
  new(bucket: string, oid: string): Message;
}
export const DownloadFile = Message.create<DownloadFile>({
  method: 'GET',
  path: '/file/:bucket/*oid',
  status: [200, 304],
});

interface UploadFile {
  /**
   * Upload a new file
   * Uploads and replace an existing file with a new one.
   * The If-Match or If-Unmodified-Since header can be used to make a conditional update
   *
   * @param bucket The bucket name
   * @param oid The unique file identifier
   */
  new(bucket: string, oid: string): Message;
}
export const UploadFile = Message.create<UploadFile>({
  method: 'PUT',
  path: '/file/:bucket/*oid',
  status: [200],
});

interface GetFileMetadata {
  /**
   * Get the file metadata
   * Gets the file Acl and metadata.
   *
   * @param bucket The bucket name
   * @param oid The unique object identifier
   */
  new(bucket: string, oid: string): Message;
}
export const GetFileMetadata = Message.create<GetFileMetadata>({
  method: 'HEAD',
  path: '/file/:bucket/*oid',
  status: [200],
});

interface UpdateFileMetadata {
  /**
   * Update File Metadata
   * Updates the file Metadata.
   *
   * @param bucket The bucket name
   * @param oid The unique object identifier
   * @param body The massage Content
   */
  new(bucket: string, oid: string, body?: json): Message;
}
export const UpdateFileMetadata = Message.create<UpdateFileMetadata>({
  method: 'POST',
  path: '/file/:bucket/*oid',
  status: [200],
});

interface DeleteFile {
  /**
   * Delete a file
   * Deletes a file or a folder with all its contents.
   * The If-Match or If-Unmodified-Since header can be used to make a conditional deletion
   *
   * @param bucket The bucket name
   * @param oid The unique file identifier
   */
  new(bucket: string, oid: string): Message;
}
export const DeleteFile = Message.create<DeleteFile>({
  method: 'DELETE',
  path: '/file/:bucket/*oid',
  status: [200, 204],
});

interface CreateManifest {
  /**
   * Creates the manifest
   * Creates the manifest with the given data
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const CreateManifest = Message.create<CreateManifest>({
  method: 'POST',
  path: '/pwa/manifest',
  status: [202],
});

interface DownloadAsset {
  /**
   * Downloads (and clones) an external asset
   * Downloads an external file.
   *
   * @param url The url of the external asset to download
   */
  new(url: string): Message;
}
export const DownloadAsset = Message.create<DownloadAsset>({
  method: 'GET',
  path: '/asset/*url',
  status: [200, 304],
});

interface RevalidateAssets {
  /**
   * Checks and purges assets
   * Checks and purges assets for the SpeedKit.
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const RevalidateAssets = Message.create<RevalidateAssets>({
  method: 'POST',
  path: '/asset/revalidate',
  status: [202],
});

interface EditRevalidationJob {
  /**
   * Changes the status
   * Change the status of the given revalidation job
   *
   * @param id The status id
   * @param body The massage Content
   */
  new(id: string, body?: json): Message;
}
export const EditRevalidationJob = Message.create<EditRevalidationJob>({
  method: 'POST',
  path: '/asset/revalidate/:id',
  status: [204],
});

interface GetRevalidationStatus {
  /**
   * Gets the status
   * Get the current status of the revalidation
   *
   * @param id The status id
   */
  new(id: string): Message;
}
export const GetRevalidationStatus = Message.create<GetRevalidationStatus>({
  method: 'GET',
  path: '/asset/revalidate/:id',
  status: [200, 202],
});

interface CancelRevalidation {
  /**
   * Cancel the revalidation
   * Cancel the revalidation for the given ID
   *
   * @param id The revalidation id
   */
  new(id: string): Message;
}
export const CancelRevalidation = Message.create<CancelRevalidation>({
  method: 'DELETE',
  path: '/asset/revalidate/:id',
  status: [202],
});

interface GetAllRevalidationStatus {
  /**
   * Gets all status
   * Get all revalidation status
   *
   * @param state Filter status by its state
   */
  new(state?: string): Message;
}
export const GetAllRevalidationStatus = Message.create<GetAllRevalidationStatus>({
  method: 'GET',
  path: '/asset/revalidate?state=',
  status: [200],
});

interface CleanUpAssets {
  /**
   * Checks for expired assets
   * Purges assets, which has been expired.
   *
   * @param body The massage Content
   */
  new(body?: string): Message;
}
export const CleanUpAssets = Message.create<CleanUpAssets>({
  method: 'POST',
  path: '/asset/cleanup',
  status: [202],
});

interface CleanUpStorage {
  /**
   * Check for missing DB entries
   * Deletes assets without a DB entry from storage.
   */
  new(): Message;
}
export const CleanUpStorage = Message.create<CleanUpStorage>({
  method: 'POST',
  path: '/asset/cleanup/storage',
  status: [202],
});

interface ListIndexes {
  /**
   * List bucket indexes
   * List all indexes of the given bucket
   *
   * @param bucket The bucket name
   */
  new(bucket: string): Message;
}
export const ListIndexes = Message.create<ListIndexes>({
  method: 'GET',
  path: '/index/:bucket',
  status: [200],
});

interface CreateDropIndex {
  /**
   * Create or drop bucket index
   * Create or drop a index for the given bucket
   *
   * @param bucket The bucket name
   * @param body The massage Content
   */
  new(bucket: string, body?: json): Message;
}
export const CreateDropIndex = Message.create<CreateDropIndex>({
  method: 'POST',
  path: '/index/:bucket',
  status: [202],
});

interface DropAllIndexes {
  /**
   * Drop all indexes
   * Drop all indexes on the given bucket
   *
   * @param bucket The bucket name
   */
  new(bucket: string): Message;
}
export const DropAllIndexes = Message.create<DropAllIndexes>({
  method: 'DELETE',
  path: '/index/:bucket',
  status: [202],
});

interface DeviceRegister {
  /**
   * Method to register a new device
   * Registers a new devices
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const DeviceRegister = Message.create<DeviceRegister>({
  method: 'POST',
  path: '/db/Device/register',
  status: [200],
});

interface DevicePush {
  /**
   * Method to push a message to devices
   * Pushes a message to devices
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const DevicePush = Message.create<DevicePush>({
  method: 'POST',
  path: '/db/Device/push',
  status: [204],
});

interface DeviceRegistered {
  /**
   * Check if device is registered
   * Checks if the device is already registered
   */
  new(): Message;
}
export const DeviceRegistered = Message.create<DeviceRegistered>({
  method: 'GET',
  path: '/db/Device/registered',
  status: [200],
});

interface VAPIDKeys {
  /**
   * Generate VAPID Keys
   * Generate VAPID Keys for web push
   */
  new(): Message;
}
export const VAPIDKeys = Message.create<VAPIDKeys>({
  method: 'POST',
  path: '/config/VAPIDKeys',
  status: [200],
});

interface VAPIDPublicKey {
  /**
   * Get VAPID Public Key
   * Get VAPID Public Key for web push
   */
  new(): Message;
}
export const VAPIDPublicKey = Message.create<VAPIDPublicKey>({
  method: 'GET',
  path: '/config/VAPIDPublicKey',
  status: [200],
});

interface GCMAKey {
  /**
   * Set GCM-API-Key
   * Sets the GCM/FCM API-Key for Android Push
   *
   * @param body The massage Content
   */
  new(body?: string): Message;
}
export const GCMAKey = Message.create<GCMAKey>({
  method: 'POST',
  path: '/config/GCMKey',
  status: [204],
});

interface UploadAPNSCertificate {
  /**
   * Upload APNS certificate
   * Upload APNS certificate for IOS Push
   */
  new(): Message;
}
export const UploadAPNSCertificate = Message.create<UploadAPNSCertificate>({
  method: 'POST',
  path: '/config/APNSCert',
  status: [204],
});

interface ConfigAPI {
  /**
   * Installation Project
   * ##GetInstallationByDomainAndConfigVersion : Returns the complete Installation Object as it would do via the CRUD API
   *
   * @param domain domain to be searched
   * @param configVersion configVersion to be searched
   */
  new(domain: string, configVersion: string): Message;
}
export const ConfigAPI = Message.create<ConfigAPI>({
  method: 'GET',
  path: '/speedkit/installation/:domain/:configVersion',
  status: [200],
});

interface GetInstallationById {
  /**
   * Returns the complete Installation Object which had the given Id as it would do via the CRUD API
   *
   * @param id id to be searched
   */
  new(id: string): Message;
}
export const GetInstallationById = Message.create<GetInstallationById>({
  method: 'GET',
  path: '/speedkit/installation/:id',
  status: [200],
});

interface CreateNewInstallation {
  /**
   * Creates Installation object properties and returns the updated version
   *
   * @param domain domain to be used to create new installation
   * @param body The massage Content
   */
  new(domain: string, body?: json): Message;
}
export const CreateNewInstallation = Message.create<CreateNewInstallation>({
  method: 'POST',
  path: '/speedkit/installation/:domain',
  status: [200],
});

interface UpdateInstallationByDomainAndConfigVersion {
  /**
   * Updates an existing installtion version
   *
   * @param domain domain to be searched
   * @param configVersion configVersion to be searched
   * @param body The massage Content
   */
  new(domain: string, configVersion: string, body?: json): Message;
}
export const UpdateInstallationByDomainAndConfigVersion = Message.create<UpdateInstallationByDomainAndConfigVersion>({
  method: 'PUT',
  path: '/speedkit/installation/:domain/:configVersion',
  status: [200],
});

interface UpdateInstallationById {
  /**
   * Updates an existing installtion version
   *
   * @param id id to be searched
   * @param body The massage Content
   */
  new(id: string, body?: json): Message;
}
export const UpdateInstallationById = Message.create<UpdateInstallationById>({
  method: 'PUT',
  path: '/speedkit/installation/:id',
  status: [200],
});

interface CloneInstallationByDomainAndConfigVersion {
  /**
   * Clone existing installation, update it and return the cloned version with the updated properties
   *
   * @param domain domain
   * @param configVersion configVersion the configuration version
   */
  new(domain: string, configVersion: string): Message;
}
export const CloneInstallationByDomainAndConfigVersion = Message.create<CloneInstallationByDomainAndConfigVersion>({
  method: 'POST',
  path: '/speedkit/installation/:domain/:configVersion/clone',
  status: [200],
});

interface CloneInstallationById {
  /**
   * Clone existing installation, update it and return the cloned version with the updated properties
   *
   * @param id id to be searched
   */
  new(id: string): Message;
}
export const CloneInstallationById = Message.create<CloneInstallationById>({
  method: 'POST',
  path: '/speedkit/installation/:id/clone',
  status: [200],
});

interface ActivateInstallationByDomainAndConfigVersion {
  /**
   * Activate a selected speedKit install configuration version by selecting the current active version of the same domain
   *
   * @param domain domain to be activated
   * @param configVersion configVersion to be activated (current active version of the same domain)
   */
  new(domain: string, configVersion: string): Message;
}
export const ActivateInstallationByDomainAndConfigVersion = Message.create<ActivateInstallationByDomainAndConfigVersion>({
  method: 'POST',
  path: '/speedkit/installation/:domain/:configVersion/activate',
  status: [200],
});

interface ActivateInstallationById {
  /**
   * Activate a selected speedKit install configuration version by selecting the current active version of the same domain
   *
   * @param id Id of a Speed Kit Installation to be activated
   */
  new(id: string): Message;
}
export const ActivateInstallationById = Message.create<ActivateInstallationById>({
  method: 'POST',
  path: '/speedkit/installation/:id/activate',
  status: [200],
});

interface FindSpecificInstallation {
  /**
   * Search for a specific installation
   *
   * @param domain domain to be used to filter
   * @param status status to be used to filter
   * @param start start the amount of configs to skip
   * @param count count the amount of configs to return
   */
  new(domain?: string, status?: string, start?: number, count?: number): Message;
}
export const FindSpecificInstallation = Message.create<FindSpecificInstallation>({
  method: 'GET',
  path: '/speedkit/installation?domain=&status=&start=0&count=-1',
  status: [200],
});

interface GetAllDomains {
  /**
   * Queries the Database for all configured domains
   */
  new(): Message;
}
export const GetAllDomains = Message.create<GetAllDomains>({
  method: 'GET',
  path: '/speedkit/installation/domain',
  status: [200],
});

interface Mail {
  /**
   * Endpoint to send e-mails
   * Send an e-mail with the data given from the object
   *
   * @param body The massage Content
   */
  new(body?: json): Message;
}
export const Mail = Message.create<Mail>({
  method: 'POST',
  path: '/mail',
  status: [200],
});

interface ExecuteQuery {
  /**
   * Executes a raw query
   * Executes the given query and returns a list of matching objects.
   *
   * @param bucket The bucket name
   * @param q The query
   * @param triggeredBy Who or what triggered the query
   */
  new(bucket: string, q: string, triggeredBy?: string): Message;
}
export const ExecuteQuery = Message.create<ExecuteQuery>({
  method: 'GET',
  path: '/db/:bucket/query?q&triggeredBy=',
  status: [200],
});

interface ExecuteQueryPOST {
  /**
   * Executes a raw query
   * Executes the given query and returns a list of matching objects.
   *
   * @param bucket The bucket name
   * @param body The massage Content
   * @param triggeredBy Who or what triggered the query
   */
  new(bucket: string, body?: string, triggeredBy?: string): Message;
}
export const ExecuteQueryPOST = Message.create<ExecuteQueryPOST>({
  method: 'POST',
  path: '/db/:bucket/query?triggeredBy=',
  status: [200],
});
