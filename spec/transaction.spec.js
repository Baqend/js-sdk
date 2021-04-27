'use strict';


if (typeof module !== 'undefined') {
  require('./node');

}

describe('Test Transaction', function() {
  var emf, metamodel, rootDb;
  before(function() {
    var personType,studentType;

    emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, schema: [], tokenStorage: helper.rootTokenStorage});
    metamodel = emf.metamodel;
    metamodel.addType(personType = new DB.metamodel.EntityType('PersonTable', metamodel.entity(Object)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('age', metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('zip', metamodel.baseType(Number)));


    metamodel.addType(studentType = new DB.metamodel.EntityType('Student', metamodel.entity(Object)));
    studentType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));

    return metamodel.save();
  });

  before(function() {
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    return emf.createEntityManager().ready().then(function(em) {
      return em.User.login('root', 'root').then(async function() {
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
        await rootDb.Student.find().equal('name', 'Test Student').resultList(async (data) => {
          for (const tt of data) {
            if (!tt) {
              console.log("Found nothing?!");
            } else {
              await tt.delete();
            }
          }
        });
      });
    });
  });

  describe('Begin Transaction', function() {
    it('should set the transaction id', function() {
      return rootDb.transaction.begin().then(function(txid) {
        expect(txid).to.be.not.null;
        let tt = rootDb.PersonTable();
        tt.id = '890';
        tt.name = 'helloworld';
        tt.age = 32;
        tt.zip = 4567;
        tt.save();

        let tt1 = rootDb.PersonTable();
        tt1.id = '123';
        tt1.name = 'helloworld';
        tt1.age = 50;
        tt1.zip = 1234;
        tt1.save();

        let st = rootDb.Student();
        st.id = '12121';
        st.name = 'Test Student';
        st.save();
        return Promise.resolve();
      }).then(function(txid) {
        return rootDb.transaction.commit().then(function(response){
          console.log(response);
          expect(response).to.be.not.null;
        });
      }).catch(function(error) {
        console.log('ERROR: ' + JSON.stringify(error));
        //rootDb.transaction.rollback(txnObj);
      });
    });
    it('throw transaction already exist exception', function() {
      //expect(rootDb.transaction.begin());
      expect(rootDb.transaction.begin()).to.throw(Error('Transaction already exist.. Please commit existing transaction first'));
    });
  });
});
