'use strict';


if (typeof module !== 'undefined') {
  require('./node');

}

describe('Test Transaction', function () {
  var emf, metamodel,rootDb;
  before(function () {
    var personType;

    emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, schema: [], tokenStorage: helper.rootTokenStorage });
    metamodel = emf.metamodel;
    metamodel.addType(personType = new DB.metamodel.EntityType('PersonTable', metamodel.entity(Object)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('age', metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('zip', metamodel.baseType(Number)));
    return metamodel.save();
  });

  before(function () {
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    return emf.createEntityManager().ready().then( function (em) {
      return em.User.login('root', 'root').then(async function () {
        rootDb = em;
        await rootDb.PersonTable.find().equal('name', 'helloworld').resultList(async (data) => {
          for (const tt of data) {
            if (!tt) {
              console.log("Found nothing?!");
            } else {
              await tt.delete();
            }
          }
        });
        let tt = rootDb.PersonTable();
        tt.name = 'helloworld';
        tt.age = 45;
        tt.zip = 8123367;
        await tt.save()
      });
    });
  });

  describe('Builder', function () {
    it('should return transaction id', function () {
      //var q = new rootDb.NativeQuery(rootDb);
      return rootDb.transaction.begin().then(function (data) {
        console.log(data);
      });
    });
  });



});
