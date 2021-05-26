if (typeof module !== 'undefined') {
    require('./node');
}
  
var emf, em;

describe('Still more NativeSQL Tests', async function () {
    it('Plain select', async function () {
        await setup();
        await storeOne();
        await selectOne();
    });
    it('Select columns', async function () {
        await setup();
        await storeOne();
        await selectColumns();
    });
    it('Select columns with OR condition', async function () {
        await setup();
        await storeOne();
        await selectColumnsOR();
    });
    it('Null columns', async function () {
        await setup();
        await storeNullMembers();
        await selectNullColumns();
    });
    it('Group by', async function () {
        await setup();
        await storeMany();
        await selectGroupBy();
    });
    it('Join', async function () {
        await setup();
        await prepareJoin();
        await selectJoin();
    });
    it('Drop table', async function () {
        await setup();
        await dropTable();

    });

});

async function selectOne(){
    const response = await em.nativeQuery.execute('select * from NQ1 where mstr = \'one\' ');
    expect(response[1]["row"]["nq1:mstr"]).eql("one");
}

async function selectColumns(){
    const response = await em.nativeQuery.execute('select mstr, mint from NQ1 where mstr = \'one\' and mint = 1 ');
    expect(response[1]["row"]["nq1:mstr"]).eql("one");
}

async function selectColumnsOR(){
    const response = await em.nativeQuery.execute('select mstr, mint from NQ1 where mstr = \'two\' or mint = 1');
    expect(response[1]["row"]["nq1:mint"]).eql(1);
}

async function selectNullColumns(){
    const response = await em.nativeQuery.execute('select * from NQ1');
    expect(response[1]["row"]["nq1:mstr"]).eql(null);
    expect(response[1]["row"]["nq1:mint"]).eql(null);
}

async function selectGroupBy(){
    const response = await em.nativeQuery.execute('select max(NQ1.id), mstr from NQ1 group by mstr order by mstr');
    expect(response[1]["row"]["nq1:mstr"]).eql("0");
    expect(response[2]["row"]["nq1:mstr"]).eql("1");
}

async function selectJoin(){
    const response = await em.nativeQuery.execute('select * from NQ1 left join NQ2 on NQ1.mint = NQ2.m2key');
    expect(response[1]["row"]["nq1:mstr"]).eql("one");
    expect(response[1]["row"]["nq2:m2str"]).eql("2one");
    expect(response[2]["row"]["nq2:m2str"]).eql(null);
}

async function dropTable(){

    // const response = await em.nativeQuery.execute('drop table NQ2');

    // If we execute the above line, the system is temporarily broken.
    // This documents that native SQL is potentially dangerous.

    // TODO: Guard native SQL execution from drop table and alter table calls.
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
    if(metamodel.entities["/db/NQ1"] == null){
        var nqtype = new DB.metamodel.EntityType('NQ1', metamodel.entity(Object));
        metamodel.addType(nqtype);
        nqtype.addAttribute(new DB.metamodel.SingularAttribute('mstr', metamodel.baseType(String)));
        nqtype.addAttribute(new DB.metamodel.SingularAttribute('mint', metamodel.baseType('Integer')));
    }
    if(metamodel.entities["/db/NQ2"] == null){
        var nqtype = new DB.metamodel.EntityType('NQ2', metamodel.entity(Object));
        metamodel.addType(nqtype);
        nqtype.addAttribute(new DB.metamodel.SingularAttribute('m2str', metamodel.baseType(String)));
        nqtype.addAttribute(new DB.metamodel.SingularAttribute('m2key', metamodel.baseType('Integer')));
    }

    await metamodel.save();
}

async function deleteAll(){
    await em.NQ1.find().resultList((result) => {
        result.forEach((obj) => {
            obj.delete();
        });
    });
    await em.NQ2.find().resultList((result) => {
        result.forEach((obj) => {
            obj.delete();
        });
    });
}

async function storeOne(){
    var obj = new em.NQ1();
    obj.mstr = "one";
    obj.mint = 1;
    await obj.save();
}

async function storeNullMembers(){
    var obj = new em.NQ1();
    await obj.save();
}

async function storeMany(){
    for(let i = 1; i <= 10; i++){
        var obj = new em.NQ1();
        obj.mstr = "" + (i % 2);
        await obj.save();
    }
}

async function prepareJoin(){
    var obj = new em.NQ1();
    obj.mstr = "one"
    obj.mint = 1;
    await obj.save();
    obj = new em.NQ1();
    obj.mstr = "two"
    obj.mint = 2;
    await obj.save();
    obj = new em.NQ1();
    obj.mstr = "three"
    obj.mint = 3;
    await obj.save();
    obj = new em.NQ2();
    obj.m2str = "2one"
    obj.m2key = 1;
    await obj.save();
}
