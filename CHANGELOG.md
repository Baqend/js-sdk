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