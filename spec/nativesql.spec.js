'use strict';


if (typeof module !== 'undefined') {
  require('./node');

}

describe('Test Query SQL', function () {
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
    return emf.createEntityManager().ready().then(function (em) {
      return em.User.login('root', 'root').then(function () {
        rootDb = em;
        rootDb.PersonTable.find().equal('name', 'helloworld').resultList((data) => {
          data.forEach(function(tt) {
            if (!tt) {
              console.log("Found nothing?!");
            } else {
              tt.delete();
            }
          });
        });

        var tt = rootDb.PersonTable();
        tt.name = 'helloworld';
        tt.age = 45;
        tt.zip = 8123367;
        tt.save()
      });
    });
  });

  describe('Builder', function () {
    it('should create simple query sql with where clause name', function () {
      var q = new rootDb.NativeSQL(rootDb);
      return q.execute('select * from PersonTable where name = \'helloworld\' ').then(function (data) {
        expect(data[0].fields[5].value).eql('helloworld');
        expect(data[0].fields[6].value).eql(45);
        expect(data[0].fields[7].value).eql(8123367);
      });
    });
  });

  describe('Builder', function () {
    it('should create simple query sql with where clause age', function () {
      var q = new rootDb.NativeSQL(rootDb);
      return q.execute('select * from PersonTable where age = 45 ').then(function (data) {
        expect(data[0].fields[5].value).eql('helloworld');
        expect(data[0].fields[6].value).eql(45);
        expect(data[0].fields[7].value).eql(8123367);
      });
    });
  });

  describe('Builder', function () {
    it('should create simple query sql with select name where clause age', function () {
      var q = new rootDb.NativeSQL(rootDb);
      return q.execute('select name from PersonTable where name = \'helloworld\' ').then(function (data) {
        expect(data[0].fields[0].value).eql('helloworld');
      });
    });
  });

  describe('Builder', function () {
    it('should create simple query sql with select name,age where clause age', function () {
      var q = new rootDb.NativeSQL(rootDb);
      return q.execute('select name,age from PersonTable where name = \'helloworld\' ').then(function (data) {
        expect(data[0].fields[0].value).eql('helloworld');
        expect(data[0].fields[1].value).eql(45);
      });
    });
  });

  describe('Builder', function () {
    it('should create simple query sql with select zip,age where clause age', function () {
      var q = new rootDb.NativeSQL(rootDb);
      return q.execute('select zip,age from PersonTable where name = \'helloworld\' ').then(function (data) {
        expect(data[0].fields[0].value).eql(8123367);
        expect(data[0].fields[1].value).eql(45);
      });
    });
  });

});
