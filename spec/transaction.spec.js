'use strict';


if (typeof module !== 'undefined') {
  require('./node');

}

describe('Test Transaction', function() {
  var emf, metamodel, rootDb;
  before(function() {
    var personType;

    emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, schema: [], tokenStorage: helper.rootTokenStorage});
    metamodel = emf.metamodel;
    metamodel.addType(personType = new DB.metamodel.EntityType('PersonTable', metamodel.entity(Object)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('age', metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('zip', metamodel.baseType(Number)));
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
        let tt = rootDb.PersonTable();
        tt.name = 'helloworld';
        tt.age = 45;
        tt.zip = 8123367;
        await tt.save()
      });
    });
  });

  describe('Begin Transaction', function() {
    it('should set the transaction id', function() {
      return rootDb.transaction.begin().then(function(txid) {
        expect(txid).to.be.not.null;
        let tt = rootDb.PersonTable();
        tt.id = '122';
        tt.name = 'helloworld';
        tt.age = 4545122;
        tt.zip = 812323367;
        tt.save();

        let tt1 = rootDb.PersonTable();
        tt1.id = '123';
        tt1.name = 'hellowerere';
        tt1.age = 4545122;
        tt1.zip = 812323367;
        tt1.save();

        let st = rootDb.Student();
        st.id = '12121';
        st.name = 'Test Student';
        st.save();
        return Promise.resolve();
      }).then(function(txid) {
        return rootDb.transaction.commit();
      }).catch(function(error) {
        console.log('ERROR: ' + JSON.stringify(error));
        //rootDb.transaction.rollback(txnObj);
      });
    });
    it('throw transaction already exist exception', function() {
      //expect(rootDb.transaction.begin());
      expect(rootDb.transaction.begin().then()).to.throw(Error('Transaction already exist.. Please commit existing transaction first'));
    });
  });
});
