var env = {
  "TEST_SERVER": "https://local.baqend.com:8443/v1"
};

if (typeof module != 'undefined') {
  module.exports = env;
}

var glob = typeof window != 'undefined'? window: global;

glob.makeLogin = function() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return 'user-' + text;
};

glob.randomize = function(name) {
  var rnd = Math.floor(Math.random() * 1000000);
  return name + "_random_" + rnd;
};

glob.rootTokenStorage = null;
before(function() {
  var emf = new DB.EntityManagerFactory(env.TEST_SERVER);
  return emf.createEntityManager().ready().then(function(em) {
    return em.User.login('root', 'root').then(function() {
      glob.rootTokenStorage = em.tokenStorage;
    });
  });
});

glob.sleep = function(time, value) {
  return new Promise(function(success) {
    setTimeout(function() {
      success(value);
    }, time);
  });
};