const { set } = require('shelljs');

if (typeof module !== 'undefined') {
  require('./node');
}

var emf, em, obj;

describe('Partial Updates for NoSQL', async function () {
  // List Operations

  it('Push', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .push('mlist', 'ListItem4')
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.mlist[3]).to.equal('ListItem4');
      });
  });
  it('Push for Integer type', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .push('ilist', 400)
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.ilist[3]).to.equal(400);
      });
  });

  it('Pop', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .pop('mlist')
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.mlist[1]).to.equal('ListItem2');
      });
  });
  it('Pop for integer type', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .pop('ilist')
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.ilist[1]).to.equal(200);
      });
  });

  it('Unshift', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .unshift('mlist', 'ListItem0')
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.mlist[0]).to.equal('ListItem0');
      });
  });
  it('Unshift for integer type', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .unshift('ilist', 0)
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.ilist[0]).to.equal(0);
      });
  });
  it('Shift', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .shift('mlist')
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.mlist[0]).to.equal('ListItem2');
      });
  });
  it('Shift for integer type', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .shift('ilist')
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.ilist[0]).to.equal(200);
      });
  });
  it('Replace', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .replace('mlist', 1, 'ReplacedListItem')
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.mlist[1]).to.equal('ReplacedListItem');
      });
  });
  it('Replace for integer type', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .replace('ilist', 1, 500)
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.ilist[1]).to.equal(500);
      });
  });
  it('List Remove', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .remove('mlist', 'ListItem1')
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.mlist[0]).to.equal('ListItem2');
      });
  });
  it('List Remove for integer type', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .remove('ilist', 100)
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.ilist[0]).to.equal(200);
      });
  });
  // Set Operation
  it('Add', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .add('mset', 'SetItem4')
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.mset.size).eql(4);
      });
  });
  it('Add for integer type', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .add('iset', 4)
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.iset.size).eql(4);
      });
  });
  it('Set Remove', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .remove('mset', 'SetItem1')
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.mset.size).eql(2);
      });
  });
  it('Set Remove for integer type', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .remove('iset', 1)
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.iset.size).eql(2);
      });
  });
  // Map Operation
  it('Put', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .put('mmap', 'four', 'MapItem4')
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.mmap.size).eql(4);
      });
  });
  
  it('Map Remove', async function () {
    await setup();
    obj = await storeObjects();
    return obj.partialUpdate()
      .remove('mmap', 'one')
      .execute()
      .then(function (result) {
        expect(result).to.equal(obj);
        expect(obj.mmap.size).eql(2);
      });
  });
});

async function setup() {
  await connect(false);
  await produceMetaModel();
  await connect(true);
  await deleteAllObjects();
}

async function connect(withSchema) {
  if (withSchema) {
    emf = await new DB.EntityManagerFactory(env.TEST_SERVER);
  } else {
    emf = await new DB.EntityManagerFactory({ host: env.TEST_SERVER, schema: [], tokenStorage: helper.rootTokenStorage });
  }
  em = emf.createEntityManager();
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
  if (metamodel.entities['/db/PUNoSQL'] != null) {
    return;
  }

  var putype = new DB.metamodel.EntityType('PUNoSQL', metamodel.entity(Object));
  metamodel.addType(putype);

  putype.addAttribute(new DB.metamodel.ListAttribute('mlist', metamodel.baseType(String)));
  putype.addAttribute(new DB.metamodel.SetAttribute('mset', metamodel.baseType(String)));
  putype.addAttribute(new DB.metamodel.MapAttribute('mmap', metamodel.baseType(String), metamodel.baseType(String)));
  putype.addAttribute(new DB.metamodel.ListAttribute('ilist', metamodel.baseType('Integer')));
  putype.addAttribute(new DB.metamodel.SetAttribute('iset', metamodel.baseType('Integer')));
  // putype.addAttribute(new DB.metamodel.MapAttribute('imap', metamodel.baseType(String), metamodel.baseType('Integer')));

  await metamodel.save();
}

async function storeObjects() {
  var obj = new em.PUNoSQL();
  obj.mlist = new DB.List('ListItem1', 'ListItem2', 'ListItem3');
  obj.mset = new DB.Set(['SetItem1', 'SetItem2', 'SetItem3']);
  obj.mmap = new DB.Map([
    ['one', 'MapItem1'],
    ['two', 'MapItem2'],
    ['three', 'MapItem3'],
  ]);
  obj.ilist = new DB.List(100, 200, 300);
  obj.iset = new DB.Set([1, 2, 3]);

  await obj.save();
  return obj;
}

async function deleteAllObjects() {
  await em.PUNoSQL.find().resultList((result) => {
    result.forEach((obj) => {
      obj.delete();
    });
  });
}
