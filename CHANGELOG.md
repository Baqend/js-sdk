# 3.3.0-prerelease.6 (2023-12-11)


### Bug Fixes

* add network fail handler a3f3ffc
* cache replacement handling in webkit based engines f248eb8


### Features

* implement support for Blob's in Node.js 6cb2de1

# 3.3.0-prerelease.5 (2023-10-04)


### Bug Fixes

* remove internal git links from changelog 1093b54

# 3.3.0-prerelease.4 (2023-10-04)


### Bug Fixes

* readd repository url to package json (eb95a9f)
* the repository url env variable (c82e0c5)

# 3.3.0-prerelease.3 (2023-10-04)


### Bug Fixes

* change repository url for the change logs (1afe285)

# 3.3.0-prerelease.2 (2023-10-04)


### Bug Fixes

* add gitlab back to the release steps (bd7b42b)
* change the commit references in the changelog (1070d18)

# 3.3.0-prerelease.1 (2023-10-04)


### Features

* **cli:** Create the file bucket on  deployments if it doesn't exist (9429f53)
* **cli:** Improve the sso login flow (422730c)
* **cli:** Improve typings generation (c17b411)
* **cli:** Make generated typing constructors more future complete (7052f5f)
* **cli:** Make generated typings JSON Objects / Arrays more typescript friendly (b5c81f2)
* **cli:** Migrate to the new token endpoint (2591a4b)
* **cli:** Sync schema ACLs back by the deploy command (4348fb6)
* **cli:** Use in every place inquirer (9045fa4)
* **messages:** Add new Server endpoints (d6508a0)
* **messages:** Generate new version of message from current server (c35fa4e)

<a name="v3.2.0"></a>
# v3.2.0 (2022-5-20)


### Bug Fixes

* Fix a bug where ACL changes on objects aren't detected correctly as a change 
* Remove legacy gzip handling from the SDK
* Ensure that a relogin will expose the correct user object (previously it was in some cases null)
* Some typing errors in the CLI and lib

### Features

* Change the connect API for CORS communication to the POST endpoint, to prevent security tokens exposed in the referrer header
* Bump several dependencies and upgrade typescript version

<a name="v3.1.4"></a>
# v3.1.4 (2021-7-21)


### Bug Fixes

* Fix an issue in the CLI that the first file in the latest release is not deployed 

<a name="v3.1.3"></a>
# v3.1.3 (2021-7-14)


### Bug Fixes

* Improve several error messages in the CLI
* Fix an issue that a successful deployment with the CLI ends with an error message

<a name="v3.1.2"></a>
# v3.1.2 (2021-7-7)


### Bug Fixes

* Make node happy again with the esm bundle
* Add another package entry point to allow the baqend cli to be imported with baqend/cli as well

<a name="v3.1.1"></a>
# v3.1.1 (2021-7-2)


### Bug Fixes

* CLI: Fix entry point in the package.json to launch the CLI correctly again

<a name="v3.1.0"></a>
# v3.1.0 (2021-6-24)


### Bug Fixes

* Upgrade to Typescript 4.2 and fix some bugs in the Type definitions

### Features

* Integrate the new and simplified OAuth implementation which prepares the support for the device OAuth flow
* Refactored the CLI to Typescript and simplified the implementation
* Integrate the OAuth/SSO login flow in the baqend CLI

<a name="v3.0.0"></a>
# v3.0.0 (2021-2-13)


### Braking Changes

* `File.url -> string` was removed and replaced with an asynchronous implementation `file.createURL() -> Promise<string>` This Change was necessary by migration from cryptojs dependency to the native implementation of Browser/Node APIs. 
* To reduce the overall package size, all Shims are not bundled and shipped anymore. Adding a Promise shim on old Browsers must be done manually now
* If you have previously relied on the global DB variable, you must expose the global DB variable manually now. Consult the README for required migration steps.

### Bug Fixes

* Fix a bug that misaligned messages send to the connect script causes exceptions. Those messages will be ignored now
* Fix a bug where not all file metadata was correctly parsed

### Features

* Completely rewritten code of the core parts in TypeScript, which results in much better typings
* Provide the SDK as a bundle ECMAScript Module and as a CommonJS Module
* Use SSL connections per default, can be opted out by using `db.connect('<app>', false)`
* A new Proxy implementation of the Object entities, which improve the compatibility with frontend storage frameworks like redux or vuex
* Update validator and rxjs dependencies to the latest version and make them completely optional in the bundles
* Splits the util package into util and intersection module to remove cycle dependencies
* Replace Grunt with Webpack as the package bundler
* Move the documentation from JSDoc to TSDoc
* Move from TSLint to ESLint and fix all linting errors


<a name="v2.14.1"></a>
# v2.14.1 (2020-6-12)


### Bug Fixes

* fix(Node): Fix dependencies, bump dependency versions

<a name="v2.14.0"></a>
# v2.14.0 (2020-6-10)


### Bug Fixes

* fix(typings): Generate correct File metadata typings
* fix(node-connector): Trim cookie parts to allow spaces
* fix(oauth): Bump Facebook and LinkedIn API versions

### Features
 
* feat(typings): Generate Typings for dotted class names (e.g. Device.Type) as well
* feat(oauth): Add Salesforce as OAuth provider

### Miscellaneous

* chore(node): Update dependencies

<a name="v2.13.0"></a>
# v2.13.0 (2018-9-20)


### Bug Fixes

* Avoid exceptions when closing a websocket connection
* Fix file metadata (was sometimes fetched and saved incorrectly)

### Features

* Major typing overhaul and improved documentation in query namespace
* Add no-polyfill builds

### Miscellaneous

* Major refactoring & add ESLint for unifying code style
* Deprecate several internal APIs

<a name="v2.12.3"></a>
# v2.12.3 (2018-8-9)


### Bug Fixes

* CLI: fix a bug that a missing profile file crashes the login call
* Typings: fix typings for Entity#partialUpdate and PartialUpdateBuilder#set



<a name="v2.12.2"></a>
# v2.12.2 (2018-8-4)


### Bug Fixes

* SDK: Fix a potential bug while handling resubscriptions after connection loss
* CLI: Fix an ugly deprecation warning when baqend credentials are stored

### Features

* CLI: Add a `cp` command to copy files between apps and the local file system

<a name="v2.12.1"></a>
# v2.12.1 (2018-7-3)


### Bug Fixes

* CLI: Prompt before the user can replace the entire schema
* CLI: Fix signup handling
* Docs: Document vibrate options on push notifications 

<a name="v2.12.0"></a>
# v2.12.0 (2018-6-7)


### Bug Fixes

* CLI: Improve error handling and reflect them with a proper exit code

### Features

* SDK: Add WebPush support 
* SDK: Improve the Device#register method to support all WebPush message properties
* CLI: Add `BAQEND_TOKEN` and `BAT` as new environment variables which can be used to provide Baqend credentials to the CLI for automation 

<a name="v2.11.0"></a>
# v2.11.0 (2018-5-15)


### Bug Fixes

* Typings: Fix some Typing and jsdoc errors
* CLI: Fix File references are incorrectly typed in the generated typings model
* CLI: ignore hidden files while deploying code
* Docs: Update to latest jsdoc version

### Features

* SDK: Add File#toJSON and File#fromJSON and fix the existing behavior
* CLI: Allow download of baqend code

<a name="v2.10.0"></a>
# v2.10.0 (2018-3-9)


### Features

* Add an API to request and revoke API tokens, which do not have an expiration time
* Allow setting custom HTTP headers on uploaded Files

<a name="v2.9.2"></a>
# v2.9.2 (2018-2-2)


### Bug Fixes

* Fix resource token generation if the URL contains URL encoded characters

<a name="v2.9.1"></a>
# v2.9.1 (2018-1-22)


### Bug Fixes

* CLI: Print the app name if the app was not found

### General

* Update SDK Docs to latest layout

<a name="v2.9.0"></a>
# v2.9.0 (2017-11-16)


### Features

* Add a new progress which allows changing the username when E-Mail verification is enabled

<a name="v2.8.7"></a>
# v2.8.7 (2017-11-1)


### Bug Fixes

* Fix realtime reconnect was not using a backoff
* Ignore classes with namespaces in typing generation

<a name="v2.8.6"></a>
# v2.8.6 (2017-9-18)


### Features

* Fixed compability with React Native
* Add experimental FetchConnector

### Bug Fixes

* Fix search in documentation

<a name="v2.8.5"></a>
# v2.8.5 (2017-9-13)


### Other

* New docs styling

<a name="v2.8.4"></a>
# v2.8.4 (2017-9-12)


### Bug Fixes

* Support deletion of file folders

<a name="v2.8.3"></a>
# v2.8.3 (2017-9-4)


### Bug Fixes

* Small fixes in typings

### Features

* Implement Entity#getReferencing() to query reversed references

<a name="v2.8.2"></a>
# v2.8.2 (2017-7-17)


### Bug Fixes

* CLI: Allow custom hosted baqend instances as app parameter

<a name="v2.8.1"></a>
# v2.8.1 (2017-7-7)


### Bug Fixes

* Fixed compatibility issues with node 4

<a name="v2.8.0"></a>
# v2.8.0 (2017-6-28)


### Bug Fixes

* Fix createdAt and updatedAt are not loaded by inserts and aren't updated after updates
* Fix Fusetools incompatibilities 

### Features

* Introduces Baqends Partial Update API

<a name="v2.7.3"></a>
# v2.7.3 (2017-6-12)


### Bug Fixes

* Added missing field documentations
* Handle on progress callback correctly for react native

<a name="v2.7.2"></a>
# v2.7.2 (2017-6-7)


### Bug Fixes

* fixed toJSON for references in embedded objects

### Features

* Support class and field metadata annotations
* Allow schema upload and download via CLI

<a name="v2.7.1"></a>
# v2.7.1 (2017-5-16)


### Bug Fixes

* Fixed toJSON for ACL values
* Compatibility fixes for react native
* Minor bug fixes

### Features

* Added depth parameter to fromJSON and toJSON methods

<a name="v2.7.0"></a>
# v2.7.0 (2017-4-21)


### Bug Fixes

* fix duplicated connect call on cross domain connections 
* fix token renew properly when token comes from local cache 
* fix CLI login for accounts with multiple apps

### Features

* new real-time API based on observables
* self-maintaining real-time queries

<a name="v2.6.4"></a>
# v2.6.4 (2017-3-30)


### Bug Fixes

* Ignore bodies of 204 responses since some intermediate proxies send invalid content in some cases


<a name="v2.6.3"></a>
# v2.6.3 (2017-3-24)


### Features

* CLI: Register an account with the new "register" command
* CLI: Open the dashboard with the new "dashboard" command
* CLI: Open your app with the new "open" command
* CLI: Using default app if only one has been started

<a name="v2.6.2"></a>
# v2.6.2 (2017-3-21)


### Bug Fixes

* Fix newPassword logouts a user if the provided credentials wasn't valid

<a name="v2.6.1"></a>
# v2.6.1 (2017-3-16)


### Bug Fixes

* Let the SDK work properly under React Native
* Auto login the user after he has successfully reset his password and make the login behavior configurable
* Handle unauthorized errors in the CLI properly

### Features

* Allow to specify the bucket path in the CLI for file deployments

<a name="v2.6.0"></a>
# v2.6.0 (2017-2-6)


## If your app was created after Feburary 06 2017, the minimum required SDK version 2.6.0.

### Features

* Using new connection string. Your app is now accessible via HTTPS and HTTP/2 at <appname>.app.baqend.com.
* Added function to request a reset password e-mail.

<a name="v2.5.1"></a>
# v2.5.1 (2017-1-26)


### Bug Fixes

* Fix file object creation while resolving file references
* Add createdAt and updatedAt to typings
* Make typings compatible to Angular 2 AOT compiling

<a name="v2.5.0"></a>
# v2.5.0 (2017-1-6)


### Bug Fixes

* API documentation and typing fixes
* Replace deprecated node-uuid with uuid module 

### Features

* Add File as a new type in the schema
* Introduce File#createdAt for files
* Add db.User.loginWithToken to allow token based logins, when the token is provided externally
* Add support for external OAuth login, useful for logins within native and hybrid Apps

<a name="v2.4.3"></a>
# v2.4.3 (2016-11-28)


### Bug Fixes

* Fix change tracking of collections not working properly in some cases
* Fix OAuth handling is sometimes broken in IE 11 when used via iframe

### Features

* Add `eq` and `ne` as new aliases for `equal` and `notEqual`

<a name="v2.4.2"></a>
# v2.4.2 (2016-11-9)


### Bug Fixes

* Readd missing CLI dependencies
* Better Observable fallback handling for the streaming SDK

<a name="v2.4.1"></a>
# v2.4.1 (2016-11-9)


### Bug Fixes

* DB was not properly exposed in the SDK distribution 
* include an observable shim as fallback and make the used implementation configurable


<a name="v2.4.0"></a>
# v2.4.0 (2016-11-8)


### Bug Fixes

* Add missing typings declarations

### Features

* The Baqend CLI is production-ready
* Split the SDK in Core and Streaming parts
* Introduce the new Streaming API based on Rx.js

<a name="v2.3.1"></a>
# v2.3.1 (2016-10-13)


### Bug Fixes

* Fixed login and register in safari incognito mode 

<a name="v2.3.0"></a>
# v2.3.0 (2016-10-4)


### Bug Fixes

* Handle etags of gzipped content correctly
* let newPromise return the user object
* do not use iframe connections on same domain
* Some doc fixes

### Features

* Introduce a progress callback for file uploads
* acle methods are variadic now
* update core-js to 2.4.1 and validate to 4.9.0

<a name="v2.2.3"></a>
# v2.2.3 (2016-8-24)


### Bug Fixes

#### CLI
* Fixed upload of non default file and code folder

### Features

#### CLI
* Using 'baqend' instead of 'code' as default folder
* Switched to commander as argument parser

<a name="v2.2.2"></a>
# v2.2.2 (2016-8-22)


### Bug Fixes

* Prevent Webpack from using the node connector while building from sources
* Handle the cache controll of the connect script correctly

### Features

* Introduce the Baqend CLI (login, deploy, typings)

<a name="v2.2.1"></a>
# v2.2.1 (2016-8-11)


### Bug Fixes

* Add missing File#size attribute

### Features

* The File API is now supported in node

<a name="v2.2.0"></a>
# v2.2.0 (2016-8-2)


### Bug Fixes

* Improved es6 shimming for better compatibility with angular 2

### Features

* Added Typescript support and typings
* File and bucket listining is now supported

<a name="v2.1.0"></a>
# v2.1.0 (2016-6-23)


### Bug Fixes

* Many jsdoc errors are fixed

### Features

* Introduce a File API client (IE 10+)
* Enable client caching and complete the BloomFilter based cache invalidations

<a name="v2.0.1"></a>
# v2.0.1 (2016-4-26)


### Bug Fixes

* Handle logout of cookie-based sessions correctly
* Better peerdependency handling of the websocket node module

<a name="v2.0.0"></a>
# v2.0.0 (2016-4-19)


### Bug Fixes

* Improved collection handling and type casting

### Features

* The sdk is ported to a es6 and is transpiled with babel to es5. But there are no breaking API changes therefore you can silently upgrade in most cases.
* If you like to use the es6 code base and want to transpile the es6 code by yourself, require the lib/baqend.js directly.

### Breaking changes

* DB.List is now a native Array
 * therefore the `new Array(<iterable>)` constructor is gone and should be replaced with `Array.from(<iterable>)`
 * list.get/add/delete/size must be replaced by the corresponding native array functions and you can use the index based access of lists, i.e. `list[0] = 'val'`

<a name="v1.1.1"></a>
# v1.1.1 (2016-4-5)


### Bug Fixes

* Add missing login option for OAuth login

<a name="v1.1.0"></a>
# 1.1.0 (2016-04-01)


### Bug Fixes

* Keep session active after reload in safari and ie
* Handle connection errors correctly

### Features

* Use WebStorage instead of Cookies to persist session tokens
* Implement resource tokens for a one time resource based authorization

### Notes

* This version works only with the Baqend Server 1.1+

<a name="v1.0.0"></a>
# 1.0.0 (2016-02-17)


### Features

* First release
* Introduce a CRUD, Query, User/Role/ACL, Schema and Logging API
