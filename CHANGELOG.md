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