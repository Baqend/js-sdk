if (typeof module !== 'undefined') {
    require('./node');
}
  
var emf, em;

describe('NativeQuery Tests for NoSQL', async function () {
    
    it('Plain select', async function () {
        await setup();
        await storeOne();
        await selectOne();
    });
    it('Illegal select', async function () {
        await setup();
        await tableDoesntExist();
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
    it('Just garbage', async function () {
        await setup();
        await garbage();
    });
    it('Row exceeds size', async function () {
        await setup();
        await storeOne();
        await rowExceedsSize();
    });
    it('Unkown column in response', async function () {
        await setup();
        await storeOne();
        await selectUnkownColumn();
    });
    it('Header info', async function () {
        await setup();
        await storeOne();
        await headerInfo();
    });
});

async function selectOne(){
    const response = await em.nativeQuery.execute('select nqone from NQOne nqone where nqone.name = \'one\' ');
    expect(response.ok()).eql(true);
    expect(response.size()).eql(1);
    expect(response.data(0, "NQOne:name")).eql("one");
}

async function tableDoesntExist(){
    const response = await em.nativeQuery.execute('select nqone from NotExist nqone where nqone.name = \'one\' ');
    expect(response.ok()).eql(false);
    expect(response.status()).eql(468);
}

async function selectThree(){
    const response = await em.nativeQuery.execute('select nqone from NQOne nqone');
    expect(response.ok()).eql(true);
    expect(1 == response.size());
    var name = response.data(0, "NQOne:name");
    expect(name).that.is.oneOf([ "1", "2", "3" ]);
    name = response.data(1, "NQOne:name");
    expect(name).that.is.oneOf([ "1", "2", "3" ]);
    name = response.data(2, "NQOne:name");
    expect(name).that.is.oneOf([ "1", "2", "3" ]);
}

async function noRow(){
    const response = await em.nativeQuery.execute('select nqone from NQOne nqone where nqone.name = \'notexists\'');
    expect(response.ok()).eql(true);
    expect(response.size()).eql(0);
}

async function garbage(){
    const response = await em.nativeQuery.execute('gnuezelbruenft');
    expect(response.ok()).eql(false);
    expect(response.status()).eql(468);
}

async function rowExceedsSize(){
    const response = await em.nativeQuery.execute('select nqone from NQOne nqone where nqone.name = \'one\' ');
    expect(response.ok()).eql(true);
    expect(response.size()).eql(1);
    var exceptionCaught = false;
    try{
        response.data(1, "nqone:name");
    } catch (err){
        exceptionCaught = true;
        expect(err.toString()).eql('Error: Row must be between 0 and 0 but is: 1');    
    }
    expect(exceptionCaught).eql(true);
}

async function selectUnkownColumn(){
    const response = await em.nativeQuery.execute('select nqone from NQOne nqone where nqone.name = \'one\' ');
    expect(response.ok()).eql(true);
    expect(response.size()).eql(1);
    expect(response.data(0, "NQOne:unknown")).is.undefined;
}


async function headerInfo(){
    const response = await em.nativeQuery.execute('select nqone from NQOne nqone where nqone.name = \'one\' ');
    expect(response.ok()).eql(true);
    expect(response.size()).eql(1);
    const header = response.header();
    expect(header.length).eql(2);

    var columnSpec = header[0];
    var tableName = columnSpec["tableName"];
    expect(tableName).eql("NQOne");
    var columnName = columnSpec["columnName"];
    expect(columnName).eql("id");

    var columnSpec = header[1];
    var tableName = columnSpec["tableName"];
    expect(tableName).eql("NQOne");
    var columnName = columnSpec["columnName"];
    expect(columnName).eql("name");
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

