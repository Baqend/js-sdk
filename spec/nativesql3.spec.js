if (typeof module !== 'undefined') {
  require('./node');
}

var emf, em;
describe(' NativeSQL Tests for Collection type attributes', async function () {
  it('Plain select', async function () {
    await setup();
    await storeOne();
    await parentSelect();
    await selectChildMapTable();
    await selectChildSetTable();
    await selectChildListTable();
  });
  it('Map  Join', async function () {
    await setup();
    await storeOne();
    await mapSelectJoin();
  });
  it('Set  Join', async function () {
    await setup();
    await storeOne();
    await setSelectJoin();
  });
  it('List  Join', async function () {
    await setup();
    await storeOne();
    await listSelectJoin();
  });
  it('Conditional select', async function () {
    await setup();
    await storeOne();
    await conditionalSelect();
  });
});

async function parentSelect() {
  const response = await em.nativeQuery.execute('select * from NQStudent');
  expect(response.ok()).eql(true);
  expect(response.size()).eql(1);
}
async function selectChildMapTable() {
  const response = await em.nativeQuery.execute('select * from MAP_NQStudent_MARKS');
  expect(response.ok()).eql(true);
  expect(response.size()).eql(3);
}
async function selectChildSetTable() {
  const response = await em.nativeQuery.execute('select * from SET_NQStudent_COURSES');
  expect(response.ok()).eql(true);
  expect(response.size()).eql(3);
}
async function selectChildListTable() {
  const response = await em.nativeQuery.execute('select * from LIST_NQStudent_EXTRACURRICULAR');
  expect(response.ok()).eql(true);
  expect(response.size()).eql(2);
}

async function mapSelectJoin() {
  const response = await em.nativeQuery.execute('select * from NQStudent  join Map_NQStudent_Marks on NQStudent.id = Map_NQStudent_Marks.parent');
  expect(response.data(0, 'nqstudent:name')).eql('James');
  expect(response.data(0, 'map_nqstudent_marks:key')).eql('Literature');
  expect(response.data(1, 'map_nqstudent_marks:key')).eql('Mathematics');
  expect(response.data(2, 'map_nqstudent_marks:key')).eql('Economics');
}
async function setSelectJoin() {
  const response = await em.nativeQuery.execute('select * from NQStudent  join Set_NQStudent_Courses on NQStudent.id = Set_NQStudent_Courses.parent');
  expect(response.data(0, 'nqstudent:name')).eql('James');
  expect(response.data(0, 'set_nqstudent_courses:element')).eql('Literature');
  expect(response.data(1, 'set_nqstudent_courses:element')).eql('Mathematics');
  expect(response.data(2, 'set_nqstudent_courses:element')).eql('Economics');
}
async function listSelectJoin() {
  const response = await em.nativeQuery.execute('select * from NQStudent  join List_NQStudent_Extracurricular on NQStudent.id = List_NQStudent_Extracurricular.parent');
  expect(response.data(0, 'nqstudent:name')).eql('James');
  expect(response.data(0, 'list_nqstudent_extracurricular:element')).eql('Photography');
  expect(response.data(1, 'list_nqstudent_extracurricular:element')).eql('Sports');
}
async function conditionalSelect() {
  const response = await em.nativeQuery.execute('select value from Map_NQStudent_Marks  where key =\'Mathematics\'');
  expect(response.ok()).eql(true);
  expect(response.size()).eql(1);
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
  var nqtypestudent;

  if (metamodel.entities['/db/NQStudent'] == null) {
    nqtypestudent = new DB.metamodel.EntityType('NQStudent', metamodel.entity(Object));
    metamodel.addType(nqtypestudent);
    nqtypestudent.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
    nqtypestudent.addAttribute(new DB.metamodel.ListAttribute('extracurricular', metamodel.baseType(String)));
    nqtypestudent.addAttribute(new DB.metamodel.SetAttribute('courses', metamodel.baseType(String)));
    nqtypestudent.addAttribute(new DB.metamodel.MapAttribute('marks', metamodel.baseType(String), metamodel.baseType('Integer')));
  }
  await metamodel.save();
}

async function deleteAll() {
  await em.NQStudent.find().resultList((result) => {
    result.forEach((obj) => {
      obj.delete();
    });
  });
}

async function storeOne() {
  var obj = new em.NQStudent();
  obj.name = 'James';
  obj.extracurricular = ['Photography', 'Sports'];
  obj.courses = new Set(['Literature', 'Mathematics', 'Economics']);
  obj.marks = new Map([['Literature', 55], ['Mathematics', 98], ['Economics', 83]]);
  await obj.save();
}
