<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mocha Tests</title>
  <link rel="stylesheet" href="../node_modules/mocha/mocha.css" />
</head>
<body>
<div id="mocha"></div>
<script src="../node_modules/jquery/dist/jquery.js"></script>
<script src="../node_modules/chai/chai.js" type="text/javascript"></script>
<script src="../node_modules/chai-as-promised/lib/chai-as-promised.js" type="text/javascript"></script>
<script src="../node_modules/mocha/mocha.js"></script>
<script>
  var expect = chai.expect;
  mocha.setup('bdd')
</script>

<script src="../build/baqend.js"></script>

<% _.forEach(scripts, function(src) { %><script type="text/javascript" src="../<%- src %>"></script><% }); %>

<script>
  mocha.checkLeaks();
  mocha.globals(['jQuery', 'ms__*']);
  mocha.run();
</script>
</body>
</html>