if (typeof module !== 'undefined') {
  require('../spec/node');
}
  
var emf, em, obj;

beforeEach(async function () {
  await connect(false);
  await produceMetaModel();
  await connect(true);
  await deleteAllObjects();
})

describe('Partial Updates for NoSQL Transactional', async function () {

    it('single partial update', async function () {
        obj = await storeObject("stored");    
        expect(obj.mlong).to.equal(42);
        await em.transaction.begin()
        await obj.partialUpdate().increment('mlong').execute();
        await em.transaction.commit();
        await em.PUNoSQL.find().resultList((result) => {
          result.forEach((obj) => {
            expect(obj.mlong).to.equal(43);
          });
        });
      });

      it('partial update and normal store', async function () {
        obj = await storeObject('partialupdate');    
        expect(obj.mlong).to.equal(42);
        await em.transaction.begin();
        await storeObject('normalstore');
        await obj.partialUpdate().increment('mlong').execute();
        await em.transaction.commit();
        await em.PUNoSQL.find().equal('mstring', 'partialupdate').singleResult((partialupdate) => {
          if (! partialupdate) {
              expect.fail("Simple object with name 'partialupdate' does not exist.");
          }
          expect(partialupdate.mlong).to.equal(43);
        });
      });

      it('partial update and delete', async function () {
        obj = await storeObject('partialupdate'); 
        var toDelete = await storeObject('todelete');
        expect(obj.mlong).to.equal(42);
        await em.transaction.begin();
        toDelete.delete();        
        await obj.partialUpdate().increment('mlong').execute();
        await em.transaction.commit();
        await em.PUNoSQL.find().equal('mstring', 'partialupdate').singleResult((partialupdate) => {
          if (! partialupdate) {
              expect.fail("Simple object with name 'partialupdate' does not exist.");
          }
          expect(partialupdate.mlong).to.equal(43);
        });
        await em.PUNoSQL.find().equal('mstring', 'todelete').singleResult((res) => {
          if (res) {
              expect.fail("Simple object with name 'todelete' was not deleted.");
          }
        });
      });

      it('partial update store and delete', async function () {
        obj = await storeObject('partialupdate'); 
        var toDelete = await storeObject('todelete');
        expect(obj.mlong).to.equal(42);
        await em.transaction.begin();
        toDelete.delete();        
        await storeObject('normalstore');
        await obj.partialUpdate().increment('mlong').execute();
        await em.transaction.commit();
        await em.PUNoSQL.find().equal('mstring', 'partialupdate').singleResult((partialupdate) => {
          if (! partialupdate) {
              expect.fail("Simple object with name 'partialupdate' does not exist.");
          }
          expect(partialupdate.mlong).to.equal(43);
        });
        await em.PUNoSQL.find().equal('mstring', 'todelete').singleResult((res) => {
          if (res) {
              expect.fail("Simple object with name 'todelete' was not deleted.");
          }
        });
      });

      it('two partial updates executed on same object', async function () {
        obj = await storeObject('partialupdate');    
        expect(obj.mlong).to.equal(42);
        await em.transaction.begin();
        await obj.partialUpdate().increment('mlong').execute();
        await obj.partialUpdate().multiply('mdouble', 10).execute();
        await em.transaction.commit();
        await em.PUNoSQL.find().equal('mstring', 'partialupdate').singleResult((partialupdate) => {
          if (! partialupdate) {
              expect.fail("Simple object with name 'partialupdate' does not exist.");
          }
          expect(partialupdate.mlong).to.equal(43);
          expect(partialupdate.mdouble).to.equal(430);
        });
      });

      it('two partial updates chained on same object', async function () {
        obj = await storeObject('partialupdate');    
        expect(obj.mlong).to.equal(42);
        await em.transaction.begin();
        await obj.partialUpdate().increment('mlong').multiply('mdouble', 10).execute();
        await em.transaction.commit();
        await em.PUNoSQL.find().equal('mstring', 'partialupdate').singleResult((partialupdate) => {
          if (! partialupdate) {
              expect.fail("Simple object with name 'partialupdate' does not exist.");
          }
          expect(partialupdate.mlong).to.equal(43);
          expect(partialupdate.mdouble).to.equal(430);
        });
      });

      it('partial updates on two objects', async function () {
        obj = await storeObject('pu1');
        var obj2 = await storeObject('pu2');
        expect(obj.mlong).to.equal(42);
        await em.transaction.begin();
        await storeObject('storingAnother');    
        await obj.partialUpdate().increment('mlong').execute();
        await obj2.partialUpdate().increment('mlong').execute();
        await em.transaction.commit();
        await em.PUNoSQL.find().equal('mstring', 'pu1').singleResult((partialupdate) => {
          if (! partialupdate) {
              expect.fail("Simple object with name 'pu1' does not exist.");
          }
          expect(partialupdate.mlong).to.equal(43);
        });
        await em.PUNoSQL.find().equal('mstring', 'pu2').singleResult((partialupdate) => {
          if (! partialupdate) {
              expect.fail("Simple object with name 'pu2' does not exist.");
          }
          expect(partialupdate.mlong).to.equal(43);
        });
      });


});

async function connect(withSchema){
    if(withSchema){
        emf = await new DB.EntityManagerFactory(env.TEST_SERVER);
    } else {
        emf = await new DB.EntityManagerFactory({ host: env.TEST_SERVER, schema: [], tokenStorage: helper.rootTokenStorage });
    }
    em = emf.createEntityManager();
    await em.ready();
    if(withSchema){
        await login();
    }
}

async function login(){
    await em.User.login('root', 'root');
}

async function produceMetaModel(){
    const metamodel = emf.metamodel;
    if(metamodel.entities["/db/PUNoSQL"] != null){
        return;
    }
    
    var putype = new DB.metamodel.EntityType('PUNoSQL', metamodel.entity(Object));
    metamodel.addType(putype);
    putype.addAttribute(new DB.metamodel.SingularAttribute('mstring', metamodel.baseType(String)));
    putype.addAttribute(new DB.metamodel.SingularAttribute('mlong', metamodel.baseType('Integer')));
    putype.addAttribute(new DB.metamodel.SingularAttribute('mdouble', metamodel.baseType('Double')));
    putype.addAttribute(new DB.metamodel.SingularAttribute('mdate', metamodel.baseType(Date)));
    putype.addAttribute(new DB.metamodel.SingularAttribute('mnumber', metamodel.baseType(Number)));
    
    await metamodel.save();
}

async function storeObject(str){
    var obj = new em.PUNoSQL();
    obj.mstring = str;
    obj.mlong = 42;
    obj.mdouble = 43;
    obj.mnumber = 44;
    await obj.save();
    return obj;
}

async function deleteAllObjects(){
    await em.PUNoSQL.find().resultList((result) => {
        result.forEach((obj) => {
            obj.delete();
        });
    });
}


