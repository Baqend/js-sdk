if (typeof module !== 'undefined') {
    require('./node');
}
  
var emf, em;

describe('More Transaction Tests', async function () {
    it('Updating a new object', async function () {
        await connect();
        produceMetaModel();
        await deleteStoreUpdate(false);

        // TODO: The following fails. Objects without IDs don't seem to be stored in transactions.
        // await deleteStoreUpdate(true);

    });
});

async function deleteStoreUpdate(transactional){
    await deleteAllObjects();
    const obj = await storeOneObject(transactional);
    await assertObjectExists("stored");
    await updateObject(obj, transactional);
    await assertObjectExists("updated");
}

async function connect(){
    emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    em = emf.createEntityManager();
    await em.ready();
    login();
}

function login(){
    em.User.login('root', 'root');
}

function produceMetaModel(){
    const metamodel = emf.metamodel;
    if(metamodel.entities["Simple"] !== null){
        return;
    }
    var simpletype = new DB.metamodel.EntityType('Simple', metamodel.entity(Object));
    metamodel.addType(simpletype );
    simpletype.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
    metamodel.save();
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

async function updateObject(obj, transactional){
    if(transactional){
        await em.transaction.begin();
    }
    obj.name = "updated";
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
