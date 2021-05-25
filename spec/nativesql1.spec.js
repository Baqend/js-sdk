if (typeof module !== 'undefined') {
    require('./node');
}
  
var emf, em;

describe('More NativeSQL Tests', async function () {
    it('Illegal select', async function () {
        await setup();
        await illegalSelect();
    });
    it('Plain select', async function () {
        await setup();
        await storeOne();
        await selectOne();
   });
   it('Multiple rows', async function () {
        await setup();
        await storeThree();
        await selectThree();
    });
    it('No row', async function () {
        await setup();
        await noRow();
    });
    it('Select column', async function () {
        await setup();
        await storeOne();
        await selectColumn();
    });
    it('Just garbage', async function () {
        await setup();
        await garbage();
    });
    it('Unknown field', async function () {
        await setup();
        await unknownField();
    });
});

async function illegalSelect(){
    const response = await em.nativeQuery.execute('select * from NQOne where name = "one" ');
    // TODO: Information about the failed query should be in the response.
}

async function selectOne(){
    const response = await em.nativeQuery.execute('select * from NQOne where name = \'one\' ');
    expect(response[1]["row"]["nqone:name"]).eql("one");
}

async function selectThree(){
    const response = await em.nativeQuery.execute('select * from NQOne');
    var name = response[1]["row"]["nqone:name"];
    expect(name == "1" || name == "2" || name == "3");
    name = response[2]["row"]["nqone:name"];
    expect(name == "1" || name == "2" || name == "3");
    name = response[3]["row"]["nqone:name"];
    expect(name == "1" || name == "2" || name == "3");
}

async function noRow(){
    const response = await em.nativeQuery.execute('select * from NQOne where name = \'notexists\' ');
    expect(response.size === 1);
}

async function selectColumn(){
    const response = await em.nativeQuery.execute('select name from NQOne where name = \'one\' ');
    expect(response[1]["row"]["nqone:name"]).eql("one");
}

async function garbage(){
    const response = await em.nativeQuery.execute('gnuezelbruenft');
    // TODO: Information about the failed query should be in the response.
}

async function unknownField(){
    const response = await em.nativeQuery.execute('select notexists from NQOne');
    // TODO: Information about the failed query should be in the response.
}

async function setup(){
    await connect(false);
    await produceMetaModel();
    await connect(true);
    await deleteAll();
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

async function deleteAll(){
    await em.NQOne.find().resultList((result) => {
        result.forEach((obj) => {
            obj.delete();
        });
    });
}

async function storeOne(){
    var obj = new em.NQOne();
    obj.name = "one";
    await obj.save();
}


async function storeThree(){
    for(let i = 1; i <= 3; i++){
        var obj = new em.NQOne();
        obj.name = "" + i;
        await obj.save();
    }
}

