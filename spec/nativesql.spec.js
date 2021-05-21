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
    personType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)),0);
    personType.addAttribute(new DB.metamodel.SingularAttribute('age', metamodel.baseType(Number)),1);
    personType.addAttribute(new DB.metamodel.SingularAttribute('zip', metamodel.baseType(Number)),2);
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
    it('should create simple query sql with where clause name', function () {
      return rootDb.nativeQuery.execute('select * from PersonTable where name = \'helloworld\' ').then(function (data) {
        expect(data[1]["row"]["persontable:age"]).eql(45);
        expect(data[1]["row"]["persontable:name"]).eql('helloworld');
        expect(data[1]["row"]["persontable:zip"]).eql(8123367);
      });
    });
  });

  describe('Builder', function () {
    it('should create simple query sql with where clause age', function () {
      return rootDb.nativeQuery.execute('select * from PersonTable where age = 45 ').then(function (data) {
        expect(data[1]["row"]["persontable:age"]).eql(45);
        expect(data[1]["row"]["persontable:name"]).eql('helloworld');
        expect(data[1]["row"]["persontable:zip"]).eql(8123367);
      });
    });
  });

  describe('Builder', function () {
    it('should create simple query sql with select name where clause age', function () {
      return rootDb.nativeQuery.execute('select name from PersonTable where name = \'helloworld\' ').then(function (data) {
        expect(data[1]["row"]["persontable:name"]).eql('helloworld');
      });
    });
  });

  describe('Builder', function () {
    it('should create simple query sql with select name,age where clause age', function () {
      //var q = new rootDb.NativeQuery(rootDb);
      return rootDb.nativeQuery.execute('select name,age from PersonTable where name = \'helloworld\' ').then(function (data) {
        expect(data[1]["row"]["persontable:name"]).eql('helloworld');
        expect(data[1]["row"]["persontable:age"]).eql(45);
      });
    });
  });

  describe('Builder', function () {
    it('should create simple query sql with select zip,age where clause name', function () {
      return rootDb.nativeQuery.execute('select zip,age from PersonTable where name = \'helloworld\' ').then(function (data) {
        expect(data[1]["row"]["persontable:zip"]).eql(8123367);
        expect(data[1]["row"]["persontable:age"]).eql(45);
      });
    });
  });

});
