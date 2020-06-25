<!DOCTYPE html>
<html>
<head>
  <title>Mocha Tests</title>

  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="../node_modules/mocha/mocha.css" />

  <script src="./node_modules/jquery/dist/jquery.js"></script>
  <script src="./node_modules/chai/chai.js" type="text/javascript"></script>
  <script src="./chai-as-promised.js" type="text/javascript"></script>
  <script src="./node_modules/mocha/mocha.js"></script>
  <script>
    mocha.setup('bdd')
    var expect = chai.expect;
    chai.use(chaiAsPromised);
    chai.config.includeStack = true;
  </script>

  <!-- <script type="module" src="./dist/bundles/baqend.es2015.js"></script>
  <script type="module">
    import DB from './dist/bundles/baqend.es2015.js';
    window.DB = DB;
  <script nomodule src="./dist/bundles/baqend.es5.js"></script>
  </script> -->
  <script src="./node_modules/rxjs/bundles/rxjs.umd.js"></script>
  <script src="./node_modules/validator/validator.js"></script>
  <script src="./dist/bundles/baqend.es5.js"></script>
  <script src="./spec/env.js"></script>

  <script>
    var server = location.search.match(/server=([^&]+)/);
    env.TEST_SERVER = server? decodeURIComponent(server[1]): env.TEST_SERVER;
  </script>

  <script src="./spec/helper.js"></script>

  <% _.forEach(testScripts, function(src) { %><script type="text/javascript" src="./spec/<%- src %>"></script><% }); %>

  <script>
    onload = function(){
      document.getElementById('server').value = env.TEST_SERVER;
      var grep = location.search.match(/grep=([^&]+)/);
      document.getElementById('grep').value = grep? decodeURIComponent(grep[1]): '';

      mocha.checkLeaks();
      mocha.globals(['jQuery', 'ms__*', '$*', '__*', 'Rx']);
      mocha.run();
    }
  </script>
</head>
<body>
<form action="">
  <label for="server">Server: </label>
  <input id="server" type="text" name="server">
  <input id="grep" type="hidden" name="grep">
  <button type="submit">Change Server</button>
</form>
<div id="mocha"></div>
</body>
</html>