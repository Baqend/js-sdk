if (typeof module !== 'undefined') {
    require('./node');
}
var emf, em;

beforeEach(async function () {
    await connect(false);
    await produceMetaModel();
    await connect(true);
})

describe('More Transaction Tests', async function () {
    it('Updating a new object', async function () {
        await storeUpdate(false);
        await storeUpdate(true);
    });
    it('Updating an object twice', async function () {
        await storeUpdateTwice(false);
        await storeUpdateTwice(true);
    });
});

async function storeUpdate(transactional){
    await deleteAllObjects();
    const obj = await storeOneObject(transactional);
    await assertObjectExists("stored");
    await updateObject(obj, transactional, "updated");
    await assertObjectExists("updated");
    await assertNoObjectExists("stored");
}

async function storeUpdateTwice(transactional){
    await deleteAllObjects();
    const obj = await storeOneObject(transactional);
    await updateObject(obj, transactional, "updated1");
    await updateObject(obj, transactional, "updated2");
    await assertObjectExists("updated2");
    await assertNoObjectExists("updated1");
    await assertNoObjectExists("stored");
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
    if(metamodel.entities["/db/Simple"] != null){
        return;
    }
    var simpletype = new DB.metamodel.EntityType('Simple', metamodel.entity(Object));
    metamodel.addType(simpletype );
    simpletype.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
    await metamodel.save();
}

async function deleteAllObjects(){
    await em.Simple.find().resultList((result) => {
        result.forEach((obj) => {
            obj.delete();
        });
    });
}

async function storeOneObject(transactional){
    if(transactional){
        await em.transaction.begin();
    }
    var obj = new em.Simple();
    obj.name = "stored";
    await obj.save();
    if(transactional){
        await em.transaction.commit();
    }
    return obj;
}

async function updateObject(obj, transactional, newName){
    if(transactional){
        await em.transaction.begin();
    }
    obj.name = newName;
    await obj.save();
    if(transactional){
        await em.transaction.commit();
    }
}

async function assertObjectExists(name){
    await em.Simple.find().equal('name', name).singleResult((obj) => {
        if (! obj) {
            expect.fail("Simple object with name '" + name + "' does not exist.");
        }
    });
}

async function assertNoObjectExists(name){
    await em.Simple.find().equal('name', name).singleResult((obj) => {
        if (obj) {
            expect.fail("Simple object with name '" + name + "' exists but shouldn't.");
        }
    });
}
