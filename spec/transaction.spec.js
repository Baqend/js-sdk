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
    studentType.addAttribute(new DB.metamodel.SingularAttribute('address', metamodel.baseType(String)));
    return metamodel.save();
  });

  before(function() {
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    return emf.createEntityManager().ready().then(function(em) {
      return em.User.login('root', 'root').then( function() {
        rootDb = em;
         rootDb.PersonTable.find().equal('name', 'helloworld1').singleResult( (data) => {
          if(data)
             data.delete();
        });
         rootDb.PersonTable.find().equal('name', 'helloworld2').singleResult( (data) => {
          if(data)
             data.delete();
        });
         rootDb.Student.find().equal('name', 'Test Student').singleResult( (data) => {
          if(data)
             data.delete();
        });
      });
    });
  });

  describe('Transaction Begin and Commit', function() {
    it('Insert new records', function() {
      return rootDb.transaction.begin().then(function(txid) {
        expect(txid).to.be.not.null;
        let tt = rootDb.PersonTable();
        tt.id = '890';
        tt.name = 'helloworld1';
        tt.age = 32;
        tt.zip = 5600081;
        tt.save();

        let tt1 = rootDb.PersonTable();
        tt1.id = '123';
        tt1.name = 'helloworld2';
        tt1.age = 50;
        tt1.zip = 5600082;
        tt1.save();

        let st = rootDb.Student();
        st.id = '12121';
        st.name = 'Test Student';
        st.address = 'home';
        st.save();
        return Promise.resolve();
      }).then(function() {
        return rootDb.transaction.commit().then(function(response){
          console.log(response);
          expect(response).to.be.not.null;
          expect(Object.keys(response).length).equals(3);
        });
      }).catch(function(error) {
        console.log('ERROR: ' + JSON.stringify(error));
        expect.fail("No Error should have been thrown");
        //rootDb.transaction.rollback(txnObj);
      });
    });

    it('Update existing records', function() {
      return rootDb.transaction.begin().then( async function(txid) {
        expect(txid).to.be.not.null;
        await rootDb.PersonTable.find().equal('name', 'helloworld1').singleResult( (data) => {
          if (data) {
            data.name = 'helloworld1';
            data.age = 33;
            data.zip = 5600091;
            data.save();
          }
        });

        await rootDb.PersonTable.find().equal('name', 'helloworld2').singleResult((data) => {
          if (data) {
            data.name = 'helloworld2';
            data.age = 51;
            data.zip = 5600092;
            data.save();
          }
        });

        await rootDb.Student.find().equal('name', 'Test Student').singleResult((data) => {
          if (data) {
            data.name = 'Test Student';
            data.address = 'office';
            data.save();
          }
        });

        return Promise.resolve();

      }).then(function() {
        return rootDb.transaction.commit().then(function(response){
          console.log(response);
          expect(response).to.be.not.null;
          expect(Object.keys(response).length).equals(3);
        });
      }).catch(function(error) {
        console.log('ERROR: ' + JSON.stringify(error));
        expect.fail("No Error should have been thrown here "+error);
        //rootDb.transaction.rollback(txnObj);
      });
    });

    it('No duplicate transaction check', function() {
      return rootDb.transaction.begin().then(function(txid) {
        expect(txid).to.be.not.null;
        rootDb.transaction.begin().then(function() {
          expect.fail("Transaction begin should have failed");
        }).catch( function(error) {
          expect(error).to.throw(Error('Transaction already exist.. Please commit existing transaction first'));
          return rootDb.transaction.commit().then(function(response){
            console.log(response);
            expect(response).to.be.not.null;
          });
        });
      })
    });
  });
});
