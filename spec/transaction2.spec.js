if (typeof module !== 'undefined') {
    require('./node');
}
  
var emf, em;

describe('Still More Transaction Tests', async function () {
    it('Updating an object with a reference to another object', async function () {
        await connect(false);
        await produceMetaModel();
        await connect(true);
        await deleteStoreUpdate(false);
        await deleteStoreUpdate(true);
    });
});

async function deleteStoreUpdate(transactional){
    await deleteAllObjects();
    const obj = await storeObjects(transactional);
    await assertObjectsExist("stored");
    await updateObjects(obj, transactional);
    await assertObjectsExist("updated");
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
    if(metamodel.entities["/db/JSParent"] != null){
        return;
    }
    
    var childType = new DB.metamodel.EntityType('JSChild', metamodel.entity(Object));
    metamodel.addType(childType);
    childType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));

    var parentType = new DB.metamodel.EntityType('JSParent', metamodel.entity(Object));
    metamodel.addType(parentType);
    parentType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
    parentType.addAttribute(new DB.metamodel.SingularAttribute('child', childType));
    await metamodel.save();
}

async function deleteAllObjects(){
    await em.JSParent.find().resultList((result) => {
        result.forEach((obj) => {
            obj.delete();
        });
    });
    await em.JSChild.find().resultList((result) => {
        result.forEach((obj) => {
            obj.delete();
        });
    });

}

async function storeObjects(transactional){
    if(transactional){
        await em.transaction.begin();
    }
    var child = new em.JSChild();
    child.name = "stored";
    await child.save();
    var parent = new em.JSParent();
    parent.name = "stored";
    parent.child = child;
    await parent.save();
    if(transactional){
        await em.transaction.commit();
    }
    return parent;
}

async function updateObjects(parent, transactional){
    if(transactional){
        await em.transaction.begin();
    }
    parent.name = "updated";
    parent.child.name = "updated"
    await parent.save();
    await parent.child.save();
    if(transactional){
        await em.transaction.commit();
    }
}

async function assertObjectsExist(name){

    var persistentParent, persistentChild;

    await em.JSParent.find().equal('name', name).singleResult((parent) => {
        if (! parent) {
            expect.fail("JSParent object with name '" + name + "' does not exist.");
        } else {
            persistentParent = parent;
        }
    });

    await em.JSChild.find().equal('name', name).singleResult((child) => {
        if (! child) {
            expect.fail("JSChild object with name '" + name + "' does not exist.");
        } else {
            persistentChild = child;
        }
    });

    if(persistentParent.child != persistentChild){
        expect.fail("Child of parent does not match.");
    }

}
