Baqend JavaScript SDK
=====================

Setup
-----

To use the Baqend SDK, just include the baqend.js or baqend.min.js from the dist folder
at the bottom of your body.
Alternatively you can install the Baqend SDK with npm. Just type `npm install --save-dev baqend` 

```html
<!-- for development -->
<script type="text/javascript" src="dist/baqend.js"></script>
<!-- for production -->
<script type="text/javascript" src="dist/baqend.min.js"></script>
```

The Baqend SDK provides a global `DB` variable by default.

Initialize
----------

Before you can actually use the Baqend SDK, you must link the Baqend SDK to your Baqend Account.
Just call `DB.connect(<your Baqend URI>)` after including the Baqend SDK.

The Baqend SDK connects to your Baqend and initialize the SDK. If the connection was successfully established
the ready callback will be called and the DB can be used to load, query and save objects.

```html
<script type="text/javascript" src="baqend.js"></script>
<script type="text/javascript">

// connects to your Baqend Account
DB.connect('https://example.baqend.com');

// waits while the SDK connects to your Baqend
DB.ready(function() {
    // work with your Baqend
    DB.User.find()
        ...
});

</script>
```

Usage in Node.js
----------------

The Baqend SDK can also be used in Node.js. Just do an `npm install --save baqend` and use `require('baqend')` in your code.

```javascript
var DB = require('baqend');

// connects to your Baqend Account
DB.connect('https://example.baqend.com');

// waits while the SDK connects to your Baqend
DB.ready(function() {
    // work with your Baqend
    DB.User.find()
        ...
});
```

Building with [browserify](http://browserify.org/)
--------------------------------------------------

Just install baqend with `npm install --save-dev baqend`, `require('baqend')` in your code
and build the Baqend SDK + your code with browserify.

```javascript
var DB = require('baqend');

// connects to your Baqend Account
DB.connect('https://example.baqend.com');

// waits while the SDK connects to your Baqend
DB.ready(function() {
    // work with your Baqend
    DB.User.find()
        ...
});
```

Type `browserify scripts/main.js > scripts/bundle.js` to build your main.js script.
For more advanced building steps visit the [browserify Documentation](https://github.com/substack/node-browserify#usage).

Building with [requirejs](http://requirejs.org/)
------------------------------------------------

Use the Baqend SDK from the /dist folder or install the SDK via npm `npm install --save-dev baqend`.
Add the Baqend SDK as a dependency of your script and use the required Baqend SDK.

```javascript
require(["scripts/baqend.js"], function(DB) {
    // connects to your Baqend Account
    DB.connect('https://example.baqend.com');

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