const { set } = require('shelljs');

if (typeof module !== 'undefined') {
    require('./node');
}
  
var emf, em, obj;

describe('Partial Updates for NoSQL', async function () {

    it('increment long', async function () {
        await setup();
        obj = await storeObjects();    
        expect(obj.mlong).to.equal(42);
        return obj.partialUpdate()
          .increment('mlong')
          .execute()
          .then(function (result) {
            expect(result).to.equal(obj);
            expect(obj.mlong).to.equal(43);
          });
      });
  
      it('decrement long', async function () {
        await setup();
        obj = await storeObjects();    
        expect(obj.mlong).to.equal(42);
        return obj.partialUpdate()
          .decrement('mlong', 2)
          .execute()
          .then(function (result) {
            expect(result).to.equal(obj);
            expect(obj.mlong).to.equal(40);
          });
      });

      it('min long', async function () {
        await setup();
        obj = await storeObjects();    
        expect(obj.mlong).to.equal(42);
        return obj.partialUpdate()
          .min('mlong', 41)
          .execute()
          .then(function (result) {
            expect(result).to.equal(obj);
            expect(obj.mlong).to.equal(41);
          });
      });

      it('min double', async function () {
        await setup();
        obj = await storeObjects();    
        expect(obj.mdouble).to.equal(43);
        return obj.partialUpdate()
          .min('mdouble', 44)
          .execute()
          .then(function (result) {
            expect(result).to.equal(obj);
            expect(obj.mdouble).to.equal(43);
          });
      });

      it('multiply long', async function () {
        await setup();
        obj = await storeObjects();    
        expect(obj.mlong).to.equal(42);
        return obj.partialUpdate()
          .multiply('mlong', 5)
          .execute()
          .then(function (result) {
            expect(result).to.equal(obj);
            expect(obj.mlong).to.equal(210);
          });
      });

      it('multiply double', async function () {
        await setup();
        obj = await storeObjects();    
        expect(obj.mdouble).to.equal(43);
        return obj.partialUpdate()
          .multiply('mdouble', 10)
          .execute()
          .then(function (result) {
            expect(result).to.equal(obj);
            expect(obj.mdouble).to.equal(430);
          });
      });

      it('set current date', async function () {
        await setup();
        obj = await storeObjects();    
        expect(obj.mdate).to.equal(null);
        return obj.partialUpdate()
          .toNow('mdate')
          .execute()
          .then(function (result) {
            expect(result).to.equal(obj);
            expect(obj.mdate).to.not.equal(null);
          });
      });

});


async function setup(){
    await connect(false);
    await produceMetaModel();
    await connect(true);
    await deleteAllObjects();
}

async function connect(withSchema){
    if(withSchema){
        emf = await new DB.EntityManagerFactory(env.TEST_SERVER);
    } else {
        emf = await new DB.EntityManagerFactory({ host: env.TEST_SERVER, schema: [], tokenStorage: helper.rootTokenStorage });
    }
    await emf.ready();
    em = await emf.createEntityManager();
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

async function storeObjects(){
    var obj = new em.PUNoSQL();
    obj.mstring = "stored";
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


