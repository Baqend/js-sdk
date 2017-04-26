var minimongo = require('minimongo');
var IndexedDb = minimongo.IndexedDb;
var db = new IndexedDb({namespace: "baqend"}, () => {
});
var className;

var CACHE_NAME = 'trillo-v1';
var PREFIX = location.origin;
var REFRESH = 60000; // Bloom filter refresh rate

var bloomFilter;
var bloomFilterReady = false;

self.addEventListener('install', event => {
    // Bypass the waiting lifecycle stage,
    // just in case there's an older version of this SW registration.
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    event.waitUntil(refreshBloomfilter().then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
    var requestUrl = event.request.url;
    var urlDbIndex = requestUrl.indexOf('/db/');
    if (urlDbIndex !== -1) {
        var urlClassIndexStart = urlDbIndex + 4;
        var urlClassIndexEnd = requestUrl.indexOf('/', urlClassIndexStart);
        className = requestUrl.substr(urlClassIndexStart, urlClassIndexEnd - urlClassIndexStart);
        if (navigator.onLine) {
            event.respondWith(
                fetch(event.request).then(function (response) {
                    var clonedResponse = response.clone();
                    if (event.request.method === 'GET' || event.request.method === 'POST' || event.request.method === 'PUT') {
                        clonedResponse.json().then(function (data) {
                            if (Array.isArray(data)) {
                                data.forEach(function (entry) {
                                    saveDataLocally(entry);
                                });
                            } else {
                                saveDataLocally(data);
                            }
                        });
                    } else if (event.request.method === 'DELETE') {
                        deleteLocalEntry(requestUrl);
                    }
                    return response;
                })
            );
        } else {
            event.respondWith(
                Promise.resolve().then(function () {
                    return queryLocalData(requestUrl);
                })
            );
        }
    } else {
        event.respondWith(
            caches.match(event.request, {ignoreVary: true}).then(cachedResponse => {
                if (cachedResponse) {
                    return handleCacheHit(event.request, cachedResponse);
                } else {
                    return handleCacheMiss(event.request);
                }
            })
        );    // refresh bloom filter async.
        if (bloomFilterReady && (!bloomFilter || (bloomFilter.creation + REFRESH) < Date.now())) {
            bloomFilterReady = false;
            refreshBloomfilter();
        }
    }
});

function saveDataLocally(data) {
    db.addCollection(className, function () {
        db[className].findOne({id: data.id}, {}, function (result) {
            if (result) {
                db[className].remove(result._id, function (res) {
                });
            }
            db[className].upsert(data, function () {
            });
        });
    });
};

function deleteLocalEntry(requestUrl) {
    var entryId = '/db/' + className + '/' + requestUrl.substr(requestUrl.lastIndexOf('/') + 1);
    db.addCollection(className, function () {
        db[className].findOne({id: entryId}, {}, function (result) {
            db[className].remove(result._id, function (res) {
            });
        });
    });
}

function queryLocalData(requestUrl) {
    var localQueryResult;
    var promise = new Promise(function (resolve, reject) {
        var queryString = JSON.parse(getParameterOfUrlByName(requestUrl, 'q'));
        var sortBy = JSON.parse(getParameterOfUrlByName(requestUrl, 'sort'));
        var limit = JSON.parse(getParameterOfUrlByName(requestUrl, 'count'));
        limit = limit < 0 ? 0 : limit;
        db.addCollection(className, function () {
            db[className].find(queryString, {limit: limit}, {sort: sortBy}).fetch(function (result) {
                localQueryResult = result;
                resolve();
            });
        });
    });

    return promise.then(() => {
        return new Response(JSON.stringify(localQueryResult));
    });
};

function getParameterOfUrlByName(url, name) {
    url = decodeURIComponent(url);
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return results[2].replace(/\+/g, '%20');
};


function refreshBloomfilter() {
    return fetch(PREFIX + '/v1/bloomfilter', {cache: 'default'}).then(response => {
        if (response.status !== 200) {
            throw new Error('Bloomfilter not fetched, status: ' + response.status);
        }

        // Examine the text in the response
        return response.json().then(data => {
            bloomFilter = new BloomFilter(data);
            bloomFilterReady = true;
        });
    }).catch(err => {
        setTimeout(() => bloomFilterReady = true, 5000);
    })
}

function handleCacheHit(request, cachedResponse) {
    if (navigator.onLine) {
        return isFresh(request).then(fresh => {
            if (fresh && !isInBloomFilter(request)) {
                return cachedResponse;
            } else {
                var revalidate = new Request(request.url, {cache: 'reload'});
                return fetch(revalidate).then(response => {
                    return cacheResponse(revalidate, response);
                });
            }
        });
    } else {
        return cachedResponse;
    }
}

function isFresh(request) {
    return caches.match(request.url + '_bq_expiring').then(expireResponse => {
        if (expireResponse) {
            var expiration = expireResponse.headers.get('expires');
            return Date.now() < expiration;
        }
        return false;
    });
}

function handleCacheMiss(request) {
    if (navigator.onLine) {
        var revalidation = isInBloomFilter(request)? 'reload' : "default";
        var getRequest = new Request(request.url, {cache: revalidation});
        return fetch(getRequest).then(response => {
            return cacheResponse(getRequest, response);
        });
    } else {
        var headers = {};
        headers['Status'] = 408;
        var cacheMissResponse = new Response(null, {headers});
        return cacheMissResponse;
    }
}

function cacheResponse(request, response) {
    return caches.open(CACHE_NAME).then(cache => {
        return setExpireDate(request, response).then(() => {
            cache.put(request, response.clone());
            return response;
        })
    });
}

function setExpireDate(request, response) {
    var expireDate = Date.now();

    var cacheControl = response.headers.get('cache-control');
    if (cacheControl) {
        var age = response.headers.get('age') || 0;
        var maxAge = getMaxAge(cacheControl);

        expireDate = expireDate + (maxAge - age) * 1000;
    }

    return caches.open(CACHE_NAME).then(cache => {
        var expireResponse = new Response(null, {headers: {expires: expireDate}});
        return cache.put(request.url + '_bq_expiring', expireResponse);
    });
}

function getMaxAge(cacheControl) {
    var cacheControlArray = cacheControl.split(", ");
    var maxAge = 0;
    //Parse max-age value from Cache-Control-Header
    for (var i = 0; i < cacheControlArray.length; i++) {
        if (cacheControlArray[i].includes('max-age')) {
            maxAge = cacheControlArray[i].substr(cacheControlArray[i].indexOf('=') + 1, cacheControlArray[i].length - cacheControlArray[i].indexOf('='));
            maxAge = parseInt(maxAge);
        }
    }
    return maxAge;
}

function isInBloomFilter(request) {
    if (bloomFilter) {
        var url = request.url.replace(/^https:\/\/[0-9a-zA-Z\.-]+\//i, '/file/www/');

        return bloomFilter.contains(url);
    }
    return true;
}

class BloomFilter {
    constructor(rawBF) {
        this.bytes = atob(rawBF.b);
        this.bits = rawBF.m;
        this.hashes = rawBF.h;
        this.creation = new Date().getTime();
    }

    contains(element) {
        for (var _iterator = this._getHashes(element, this.bits, this.hashes), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator](); ;) {
            var _ref;

            if (_isArray) {
                if (_i >= _iterator.length) break;
                _ref = _iterator[_i++];
            } else {
                _i = _iterator.next();
                if (_i.done) break;
                _ref = _i.value;
            }

            var hash = _ref;

            if (!this._isSet(hash)) {
                return false;
            }
        }
        return true;
    }

    _isSet(index) {
        var pos = Math.floor(index / 8);
        var bit = 1 << index % 8;
        //Extract byte as int or NaN if out of range
        var byte = this.bytes.charCodeAt(pos);
        //Bit-wise AND should be non-zero (NaN always yields false)
        return (byte & bit) != 0;
    }

    _getHashes(element, bits, hashes) {
        var hashValues = new Array(this.hashes);
        var hash1 = this._murmur3(0, element);
        var hash2 = this._murmur3(hash1, element);
        for (var i = 0; i < hashes; i++) {
            hashValues[i] = (hash1 + i * hash2) % bits;
        }
        return hashValues;
    }

    _murmur3(seed, key) {
        var remainder, bytes, h1, h1b, c1, c2, k1, i;
        remainder = key.length & 3;
        bytes = key.length - remainder;
        h1 = seed;
        c1 = 0xcc9e2d51;
        c2 = 0x1b873593;
        i = 0;

        while (i < bytes) {
            k1 = key.charCodeAt(i) & 0xff | (key.charCodeAt(++i) & 0xff) << 8 | (key.charCodeAt(++i) & 0xff) << 16 | (key.charCodeAt(++i) & 0xff) << 24;
            ++i;

            k1 = (k1 & 0xffff) * c1 + (((k1 >>> 16) * c1 & 0xffff) << 16) & 0xffffffff;
            k1 = k1 << 15 | k1 >>> 17;
            k1 = (k1 & 0xffff) * c2 + (((k1 >>> 16) * c2 & 0xffff) << 16) & 0xffffffff;

            h1 ^= k1;
            h1 = h1 << 13 | h1 >>> 19;
            h1b = (h1 & 0xffff) * 5 + (((h1 >>> 16) * 5 & 0xffff) << 16) & 0xffffffff;
            h1 = (h1b & 0xffff) + 0x6b64 + (((h1b >>> 16) + 0xe654 & 0xffff) << 16);
        }

        k1 = 0;

        switch (remainder) {
            case 3:
                k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
            case 2:
                k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
            case 1:
                k1 ^= key.charCodeAt(i) & 0xff;

                k1 = (k1 & 0xffff) * c1 + (((k1 >>> 16) * c1 & 0xffff) << 16) & 0xffffffff;
                k1 = k1 << 15 | k1 >>> 17;
                k1 = (k1 & 0xffff) * c2 + (((k1 >>> 16) * c2 & 0xffff) << 16) & 0xffffffff;
                h1 ^= k1;
        }

        h1 ^= key.length;

        h1 ^= h1 >>> 16;
        h1 = (h1 & 0xffff) * 0x85ebca6b + (((h1 >>> 16) * 0x85ebca6b & 0xffff) << 16) & 0xffffffff;
        h1 ^= h1 >>> 13;
        h1 = (h1 & 0xffff) * 0xc2b2ae35 + (((h1 >>> 16) * 0xc2b2ae35 & 0xffff) << 16) & 0xffffffff;
        h1 ^= h1 >>> 16;

        return h1 >>> 0;
    }
}