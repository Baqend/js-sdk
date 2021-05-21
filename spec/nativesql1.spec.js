if (typeof module !== 'undefined') {
    require('./node');
}
  
var emf, em;

describe('More NativeSQL Tests', async function () {
    it('Plain select', async function () {
        await connect(false);
        await produceMetaModel();
        await connect(true);
        await deleteStore();
        await select();
   });
});

async function select(){
    const response = await em.nativeQuery.execute('select * from NQOne where name = \'one\' ');
    expect(response[1]["row"]["nqone:name"]).eql("one");
}

async function deleteStore(){
    await deleteAllObjects();
    const obj = await storeOneObject();
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
    if(metamodel.entities["/db/NQOne"] != null){
        return;
    }
    var nqtype = new DB.metamodel.EntityType('NQOne', metamodel.entity(Object));
    metamodel.addType(nqtype);
    nqtype.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
    await metamodel.save();
}

async function deleteAllObjects(){
    await em.NQOne.find().resultList((result) => {
        result.forEach((obj) => {
            obj.delete();
        });
    });
}

async function storeOneObject(){
    var obj = new em.NQOne();
    obj.name = "one";
    await obj.save();
    return obj;
}
