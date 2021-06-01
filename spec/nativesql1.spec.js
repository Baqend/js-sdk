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
    expect(response.ok()).eql(false);
    expect(response.status()).eql(468);
}

async function selectOne(){
    const response = await em.nativeQuery.execute('select * from NQOne where name = \'one\' ');
    expect(response.ok()).eql(true);
    expect(response.size()).eql(1);
    expect(response.data(0, "nqone:name")).eql("one");
}

async function selectThree(){
    const response = await em.nativeQuery.execute('select * from NQOne');
    expect(response.ok()).eql(true);
    expect(1 == response.size());
    var name = response.data(0, "nqone:name");
    expect(name).that.is.oneOf([ "1", "2", "3" ]);
    name = response.data(1, "nqone:name");
    expect(name).that.is.oneOf([ "1", "2", "3" ]);
    name = response.data(2, "nqone:name");
    expect(name).that.is.oneOf([ "1", "2", "3" ]);
}

async function noRow(){
    const response = await em.nativeQuery.execute('select * from NQOne where name = \'notexists\' ');
    expect(response.ok()).eql(true);
    expect(response.size()).eql(0);
}

async function selectColumn(){
    const response = await em.nativeQuery.execute('select name from NQOne where name = \'one\' ');
    expect(response.ok()).eql(true);
    expect(response.size()).eql(1);
    expect(response.data(0, "nqone:name")).eql("one");
}

async function garbage(){
    const response = await em.nativeQuery.execute('gnuezelbruenft');
    expect(response.ok()).eql(false);
    expect(response.status()).eql(468);
}

async function unknownField(){
    const response = await em.nativeQuery.execute('select notexists from NQOne');
    expect(response.ok()).eql(false);
    expect(response.status()).eql(468);
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

