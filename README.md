Baqend JavaScript SDK
=====================
Baqend JavaScript SDK and CLI for High-Performance Websites

* [Docs](https://www.baqend.com/guide/) and [API](https://www.baqend.com/js-sdk/latest/baqend.html)
* [CLI help](https://www.baqend.com/guide/topics/cli/)
* [Dashboard](https://dashboard.baqend.com/register/)

CLI
-----
Baqend provides a CLI to easily manage your app. Install it by typing `npm install -g baqend`.
Afterwards you can use the `baqend` command in your terminal.

If you don't already have a Baqend account, type `baqend register` to create your first app.
Now you can open the dashboard of your app with `baqend dashboard`. To see all the command use `baqend help`.

Setup
-----

To use the Baqend SDK, just include the [baqend.js](//www.baqend.com/js-sdk/latest/baqend.es5.js) or 
[baqend.min.js](//www.baqend.com/js-sdk/latest/baqend.es5.js) from the dist folder
at the bottom of your body.<br>
Alternatively you can install the Baqend SDK with npm. Just type `npm install baqend`<br> 
Or [download the latest release](https://github.com/Baqend/js-sdk/releases/latest) directly from GitHub.

```html
<!-- for legacy browsers -->
<script nomodule type="text/javascript" src="dist/baqend.es5.min.js"></script>
<!-- for browsers with module support -->
<script type="module" src="dist/baqend.es2015.min.js"></script>
```

You can use [unpkg.com](https://unpkg.com/) to directly load the dependency into your browser
```html
<!-- for legacy browsers -->
<script nomodule type="text/javascript" src="https://unpkg.com/baqend@3/dist/baqend.es5.min.js"></script>
<!-- for browsers with module support -->
<script type="module" src="https://unpkg.com/baqend@3/dist/baqend.es2015.min.js"></script>
```

The Baqend SDK provides a global `Baqend` variable by default.

Initialize
----------

Before you can actually use the Baqend SDK, you must link the Baqend SDK to your Baqend Account.
Just call `Baqend.db.connect(<your Baqend APP>)` after including the Baqend SDK.

The Baqend SDK connects to your Baqend and initialize the SDK. If the connection was successfully established
the ready callback will be called, and the `db` can be used to load, query and save objects.

```html
<script type="module">
import { db } from 'https://unpkg.com/baqend@3/dist/baqend.es2015.min.js';

// connects to your Baqend Accounts example app
db.connect('example');

// Or pass false as a second parameter for an unencrypted connection (not recommended)
db.connect('example', false);

// For custom deployments i.e. the community edition use:
db.connect('https://baqend.example.com/v1');

// waits while the SDK connects to your Baqend
await db.ready();

// work with your Baqend instance
db.User.find()

</script>
```

Upgrading from 2.x
-----

If you have previously used our 2.x release you must basically expose the global DB variable manually.
This will provide you with all the exports which was available in the 2.x release of the SDK:
```js
window.DB = Baqend.db;

await DB.connect('<your-app>');
const result = await DB.MyClass.find().resultList();
...
```

We recommend changing your current imports to use the new 
[ES2015 module](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) structure 
of the SDK.
Therefore, you should migrate your code to use the new ES2015 module imports: 
```html
<script type="module">
import { db, util } from 'https://unpkg.com/baqend@3/dist/baqend.es2015.min.js';

await db.connect('<your-app>');
const result = await db.MyClass.find().resultList();
result.forEach(object => {
    ...
})
```

Accessing subpackages of the SDK:
```js
import { util, metamodel } from 'https://unpkg.com/baqend@3/dist/baqend.es2015.min.js';

// generates a random uuid
util.uuid()
```

Baqend Real-Time SDK
--------------------
If you want to use real-time queries, you must include [Rx.js](https://github.com/ReactiveX/rxjs) in your project 
as well. The realtime components are now core part of v3 release of the SDK and no alternative module must be 
used. 

The Rx.js module will be loaded as a optional peer dependency from the global Rx variable 
or will be required via. `require('rxjs')` call.
If rxjs can't be loaded the realtime components of the SDK will throw an exception.

You can use the unpkg CDN to get all dependencies:
```html
<script type="text/javascript" src="https://unpkg.com/rxjs/bundles/rxjs.umd.min.js"></script>
<!-- include the SDK after rxjs -->
<script type="module">
import { db } from 'https://unpkg.com/baqend@3/dist/baqend.es2015.js';

await db.connect('<your-app>');
const observable = db.MyClass.find().resultStream();
observable.subscribe((result) => {
    result.forEach(object => {
        ...
    })
})
</script>
```


Usage in Node.js
----------------

The Baqend SDK can also be used in Node.js. Just do an `npm install baqend` and use 
`require('baqend')` for old node environments or `import { db } from 'baqend'` in your code.

Up to Node.js v12

```javascript
const { db } = require('baqend');

// connects to your Baqend Accounts example app
db.connect('example');

// waits while the SDK connects to your Baqend
db.ready(function() {
    // work with your Baqend
    db.User.find()
        ...
});
```

Node.js v13+

```javascript
import { db } from 'baqend';

// connects to your Baqend Accounts example app 
// and waits while the SDK connects to your Baqend
await db.connect('example');

// work with your Baqend
await db.User.find()
   ...
```

Note: The Baqend Real-Time SDK can be used by just installing Rx.js as well `npm install rxjs`

License
-------

This Baqend SDK is published under the very permissive [MIT license](LICENSE.md)
