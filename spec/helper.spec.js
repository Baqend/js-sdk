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

var token = null;
glob.loadRootToken = function() {
  if (token) {
    return Promise.resolve(token);
  } else {
    var emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    return emf.createEntityManager().ready().then(function(em) {
      return em.User.login('root', 'root').then(function() {
        token = em.token;
        return em.token;
      });
    });
  }
};

glob.saveMetamodel = function(metamodel) {
  return loadRootToken().then(function(token) {
    return metamodel.save(token);
  });
};

glob.sleep = function(time, value) {
  return new Promise(function(success) {
    setTimeout(function() {
      success(value);
    }, time);
  });
};