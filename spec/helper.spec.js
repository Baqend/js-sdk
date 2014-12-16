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
  return name + rnd;
};

glob.saveMetamodel = function(metamodel, force) {
  var emf = new baqend.EntityManagerFactory(env.TEST_SERVER);
  return emf.createEntityManager().then(function(em) {
    return em.User.login('root', 'root').then(function() { return em; });
  }).then(function(em) {
    return metamodel.save(force, em.token);
  });
};