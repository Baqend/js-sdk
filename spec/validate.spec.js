if (typeof DB == 'undefined') {
  env = require('./env');
  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");
  chai.use(chaiAsPromised);
  chai.config.includeStack = true;
  expect = chai.expect;
  DB = require('../lib');
}

describe('Test validate', function() {
  var db, type, person;

  before(function() {
    var emf = new DB.EntityManagerFactory(env.TEST_SERVER);
    var metamodel = emf.metamodel;

    metamodel.init({});
    var personType = new DB.metamodel.EntityType("ValidatePerson", metamodel.entity(Object));
    metamodel.addType(personType);

    personType.addAttribute(new DB.metamodel.SingularAttribute("name", metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("age", metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("date", metamodel.baseType(Date)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("email", metamodel.baseType(String)));

    personType.validationCode = "email.isEmail();";

    return saveMetamodel(metamodel).then(function() {
      db = emf.createEntityManager();
    });
  });

  beforeEach(function() {
    person = db.ValidatePerson();
    type = DB.util.Metadata.get(person).type;
  });

  it('should validate email', function() {
    type.validationCode = "email.isEmail();";
    person.email = "testtest.de";
    var result = person.validate().fields;
    expect(result.email).be.instanceOf(DB.util.Validator);
    expect(result.email.isValid).be.false;
    expect(result.email.errors).have.length(1);

    person.email = "test@test.de";
    result = person.validate().fields;
    expect(result.email.isValid).be.true;
    expect(result.email.errors).have.length(0);
  });

  it('should use own error message', function() {
    var message = 'TestError';
    type.validationCode = "email.isEmail('"+message+"');";
    person.email = "testtest.de";
    var result = person.validate().fields;
    expect(result.email).be.instanceOf(DB.util.Validator);
    expect(result.email.isValid).be.false;
    expect(result.email.errors).have.length(1);
    expect(result.email.errors[0]).eqls(message);
  });

  it('should allow multiple validators', function() {
    type.validationCode = "email.isEmail().isLowercase();";
    person.email = "tesTtest.de";
    var result = person.validate().fields;
    expect(result.email).be.instanceOf(DB.util.Validator);
    expect(result.email.isValid).be.false;
    expect(result.email.errors).have.length(2);
    expect(result.email.errors[0]).eqls('isEmail');
    expect(result.email.errors[1]).eqls('isLowercase');

    person.email = "test@test.de";
    result = person.validate().fields;
    expect(result.email.isValid).be.true;
    expect(result.email.errors).have.length(0);
  });

  it('should use own validate function', function() {
    person.age = 20;
    var message = 'TestError';
    type.validationCode = "email.is('"+message+"', function(value) { return value <= 18 && value >= 13 });";
    var result = person.validate().fields;
    expect(result.email).be.instanceOf(DB.util.Validator);
    expect(result.email.isValid).be.false;
    expect(result.email.errors).have.length(1);
    expect(result.email.errors[0]).eqls(message);

    person.age = 15;
    result = person.validate().fields;
    expect(result.name.isValid).be.true;
    expect(result.name.errors).have.length(0);
  });

  it('should allow validate functions with multiple arguments', function() {
    person.name = "Peter";
    person.age = "20";
    var message = 'TestError';
    type.validationCode = "name.equals('"+message+"', age);";
    var result = person.validate().fields;
    expect(result.name).be.instanceOf(DB.util.Validator);
    expect(result.name.isValid).be.false;
    expect(result.name.errors).have.length(1);
    expect(result.name.errors[0]).eqls(message);

    person.name = "20";
    result = person.validate().fields;
    expect(result.name.isValid).be.true;
    expect(result.name.errors).have.length(0);
  });

  it('should validate date', function() {
    type.validationCode = "date.isDate();";
    var result = person.validate().fields;
    person.date = "1982-13-48";
    expect(result.date).be.instanceOf(DB.util.Validator);
    expect(result.date.isValid).be.false;
    expect(result.date.errors).have.length(1);

    person.date = new Date("1976-11-13");
    result = person.validate().fields;
    expect(result.date.isValid).be.true;
    expect(result.date.errors).have.length(0);
  });

  it('should get error result from server', function() {
    person.email = "testtest.de";
    return person.save().catch(function(result) {
      expect(result.data.email.isValid).be.false;
    });
  });


});