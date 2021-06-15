if (typeof module !== 'undefined') {
  require('./node');
}

var emf, em;

describe('More NativeSQL Tests', async function () {
  it('Plain insert', async function () {
    await setup();
    await storeOne();
    await simpleInsert();
  });
});

async function simpleInsert() {
  const response = await em.nativeQuery.execute('insert into NQOne (id, name) values (188,\'one\')');
  expect(response.ok()).eql(true);
  expect(response.message()).eql('1 rows inserted');
}

async function setup() {
  await connect(false);
  await produceMetaModel();
  await connect(true);
  await deleteAll();
}

async function connect(withSchema) {
  if (withSchema) {
    emf = await new DB.EntityManagerFactory(env.TEST_SERVER);
  } else {
    emf = await new DB.EntityManagerFactory({ host: env.TEST_SERVER, schema: [], tokenStorage: helper.rootTokenStorage });
  }
  await emf.ready();
  em = await emf.createEntityManager();
  await em.ready();
  if (withSchema) {
    await login();
  }
}

async function login() {
  await em.User.login('root', 'root');
}

async function produceMetaModel() {
  const { metamodel } = emf;
  if (metamodel.entities['/db/NQOne'] != null) {
    return;
  }
  var nqtype = new DB.metamodel.EntityType('NQOne', metamodel.entity(Object));
  metamodel.addType(nqtype);
  nqtype.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
  await metamodel.save();
}

async function deleteAll() {
  await em.NQOne.find().resultList((result) => {
    result.forEach((obj) => {
      obj.delete();
    });
  });
}

async function storeOne() {
  var obj = new em.NQOne();
  obj.name = 'one';
  await obj.save();
}
