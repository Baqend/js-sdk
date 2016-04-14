<!DOCTYPE html>
<html>
<head>
  <title>Mocha Tests</title>

  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="../node_modules/mocha/mocha.css" />

  <script src="../node_modules/jquery/dist/jquery.js"></script>
  <script src="../node_modules/chai/chai.js" type="text/javascript"></script>
  <script src="../node_modules/chai-as-promised/lib/chai-as-promised.js" type="text/javascript"></script>
  <script src="../node_modules/mocha/mocha.js"></script>
  <script>
    mocha.setup('bdd')
    var expect = chai.expect;
  </script>

  <script src="../build/baqend.js"></script>

  <% _.forEach(scripts, function(src) { %><script type="text/javascript" src="../<%- src %>"></script><% }); %>

  <script>
    onload = function(){
      mocha.checkLeaks();
      mocha.globals(['jQuery', 'ms__*']);
      mocha.run();
    }
  </script>
</head>
<body>
<div id="mocha"></div>
</body>
</html>