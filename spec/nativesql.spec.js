'use strict';


if (typeof module !== 'undefined') {
  require('./node');

}

describe('Test Query SQL', function () {
  var emf, rootDb;

  before(function () {
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    return emf.createEntityManager().ready().then(function (em) {
      return em.User.login('root', 'root').then(function () {
        rootDb = em;
      });
    });
  });

  describe('Builder', function () {
    it('should create simple query sql', function () {
      var q = new rootDb.NativeSQL(rootDb);
      return q.execute('select * from Testtable').then(function (data) {
        for(let i=0; i<data.length;i++)
        {
          console.log(data[i]);
        }
      });
    });
  });
});
