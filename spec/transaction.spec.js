if (typeof module !== 'undefined') {
  require('./node');
}

describe('Test Transaction', function () {
  var emf, metamodel, rootDb;
  var personType, studentType;

  before(function () {
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
      });
    });
  });

  beforeEach(async function () {
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

    await createTestObjects();
  });

  async function createTestObjects() { 
      const p1 = rootDb.PersonTable();
      p1.name = 'person1';
      p1.age = 30;
      p1.zip = 561030;
      await p1.save();
  
      const p2 = rootDb.PersonTable();
      p2.name = 'person2';
      p2.age = 50;
      p2.zip = 561050;
      await p2.save();
  
      const st1 = rootDb.Student();
      st1.name = 'student1';
      st1.address = 'home';
      st1.person = p1;
      await st1.save();
  
      const st2 = rootDb.Student();
      st2.name = 'student2';
      st2.address = 'home';
      st2.person = p2;
      await st2.save();
  }

  describe('Transaction Begin and Commit', function () {
    it('Insert new records without ID', function () {
      return rootDb.transaction.begin().then(function (txid) {
        expect(txid).to.be.not.null;
        const p3 = rootDb.PersonTable();
        p3.name = 'person3';
        p3.age = 30;
        p3.zip = 561093;
        p3.save();

        const p4 = rootDb.PersonTable();
        p4.name = 'person4';
        p4.age = 40;
        p4.zip = 561040;
        p4.save();

        const s3 = rootDb.Student();
        s3.name = 'student3';
        s3.address = 'area_z';
        s3.person = p3;
        s3.save();

        return Promise.resolve();
      }).then(function () {
        return rootDb.transaction.commit().then(async function (response) {
          expect(response).to.be.not.null;
          expect(Object.keys(response).length).equals(3);

          await rootDb.PersonTable.find().equal('name', 'person3').singleResult((data) => {
            if (!data) {
              expect.fail("Failed to insert Person with name person3")
            }
          });

          await rootDb.PersonTable.find().equal('name', 'person4').singleResult((data) => {
            if (!data) {
              expect.fail("Failed to insert Person with name person4")
            }
          });

          await rootDb.Student.find().equal('name', 'student3').singleResult((data) => {
            if (!data) {
               expect.fail("Failed to insert Student with name student3")
            }
          });
        });
      }).catch(function (error) {
        console.log(`ERROR: ${JSON.stringify(error)}`);
        expect.fail('No Error should have been thrown');
        // rootDb.transaction.rollback(txnObj);
      });
    });

    it('Insert new records with ID', function () {
      return rootDb.transaction.begin().then(function (txid) {
        expect(txid).to.be.not.null;
        const p3 = rootDb.PersonTable();
        p3.id = '600';
        p3.name = 'person6';
        p3.age = 30;
        p3.zip = 561093;
        p3.save();

        const p4 = rootDb.PersonTable();
        p4.id = '601';
        p4.name = 'person7';
        p4.age = 40;
        p4.zip = 561040;
        p4.save();

        const s3 = rootDb.Student();
        s3.id = '603';
        s3.name = 'student6';
        s3.address = 'area_z';
        s3.person = p3;
        s3.save();
        return Promise.resolve();
      }).then(function () {
        return rootDb.transaction.commit().then(async function (response) {
          expect(response).to.be.not.null;
          expect(Object.keys(response).length).equals(3);
        });
      }).catch(function (error) {
        console.log(`ERROR: ${JSON.stringify(error)}`);
        expect.fail('No Error should have been thrown');
      });
    });

    /*
    it('Insert records with same ID', function () {
      return rootDb.transaction.begin().then(function (txid) {
        expect(txid).to.be.not.null;

        const p = rootDb.PersonTable();
        p.name = 'person10';
        p.age = 44;
        p.zip = 561077;
        p.save();

        const s = rootDb.Student();
        s.id = '711';
        s.name = 'student8';
        s.address = 'Hamburg';
        s.person = p;
        s.save();

        const s1 = rootDb.Student();
        s1.id = '711';
        s1.name = 'student9';
        s1.address = 'New York';
        s1.person = p;
        s1.save();
        
        return Promise.resolve();
      }).then(function () {
        return rootDb.transaction.commit().then(async function (response) {
          expect.fail('Expected to fail -> 2 objects created with same ID');
        });
      }).catch(function (error) {
        expect(error).to.be.not.null;
        //check the exact exception
      });
    });
  */
    it('Update existing records', function () {
      return rootDb.transaction.begin().then(async function (txid) {
        await rootDb.PersonTable.find().equal('name', 'person1').singleResult((data) => {
          data.name = 'person11';
          data.age = 33;
          data.zip = 5600091;
          data.save();
        });

        await rootDb.PersonTable.find().equal('name', 'person2').singleResult((data) => {
          data.name = 'person22';
          data.age = 51;
          data.zip = 5600092;
          data.save();
        });

        await rootDb.Student.find().equal('name', 'student1').singleResult((data) => {
          data.name = 'student11';
          data.address = 'office';
          data.save();
        });

        return Promise.resolve();
      }).then(function () {
        return rootDb.transaction.commit().then(async function (response) {
          expect(response).to.be.not.null;
          expect(Object.keys(response).length).equals(3);
          await rootDb.PersonTable.find().equal('name', 'person11').singleResult((data) => {
            if (!data) {
              expect.fail("Failed to update Person with name person1")
            }
          });

          await rootDb.PersonTable.find().equal('name', 'person22').singleResult((data) => {
            if (!data) {
              expect.fail("Failed to update Person with name person2")
            }
          });

          await rootDb.Student.find().equal('name', 'student11').singleResult((data) => {
            if (!data) {
               expect.fail("Failed to update Student with name student1")
            }
          });
          
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
        return rootDb.transaction.commit().then(async function (response) {
          expect(response).to.be.not.null;
          expect(Object.keys(response).length).equals(0);
          await rootDb.PersonTable.find().equal('name', 'person1').singleResult((data) => {
            if (data) {
              expect.fail("Person1 is expected to have been deleted")
            }
          });

          await rootDb.Student.find().equal('name', 'student1').singleResult((data) => {
            if (data) {
               expect.fail("Student1 is expected to have been deleted")
            }
          });
        });
      }).catch(function (error) {
        console.log(`ERROR: ${JSON.stringify(error)}`);
        expect.fail(`No Error should have been thrown here ${error}`);
      });
    });

    async function createNewPerson(withCommit, personName) {
      return await rootDb.transaction.begin().then(function (txid) {
        const tt = rootDb.PersonTable();
        tt.id = '2911';
        tt.name = personName;
        tt.age = 45;
        tt.zip = 21147;
        tt.save();
        return Promise.resolve();
      }).then(async function () {
        if (withCommit) {
          return await rootDb.transaction.commit().then(function (response) {
            expect(Object.keys(response).length).equals(1);
          });
        }
      }).catch(function (error) {
		    expect.fail(`Failed to create object: ${error}`);
      });
    }

    it('rollback created records', async function () {
      const personName = "Umarou";
      const constVoid = await createNewPerson(false, personName); 
        rootDb.transaction.rollback().then(function (response) {
          expect(response).to.be.empty;
        },
        function (failedResp) {
          expect.fail(`Wasn't expected to fail: ${failedResp}`);
        });

        //rollback with no transaction ID: expected to fail
        rootDb.transaction.rollback().then(function (response) {
          expect.fail("Wasn't expected to succeed");
        },
        function (failedResp) {
          expect(failedResp.toString()).to.be.eq('Error: Nothing to do. Transaction does not exist');
        });

        // No record with name $personName should be found in the db since created record was rolled back
        return rootDb.transaction.begin().then(async function (txid) {
          expect(txid).to.be.not.null;
          await rootDb.PersonTable.find().equal('name', personName).singleResult((data) => {
            if (data) {
              expect.fail('Unexpected Data');
            }
          });          
      }).then(function () {
          return rootDb.transaction.rollback().then(function (response) {
            //expect(response.length).equals(0);
        });
      }).catch(function (error) {
          expect.fail(`No exception expected ${error}`);
      });
    });

    it('Unique index violation', async function () {
      await createNewPerson(true, 'person1');
      return rootDb.transaction.begin().then(async function (txid) {     
        var index = new DB.metamodel.DbIndex('name', true); //second param 'true' for unique index
        await metamodel.createIndex(personType.name, index);         
        return Promise.resolve();
      }).then(function () {
        return rootDb.transaction.commit().then(async function (response) {
          expect.fail('Expected to fail with unique index violation on student name.. student1');
        });
      }).catch(async function (error) {
        expect(error.reason).equals("Unique Index Exception");  
        await rootDb.transaction.rollback();    
      });
    });

    it('No duplicate transaction check', function () {
      return rootDb.transaction.begin().then(function (txid) {
        expect(txid).to.be.not.null;
        rootDb.transaction.begin().then(function () {
          expect.fail('Transaction begin should have failed');
        }).catch(function (error) {
          rootDb.transaction.commit().then(function (response) {
            expect(response).to.be.not.null;
          });
          expect(error.toString()).to.be.eq('Error: Transaction already exist.. Please commit existing transaction first');
        });
      });
    });
  });
});
