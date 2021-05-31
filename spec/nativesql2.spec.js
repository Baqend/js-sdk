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
    it('countQuery', async function () {
        await setup();
        await storeMany();
        await countQuery();
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
    it('Right join', async function () {
        await setup();
        await prepareJoin();
        await selectRightJoin();
    });
    it('Join of 3 tables', async function () {
        await setup();
        await prepareJoin();
        await selectJoin2();
    });
    it('Drop table', async function () {
        await setup();
        await dropTable();

    });

});

async function selectOne(){
    const response = await em.nativeQuery.execute('select * from NQ1 where mstr = \'one\' ');
    expect(response.data(0, "nq1:mstr")).eql("one");
}

async function selectColumns(){
    const response = await em.nativeQuery.execute('select mstr, mint from NQ1 where mstr = \'one\' and mint = 1 ');
    expect(response.data(0, "nq1:mstr")).eql("one");
}

async function selectColumnsOR(){
    const response = await em.nativeQuery.execute('select mstr, mint from NQ1 where mstr = \'two\' or mint = 1');
    expect(response.data(0, "nq1:mint")).eql(1);
}
async function countQuery(){
    const response = await em.nativeQuery.execute('select count(*) from NQ1');
    expect(response.data(0, ":count")).eql(10);
}

async function selectNullColumns(){
    const response = await em.nativeQuery.execute('select * from NQ1');
    expect(response.data(0, "nq1:mstr")).eql(null);
    expect(response.data(0, "nq1:mint")).eql(null);
}

async function selectGroupBy(){
    const response = await em.nativeQuery.execute('select max(NQ1.id), mstr from NQ1 group by mstr order by mstr');
    expect(response.data(0, "nq1:mstr")).eql("0");
    expect(response.data(1, "nq1:mstr")).eql("1");
}

async function selectJoin(){
    const response = await em.nativeQuery.execute('select * from NQ1 left join NQ2 on NQ1.mint = NQ2.m2key');
    expect(response.data(0, "nq1:mstr")).eql("one");
    expect(response.data(0, "nq2:m2str")).eql("2one");
    expect(response.data(1, "nq2:m2str")).eql("2two");
    expect(response.data(2, "nq2:m2str")).eql("2three");
    expect(response.data(3, "nq2:m2str")).eql(null);
}
async function selectRightJoin(){
    const response = await em.nativeQuery.execute('select * from NQ1 Right join NQ2 on NQ1.mint = NQ2.m2key');
    expect(response.data(0, "nq1:mstr")).eql("one");
    expect(response.data(0, "nq2:m2str")).eql("2one");
    expect(response.data(1, "nq2:m2str")).eql("2two");
    expect(response.data(3, "nq1:mstr")).eql(null);
    expect(response.data(3, "nq2:m2str")).eql("2five");
}
async function selectJoin2(){
    const response = await em.nativeQuery.execute('select * from NQ1 left join NQ2 on NQ1.mint = NQ2.m2key join NQ3 on NQ2.m2key=NQ3.m3key');
    expect(response.data(0, "nq1:mstr")).eql("one");
    expect(response.data(0, "nq2:m2str")).eql("2one");
    expect(response.data(0, "nq3:m3str")).eql("3one");
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
    if(metamodel.entities["/db/NQ3"] == null){
        var nqtype = new DB.metamodel.EntityType('NQ3', metamodel.entity(Object));
        metamodel.addType(nqtype);
        nqtype.addAttribute(new DB.metamodel.SingularAttribute('m3str', metamodel.baseType(String)));
        nqtype.addAttribute(new DB.metamodel.SingularAttribute('m3key', metamodel.baseType('Integer')));
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
    await em.NQ3.find().resultList((result) => {
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
    obj = new em.NQ1();
    obj.mstr = "four"
    obj.mint = 4;
    await obj.save();
    obj = new em.NQ2();
    obj.m2str = "2one"
    obj.m2key = 1;
    await obj.save();
    obj = new em.NQ2();
    obj.m2str = "2two"
    obj.m2key = 2;
    await obj.save();
    obj = new em.NQ2();
    obj.m2str = "2three"
    obj.m2key = 3;
    await obj.save();
    obj = new em.NQ2();
    obj.m2str = "2five"
    obj.m2key = 5;
    await obj.save();
    obj = new em.NQ3();
    obj.m3str = "3one"
    obj.m3key = 1;
    await obj.save();
}
