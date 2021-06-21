if (typeof module !== 'undefined') {
    require('./node');
}
  
var emf, em;

describe('TPC-H Queries', async function () {
    it('Plain select', async function () {
        await setup();
        await select1();
   });
});

async function select1(){
    const response = await em.nativeQuery.execute('select l_returnflag, l_linestatus, sum(l_quantity) as sum_qty, sum(l_extendedprice) as sum_base_price, sum(l_extendedprice * (1 - l_discount)) as sum_disc_price,    sum(l_extendedprice * (1 - l_discount) * (1 + l_tax)) as sum_charge, avg(l_quantity) as avg_qty, avg(l_extendedprice) as avg_price, avg(l_discount) as avg_disc, count(*) as count_order from lineitem where l_shipdate <= cast(\'1998-12-01\' as date) - \'90 days\' group by l_returnflag, l_linestatus order by l_returnflag, l_linestatus');
    expect(response.ok()).eql(true);
    console.log(response);
}

async function setup(){
    await connect(true);
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


