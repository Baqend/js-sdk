if (typeof module !== 'undefined') {
    require('./node');
}
  
var emf, em;

describe('TPC-H Queries', async function () {
    it('Pricing Summary Report', async function () {
        await setup();
        await select1();
    });
    it('Minimum Cost Supplier', async function () {
        await setup();
        await select2();
    });
    it('Shipping Priority', async function () {
        await setup();
        await select3();
    });
    it('Order Priority Checking', async function () {
        await setup();
        await select4();
    });
    it('Local Supplier Volume', async function () {
        await setup();
        await select5();
    });
    it('Forecasting Revenue Change', async function () {
        await setup();
        await select6();
    });
    it('Volume Shipping', async function () {
        await setup();
        await select7();
    });
    it('National Market Share', async function () {
        await setup();
        await select8();
    });
    it('Product Type Profit Measure', async function () {
        await setup();
        await select9();
    });
    it('Returned Item Reporting', async function () {
        await setup();
        await select10();
    });
    it('Important Stock Indentification', async function () {
        await setup();
        await select11();
    });
});

async function select1(){
    const response = await em.nativeQuery.execute('select l_returnflag, l_linestatus, sum(l_quantity) as sum_qty, sum(l_extendedprice) as sum_base_price, sum(l_extendedprice * (1 - l_discount)) as sum_disc_price,    sum(l_extendedprice * (1 - l_discount) * (1 + l_tax)) as sum_charge, avg(l_quantity) as avg_qty, avg(l_extendedprice) as avg_price, avg(l_discount) as avg_disc, count(*) as count_order from lineitem where l_shipdate <= cast(\'1998-12-01\' as date) - \'90 days\' group by l_returnflag, l_linestatus order by l_returnflag, l_linestatus');
    expect(response.ok()).eql(true);
    console.log(response);
}

async function select2(){
    const response = await em.nativeQuery.execute("select first 100     s_acctbal,     s_name,     n_name,     p_partkey,     p_mfgr,     s_address,     s_phone,     s_comment from     part,     supplier,     partsupp,     nation,     region where     p_partkey = ps_partkey     and s_suppkey = ps_suppkey     and p_size = 15     and p_type like '%BRASS'     and s_nationkey = n_nationkey     and n_regionkey = r_regionkey     and r_name = 'EUROPE'     and ps_supplycost = (         select             min(ps_supplycost)         from             partsupp,             supplier,             nation,             region         where             p_partkey = ps_partkey             and s_suppkey = ps_suppkey             and s_nationkey = n_nationkey             and n_regionkey = r_regionkey             and r_name = 'EUROPE'     ) order by  s_acctbal desc, n_name, s_name, p_partkey");
    expect(response.ok()).eql(true);
    console.log(response);
}

async function select3(){
    const response = await em.nativeQuery.execute("select first 10     l_orderkey,     sum(l_extendedprice * (1 - l_discount)) as revenue,     o_orderdate,     o_shippriority from     customer,     orders,     lineitem where     c_mktsegment = 'BUILDING'     and c_custkey = o_custkey     and l_orderkey = o_orderkey     and o_orderdate < '1995-03-15'     and l_shipdate > '1995-03-15' group by     l_orderkey,     o_orderdate,     o_shippriority order by     revenue desc,     o_orderdate");
    expect(response.ok()).eql(true);
    console.log(response);
}

async function select4(){
    const response = await em.nativeQuery.execute("select     o_orderpriority,     count(*) as order_count     from     orders where     o_orderdate >= '1993-07-01'     and o_orderdate < cast('1993-07-01' as date) + ' 3 months'     and exists (         select             *         from             lineitem         where             l_orderkey = o_orderkey             and l_commitdate < l_receiptdate     ) group by     o_orderpriority order by     o_orderpriority");
    expect(response.ok()).eql(true);
    console.log(response);
}

async function select5(){
    const response = await em.nativeQuery.execute("select     n_name,     sum(l_extendedprice * (1 - l_discount)) as revenue from     customer,     orders,     lineitem,     supplier,     nation,     region where     c_custkey = o_custkey     and l_orderkey = o_orderkey     and l_suppkey = s_suppkey     and c_nationkey = s_nationkey     and s_nationkey = n_nationkey     and n_regionkey = r_regionkey     and r_name = 'ASIA'     and o_orderdate >= '1994-01-01'     and o_orderdate < cast('1994-01-01' as date) + '1 year'  group by     n_name order by     revenue desc");
    expect(response.ok()).eql(true);
    console.log(response);
}

async function select6(){
    const response = await em.nativeQuery.execute("select     sum(l_extendedprice*l_discount) as revenue from     lineitem where     l_shipdate >= '1994-01-01'     and l_shipdate < cast ('1994-01-01' as date) + '1 year'     and l_discount between 0.06 - 0.01 and 0.06 + 0.01     and l_quantity < 24");
    expect(response.ok()).eql(true);
    console.log(response);
}

async function select7(){
    const response = await em.nativeQuery.execute("select     supp_nation,     cust_nation,     l_year, sum(volume) as revenue from (     select         n1.n_name as supp_nation,         n2.n_name as cust_nation,         extract(year from l_shipdate) as l_year,         l_extendedprice * (1 - l_discount) as volume     from         supplier,         lineitem,         orders,         customer,         nation n1,         nation n2     where         s_suppkey = l_suppkey         and o_orderkey = l_orderkey         and c_custkey = o_custkey         and s_nationkey = n1.n_nationkey         and c_nationkey = n2.n_nationkey         and (             (n1.n_name = 'FRANCE' and n2.n_name = 'GERMANY')             or (n1.n_name = 'GERMANY' and n2.n_name = 'FRANCE')         )         and l_shipdate between '1995-01-01' and '1996-12-31'     ) as shipping group by     supp_nation,     cust_nation,     l_year order by     supp_nation,     cust_nation,     l_year");
    expect(response.ok()).eql(true);
    console.log(response);
}

async function select8(){
    const response = await em.nativeQuery.execute("select     o_year,     sum(case         when nation = 'BRAZIL'         then volume         else 0     end) / sum(volume) as mkt_share from (     select         extract(year from o_orderdate) as o_year,         l_extendedprice * (1-l_discount) as volume,         n2.n_name as nation     from         part,         supplier,         lineitem,         orders,         customer,         nation n1,         nation n2,         region     where         p_partkey = l_partkey         and s_suppkey = l_suppkey         and l_orderkey = o_orderkey         and o_custkey = c_custkey         and c_nationkey = n1.n_nationkey         and n1.n_regionkey = r_regionkey         and r_name = 'AMERICA'         and s_nationkey = n2.n_nationkey         and o_orderdate between '1995-01-01' and '1996-12-31'         and p_type = 'ECONOMY ANODIZED STEEL'     ) as all_nations group by     o_year order by     o_year");
    expect(response.ok()).eql(true);
    console.log(response);
}

async function select9(){
    const response = await em.nativeQuery.execute("select     nation,     o_year,     sum(amount) as sum_profit from (     select         n_name as nation,         extract(year from o_orderdate) as o_year,         l_extendedprice * (1 - l_discount) - ps_supplycost * l_quantity as amount     from         part,         supplier,         lineitem,         partsupp,         orders,         nation     where         s_suppkey = l_suppkey         and ps_suppkey = l_suppkey         and ps_partkey = l_partkey         and p_partkey = l_partkey         and o_orderkey = l_orderkey         and s_nationkey = n_nationkey         and p_name like '%green%'     ) as profit group by     nation,     o_year order by     nation,     o_year desc");
    expect(response.ok()).eql(true);
    console.log(response);
}

async function select10(){
    const response = await em.nativeQuery.execute("select first 20     c_custkey,     c_name,     sum(l_extendedprice * (1 - l_discount)) as revenue,     c_acctbal,     n_name,     c_address,     c_phone,     c_comment from     customer,     orders,     lineitem,     nation where     c_custkey = o_custkey     and l_orderkey = o_orderkey     and o_orderdate >= '1993-10-01'     and o_orderdate < cast ('1993-10-01' as date) + '3 months'     and l_returnflag = 'R'     and c_nationkey = n_nationkey group by     c_custkey,     c_name,     c_acctbal,     c_phone,     n_name,     c_address,     c_comment order by     revenue desc");
    expect(response.ok()).eql(true);
    console.log(response);
}

async function select11(){
    const response = await em.nativeQuery.execute("select     ps_partkey,     sum(ps_supplycost * ps_availqty) as value from     partsupp,     supplier,     nation where     ps_suppkey = s_suppkey     and s_nationkey = n_nationkey     and n_name = 'GERMANY' group by     ps_partkey having         sum(ps_supplycost * ps_availqty) > (             select                 sum(ps_supplycost * ps_availqty) * 0.0001             from                 partsupp,                 supplier,                 nation             where                 ps_suppkey = s_suppkey                 and s_nationkey = n_nationkey                 and n_name = 'GERMANY'         ) order by     value desc");
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


