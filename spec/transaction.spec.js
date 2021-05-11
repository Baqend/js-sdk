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
    console.log("calling begin");
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    return emf.createEntityManager().ready().then(function (em) {
      return em.User.login('root', 'root').then(function () {
        rootDb = em;
      });
    });
  });

  beforeEach(function () {

    const p1 = rootDb.PersonTable();
    p1.name = 'person1';
    p1.age = 30;
    p1.zip = 561030;
    p1.save();

    const p2 = rootDb.PersonTable();
    p2.name = 'person2';
    p2.age = 50;
    p2.zip = 561050;
    p2.save();

    const st1 = rootDb.Student();
    st1.name = 'student1';
    st1.address = 'home';
    st1.person = p1;
    st1.save();

    const st2 = rootDb.Student();
    st2.name = 'student2';
    st2.address = 'home';
    st2.person = p2;
    st2.save();

    console.log("calling before each ");
  })

  describe('Transaction Begin and Commit', function () {
    it('Insert new records', function () {
      return rootDb.transaction.begin().then(function (txid) {
        expect(txid).to.be.not.null;
        const p3 = rootDb.PersonTable();
        p3.name = 'person3';
        p3.age = 30;
        p3.zip = 561093;
        p3.save();

        const s3 = rootDb.Student();
        s3.name = 'student3';
        s3.address = 'area_z';
        s3.person = p3;
        s3.save();

        return Promise.resolve();
      }).then(function () {
        return rootDb.transaction.commit().then(function (response) {
          console.log(response);
          expect(response).to.be.not.null;
          expect(Object.keys(response).length).equals(2);
        });
      }).catch(function (error) {
        console.log(`ERROR: ${JSON.stringify(error)}`);
        expect.fail('No Error should have been thrown');
        // rootDb.transaction.rollback(txnObj);
      });
    });

    it('Update existing records', function () {
      return rootDb.transaction.begin().then(async function (txid) {
        await rootDb.PersonTable.find().equal('name', 'person1').singleResult((data) => {
            data.name = 'person1';
            data.age = 33;
            data.zip = 5600091;
            data.save();
        });

        await rootDb.PersonTable.find().equal('name', 'person2').singleResult((data) => {
            data.name = 'person2';
            data.age = 51;
            data.zip = 5600092;
            data.save();
        });

        await rootDb.Student.find().equal('name', 'student1').singleResult((data) => {
            data.name = 'student1';
            data.address = 'office';
            data.save();
        });

        return Promise.resolve();
      }).then(function () {
        return rootDb.transaction.commit().then(function (response) {
          console.log(response);
          expect(response).to.be.not.null;
          expect(Object.keys(response).length).equals(3);
        });
      }).catch(function (error) {
        console.log(`ERROR: ${JSON.stringify(error)}`);
        expect.fail(`No Error should have been thrown here ${error}`);
        // rootDb.transaction.rollback(txnObj);
      });
    });

    it('Delete records', function () {
      return rootDb.transaction.begin().then(async function (txid) {
        expect(txid).to.be.not.null;

        await rootDb.PersonTable.find().equal('name', 'person1').singleResult((data) => {
            data.delete();
        });
        await rootDb.Student.find().equal('name', 'student1').singleResult((data) => {
            data.delete();
        });
        return Promise.resolve();
      }).then(function () {
        return rootDb.transaction.commit().then(function (response) {
          console.log(response);
          expect(response).to.be.not.null;
          expect(Object.keys(response).length).equals(0);
        });
      }).catch(function (error) {
        console.log(`ERROR: ${JSON.stringify(error)}`);
        expect.fail(`No Error should have been thrown here ${error}`);
        // rootDb.transaction.rollback(txnObj);
      });
    });

    it('rollback created records', function () {
      return rootDb.transaction.begin().then(async function (txid) {
        expect(txid).to.be.not.null;
        const tt = rootDb.PersonTable();
        tt.id = '890';
        tt.name = 'Umarou';
        tt.age = 32;
        tt.zip = 5600081;
        tt.save();
        return Promise.resolve();
      }).then(function () {
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
          await rootDb.PersonTable.find().equal('name', 'Umarou').singleResult((data) => {
            if (data) {
              expect.fail('Unexpected Data');
            }
          });
          await rootDb.transaction.commit();
        });
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
  afterEach(async function () {

    await rootDb.PersonTable.find().resultList((result) => {
      result.forEach(async (c) => {
        await c.delete();
      });
    });

    await rootDb.Student.find().resultList((result) => {
      result.forEach(async (c) => {
        await c.delete();
      });
    });

  });
});
