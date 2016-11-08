Baqend JavaScript SDK
=====================

Setup
-----

To use the Baqend SDK, just include the [baqend.js](//baqend.global.ssl.fastly.net/js-sdk/latest/baqend.js) or 
[baqend.min.js](//baqend.global.ssl.fastly.net/js-sdk/latest/baqend.min.js) from the dist folder
at the bottom of your body.<br>
Alternatively you can install the Baqend SDK with npm. Just type `npm install --save-dev baqend`<br> 
Or install with bower `bower install --save-dev baqend` <br>
Or [download the latest release](https://github.com/Baqend/js-sdk/releases/latest) directly from GitHub.

```html
<!-- for development -->
<script type="text/javascript" src="dist/baqend.js"></script>
<!-- for production -->
<script type="text/javascript" src="dist/baqend.min.js"></script>
```

You can also include it from our CDN-Provider `fastly`.
```html
<!-- for development -->
<script type="text/javascript" src="//www.baqend.com/js-sdk/latest/baqend.js"></script>
<!-- for production -->
<script type="text/javascript" src="//www.baqend.com/js-sdk/latest/baqend.min.js"></script>
```

The Baqend SDK provides a global `DB` variable by default.

Initialize
----------

Before you can actually use the Baqend SDK, you must link the Baqend SDK to your Baqend Account.
Just call `DB.connect(<your Baqend APP>)` after including the Baqend SDK.

The Baqend SDK connects to your Baqend and initialize the SDK. If the connection was successfully established
the ready callback will be called and the DB can be used to load, query and save objects.

```html
<script type="text/javascript" src="baqend.js"></script>
<script type="text/javascript">

// connects to your Baqend Accounts example app
DB.connect('example');

// Or pass true as a second parameter for an encrypted connection
DB.connect('example', true);

// For custom deployments i.e. the community edition use:
DB.connect('https://baqend.example.com/v1');

// waits while the SDK connects to your Baqend
DB.ready(function() {
    // work with your Baqend
    DB.User.find()
        ...
});

</script>
```

Baqend Streaming SDK

If you want to use the realtime streaming queries, you have to either use `baqend-streaming.js` or 
`baqend-streaming.min.js` for production.

In Addition, you must include [Rx.js](https://github.com/ReactiveX/rxjs) v5 into your project. 
As minimal setup, the rxjs Observable is required.
You can use the unpkg CDN:

```html
<script type="text/javascript" src="//unpkg.com/@reactivex/rxjs@5.0.0-rc.2/dist/global/Rx.js"></script>
<!-- include the SDK after rxjs -->
<script type="text/javascript" src="//www.baqend.com/js-sdk/latest/baqend-streaming.js"></script>
```

Usage in Node.js
----------------

The Baqend SDK can also be used in Node.js. Just do an `npm install --save baqend` and use `require('baqend')` in your code.

```javascript
var DB = require('baqend');

// connects to your Baqend Accounts example app
DB.connect('example');

// waits while the SDK connects to your Baqend
DB.ready(function() {
    // work with your Baqend
    DB.User.find()
        ...
});
```

Note: The Baqend Streaming SDK can be required with `var DB = require('baqend/streaming');`, ensure that you only 
require either the Baqend SDK or the Baqend Streaming SDK and not both.



Building with [browserify](http://browserify.org/)
--------------------------------------------------

Just install baqend with `npm install --save-dev baqend`, `require('baqend')` in your code
and build the Baqend SDK + your code with browserify.

```javascript
var DB = require('baqend');

// connects to your Baqend Accounts example app
DB.connect('example');

// waits while the SDK connects to your Baqend
DB.ready(function() {
    // work with your Baqend
    DB.User.find()
        ...
});
```

Note: The Baqend Streaming SDK can be required with `var DB = require('baqend/streaming');`, ensure that you only 
require either the Baqend SDK or the Baqend Streaming SDK and not both.

Type `browserify scripts/main.js > scripts/bundle.js` to build your main.js script.
For more advanced building steps visit the [browserify Documentation](https://github.com/substack/node-browserify#usage).

Building with [requirejs](http://requirejs.org/)
------------------------------------------------

Use the Baqend SDK from the /dist folder or install the SDK via npm `npm install --save-dev baqend`.
Add the Baqend SDK as a dependency of your script and use the required Baqend SDK.

```javascript
require(["scripts/baqend.js"], function(DB) {
    // connects to your Baqend Account
    DB.connect('example');

    // waits while the SDK connects to your Baqend
    DB.ready(function() {
        // work with your Baqend
        DB.User.find()
            ...
    });
});
```

For more advanced usage of requirejs visit the [requirejs Documentation](http://requirejs.org/docs/start.html).

License
-------

This Baqend SDK is published under the very permissive [MIT license](LICENSE.md)