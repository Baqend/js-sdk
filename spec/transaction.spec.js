if (typeof module !== 'undefined') {
  require('./node');
}

describe('Test Transaction', function () {
  var emf, metamodel, rootDb;
  before(function () {
    var personType, studentType;

    emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, schema: [], tokenStorage: helper.rootTokenStorage });
    metamodel = emf.metamodel;
    metamodel.addType(personType = new DB.metamodel.EntityType('PersonTable', metamodel.entity(Object)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('age', metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('zip', metamodel.baseType(Number)));

    metamodel.addType(studentType = new DB.metamodel.EntityType('Student', metamodel.entity(Object)));
    studentType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
    studentType.addAttribute(new DB.metamodel.SingularAttribute('address', metamodel.baseType(String)));
    studentType.addAttribute(new DB.metamodel.SingularAttribute('person', personType));

    return metamodel.save();
  });

  before(function () {
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    return emf.createEntityManager().ready().then(function (em) {
      return em.User.login('root', 'root').then(function () {
        rootDb = em;
        rootDb.PersonTable.find().equal('name', 'helloworld1').singleResult((data) => {
          if (data) data.delete();
        });
        rootDb.PersonTable.find().equal('name', 'helloworld2').singleResult((data) => {
          if (data) data.delete();
        });
        rootDb.PersonTable.find().equal('name', 'helloworld3').singleResult((data) => {
          if (data) data.delete();
        });
        rootDb.Student.find().equal('name', 'Test Student').singleResult((data) => {
          if (data) data.delete();
        });
        rootDb.Student.find().equal('name', 'Student_X').singleResult((data) => {
          if (data) data.delete();
        });
        rootDb.Student.find().equal('name', 'person1').singleResult((data) => {
          if (data) data.delete();
        });
      });
    });
  });

  describe('Transaction Begin and Commit', function () {
    it('Insert new records', function () {
      return rootDb.transaction.begin().then(function (txid) {
        expect(txid).to.be.not.null;
        const tt = rootDb.PersonTable();
        tt.id = '890';
        tt.name = 'helloworld1';
        tt.age = 32;
        tt.zip = 5600081;
        tt.save();

        const tt1 = rootDb.PersonTable();
        tt1.id = '123';
        tt1.name = 'helloworld2';
        tt1.age = 50;
        tt1.zip = 5600082;
        tt1.save();

        const st = rootDb.Student();
        st.id = '12121';
        st.name = 'Test Student';
        st.address = 'home';
        st.person = tt1;
        st.save();

        const st1 = rootDb.Student();
        st1.id = '111';
        st1.name = 'Student_X';
        st1.address = 'Area_X';
        st1.person = tt;
        st1.save();

        return Promise.resolve();
      }).then(function () {
        return rootDb.transaction.commit().then(function (response) {
          console.log(response);
          expect(response).to.be.not.null;
          expect(Object.keys(response).length).equals(4);
        });
      }).catch(function (error) {
        console.log(`ERROR: ${JSON.stringify(error)}`);
        expect.fail('No Error should have been thrown');
        // rootDb.transaction.rollback(txnObj);
      });
    });

    it('Update existing records', function () {
      return rootDb.transaction.begin().then(async function (txid) {
        await rootDb.PersonTable.find().equal('name', 'helloworld1').singleResult((data) => {
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

        const tt = rootDb.PersonTable();
        tt.id = '777';
        tt.name = 'helloworld3';
        tt.age = 54;
        tt.zip = 82547;
        tt.save();

        return Promise.resolve();
      }).then(function () {
        return rootDb.transaction.commit().then(function (response) {
          console.log(response);
          expect(response).to.be.not.null;
          expect(Object.keys(response).length).equals(4);
        });
      }).catch(function (error) {
        console.log(`ERROR: ${JSON.stringify(error)}`);
        expect.fail(`No Error should have been thrown here ${error}`);
        // rootDb.transaction.rollback(txnObj);
      });
    });

    it('Create and Delete record', function () {
      return rootDb.transaction.begin().then(async function (txid) {
        expect(txid).to.be.not.null;

        const p1 = rootDb.PersonTable();
        p1.id = '101';
        p1.name = 'person1';
        p1.age = 36;
        p1.zip = 210103;
        p1.save();

        await rootDb.Student.find().equal('name', 'Student_X').singleResult((data) => {
          if (data) {
            data.delete();
          }
        });
        return Promise.resolve();
      }).then(function () {
        return rootDb.transaction.commit().then(function (response) {
          console.log(response);
          expect(response).to.be.not.null;
          expect(Object.keys(response).length).equals(1);
        });
      }).catch(function (error) {
        console.log(`ERROR: ${JSON.stringify(error)}`);
        expect.fail(`No Error should have been thrown here ${error}`);
        // rootDb.transaction.rollback(txnObj);
      });
    });

    async function createNewObject(withCommit, personName) {
      return await rootDb.transaction.begin().then(function (txid) {
        const tt = rootDb.PersonTable();
        tt.id = '2911';
        tt.name = personName;
        tt.age = 45;
        tt.zip = 21147;
        tt.save();
      }).then(async function () {
        if (!withCommit) {
          return await rootDb.transaction.commit().then(function (response) {
            console.log(response);
            expect(response).to.be.not.null;
            expect(Object.keys(response).length).equals(1);
          });
        }
      }).catch(function (error) {
		    expect.fail(`Failed to create object: ${error}`);
      });
    }

    it('rollback created records', async function () {
      const personName = "Umarou";
      const constVoid = await createNewObject(true, personName); 
        // rollback with transaction ID: expected to succeed
        rootDb.transaction.rollback().then(function (response) {
          expect(response).to.be.empty;
        },
        function (failedResp) {
          expect.fail(`Wasn't expected to fail: ${failedResp}`);
        });

        // rollback with no transaction ID: expected to fail
        rootDb.transaction.rollback().then(function (response) {
          expect.fail("Wasn't expected to succeed");
        },
        function (failedResp) {
          expect(failedResp).to.be.eq('Nothing to do. Transaction does not exist');
        });

        // No record with name Umarou should be found in the db since created record was rolled back
        return rootDb.transaction.begin().then(async function (txid) {
          expect(txid).to.be.not.null;
          await rootDb.PersonTable.find().equal('name', personName).singleResult((data) => {
            if (data) {
              expect.fail('Unexpected Data');
            }
          });
          await rootDb.transaction.commit();
      });
    });

    it('No duplicate transaction check', function () {
      return rootDb.transaction.begin().then(function (txid) {
        expect(txid).to.be.not.null;
        rootDb.transaction.begin().then(function () {
          expect.fail('Transaction begin should have failed');
        }).catch(function (error) {
          expect(error).to.throw(Error('Transaction already exist.. Please commit existing transaction first'));
          return rootDb.transaction.commit().then(function (response) {
            console.log(response);
            expect(response).to.be.not.null;
          });
        });
      });
    });
  });
});
