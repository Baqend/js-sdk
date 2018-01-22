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