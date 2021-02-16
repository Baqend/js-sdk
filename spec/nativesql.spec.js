'use strict';


if (typeof module !== 'undefined') {
  require('./node');

}

describe('Test Query SQL', function () {
  var emf, metamodel,rootDb;
  before(function () {
    var personType, addressType;

    emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, schema: [], tokenStorage: helper.rootTokenStorage });
    metamodel = emf.metamodel;

    metamodel.addType(personType = new DB.metamodel.EntityType('TestTable', metamodel.entity(Object)));
    metamodel.addType(addressType = new DB.metamodel.EmbeddableType('QueryAddress'));

    personType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('person', personType));
    personType.addAttribute(new DB.metamodel.SingularAttribute('address', addressType));
    personType.addAttribute(new DB.metamodel.SingularAttribute('age', metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('date', metamodel.baseType(Date)));
    personType.addAttribute(new DB.metamodel.ListAttribute('colors', metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('birthplace', metamodel.baseType(DB.GeoPoint)));

    addressType.addAttribute(new DB.metamodel.SingularAttribute('zip', metamodel.baseType(Number)));
    addressType.addAttribute(new DB.metamodel.SingularAttribute('city', metamodel.baseType(String)));

    return metamodel.save();
  });

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
      return q.execute('select * from TestTable where name = \'cvcvxz\'').then(function (data) {
        expect(data).eql([{
          fields: [
            { name: 'id', value: 3 },
            { name: '_version', value: 1 },
            { name: '_acl', value: '{"read":{},"write":{}}' },
            { name: '_createdat', value: 'Feb 9, 2021, 11:17:28 AM' },
            { name: '_updatedat', value: 'Feb 9, 2021, 11:17:28 AM' },
            { name: 'name', value: 'cvcvxz' },
            { name: 'age', value: 45 },
            { name: 'person' },
            { name: 'address' },
            { name: 'date' },
            { name: 'birthplace' }
          ]
        }]);
      });
    });
  });
});
