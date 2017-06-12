if (typeof module != 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test Partial Updates', function() {
  let emf, metamodel;

  before(function () {
    let personType, addressType;

    emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, schema: {}, tokenStorage: helper.rootTokenStorage });
    metamodel = emf.metamodel;

    metamodel.addType(personType = new DB.metamodel.EntityType('PartialUpdatePerson', metamodel.entity(Object)));
    metamodel.addType(addressType = new DB.metamodel.EmbeddableType('PartialUpdateAddress'));

    personType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('person', personType));
    personType.addAttribute(new DB.metamodel.SingularAttribute('address', addressType));
    personType.addAttribute(new DB.metamodel.SingularAttribute('age', metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('numFriends', metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('tasksToDo', metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('foo', metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('bar', metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('baz', metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('bitmask', metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('date', metamodel.baseType(Date)));
    personType.addAttribute(new DB.metamodel.ListAttribute('listAttr', metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SetAttribute('set', metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('birthplace', metamodel.baseType(DB.GeoPoint)));

    addressType.addAttribute(new DB.metamodel.SingularAttribute('zip', metamodel.baseType(Number)));
    addressType.addAttribute(new DB.metamodel.SingularAttribute('city', metamodel.baseType(String)));

    return metamodel.save();
  });

  describe('Entity Builder', () => {
    let db, p0;

    before(() => {
      db =  emf.createEntityManager();

      p0 = new db.PartialUpdatePerson({
        key: 'query_p0',
        name: 'Konstantin',
        age: 24,
        numFriends: 5,
        listAttr: ['blue'],
        set: ['blue'],
        tasksToDo: 5,
        foo: 23,
        bar: 1337,
        baz: 42,
        bitmask: 0b01010101,
        address: {
          city: 'Cologne',
          zipcode: '50667'
        }
      });
    });

    it('should create an entity partial update builder', function() {
      const pub = p0.partialUpdate();

      expect(pub).to.be.an.instanceof(DB.partialupdate.EntityPartialUpdateBuilder);
      expect(pub._entity).to.equal(p0);
    });

    it('should support numeric operations', function() {
      let pub;
      pub = p0.partialUpdate()
        .increment('age')
        .increment('numFriends', 10)
        .decrement('tasksToDo')
        .multiply('foo', 42)
        .divide('bar', 2)
      ;

      expect(pub.toJSON()).eql({
        $inc: { age: 1, numFriends: 10, tasksToDo: -1 },
        $mul: { foo: 42, bar: 1 / 2 },
      });

      expect(() => p0.partialUpdate().multiply('foo', 'string')).to.throw();
      expect(() => p0.partialUpdate().divide('foo', 'string')).to.throw();

      // An operation overwrite causes an error
      expect(() => p0.partialUpdate()
        .increment('age', 12)
        .decrement('age', 12)).to.throw('Field age already has a $inc operation set');
      expect(() => p0.partialUpdate()
        .multiply('age', 12)
        .divide('age', 12)).to.throw('Field age already has a $mul operation set');
    });

    it('should support min and max operations', function() {
      let pub;
      pub = p0.partialUpdate()
        .min('bar', 1337)
        .max('baz', 23)
      ;
      expect(pub.toJSON()).eql({ $min: { bar: 1337 }, $max: { baz: 23 } });

      // Support the between operation
      pub = p0.partialUpdate().between('bar', 23, 42);
      expect(pub.toJSON()).eql({ $max: { bar: 23 }, $min: { bar: 42 } });

      pub = p0.partialUpdate()
        .atMost('bar', 1337)
        .atLeast('baz', 23)
      ;

      expect(pub.toJSON()).eql({
        $min: { bar: 1337 },
        $max: { baz: 23 },
      });

      // Throw if got strings, not numbers
      expect(() => p0.partialUpdate().min('foo', 'string')).to.throw('Value must be a number');
      expect(() => p0.partialUpdate().max('foo', 'string')).to.throw('Value must be a number');
      expect(() => p0.partialUpdate().atLeast('foo', 'string')).to.throw('Value must be a number');
      expect(() => p0.partialUpdate().atMost('foo', 'string')).to.throw('Value must be a number');
      expect(() => p0.partialUpdate().between('foo', '12', 12)).to.throw('Values must be a number');
      expect(() => p0.partialUpdate().between('foo', 12, '12')).to.throw('Values must be a number');
      expect(() => p0.partialUpdate().between('foo', '12', '12')).to.throw('Values must be a number');
    });

    it('should support set operations', function() {
      let pub;
      const date = new Date();
      pub = p0.partialUpdate()
        .set('age', 25)
        .set('name', 'KSM')
        .set('address.city', 'Hamburg')
        .set('address.zipcode', '22527')
        .set('date', date)
      ;
      expect(pub.toJSON()).eql({
        $set: { age: 25, name: 'KSM', 'address.city': 'Hamburg', 'address.zipcode': '22527', date: date },
      });

      pub = p0.partialUpdate()
        .set('age', null)
        .set('name', null)
      ;
      expect(pub.toJSON()).eql({
        $set: { age: null, name: null },
      });
    });

    it('should support array operations on lists', function() {
      let pub;
      pub = p0.partialUpdate().remove('listAttr', 'green');
      expect(pub.toJSON()).eql({
        $remove: { listAttr: 'green' },
      });

      pub = p0.partialUpdate().push('listAttr', 'red');
      expect(pub.toJSON()).eql({
        $push: { listAttr: 'red' },
      });

      pub = p0.partialUpdate().unshift('listAttr', 'green');
      expect(pub.toJSON()).eql({
        $unshift: { listAttr: 'green' },
      });

      pub = p0.partialUpdate().pop('listAttr');
      expect(pub.toJSON()).eql({
        $pop: { listAttr: null },
      });

      pub = p0.partialUpdate().shift('listAttr');
      expect(pub.toJSON()).eql({
        $shift: { listAttr: null },
      });

      pub = p0.partialUpdate().replace('listAttr', 0, 'green');
      expect(pub.toJSON()).eql({
        $replace: { listAttr: { $at: 0, $to: 'green' } },
      });
    });

    it('should support array operations on sets', function() {
      let pub;
      pub = p0.partialUpdate()
        .add('set', 'red')
        .remove('set', 'blue')
      ;
      expect(pub.toJSON()).eql({
        $add: { set: 'red' },
        $remove: { set: 'blue' },
      });
    });

    it('should support date operations', function() {
      let pub;
      pub = p0.partialUpdate()
        .toNow('date') // alias: .toCurrentDate('date')
      ;

      expect(pub.toJSON()).eql({
        $currentDate: { date: 'timestamp' },
      });
    });

    it('should support meta operations', function() {
      let pub;
      pub = p0.partialUpdate().rename('bitmask', 'bits');
      expect(pub.toJSON()).eql({
        $rename: { bitmask: 'bits' }
      });
    });

    it('should support bitwise operations', function() {
      let pub;
      pub = p0.partialUpdate().and('bitmask', 0b01010000);
      expect(pub.toJSON()).eql({
        $bit: { bitmask: { and: 0b01010000 } }
      });

      pub = p0.partialUpdate().or('bitmask', 0b00001111);
      expect(pub.toJSON()).eql({
        $bit: { bitmask: { or: 0b00001111 } }
      });

      pub = p0.partialUpdate().xor('bitmask', 0b00001010);
      expect(pub.toJSON()).eql({
        $bit: { bitmask: { xor: 0b00001010 } }
      });

      pub = p0.partialUpdate().and('bitmask', 0b01010000);
      expect(pub.toJSON()).eql({
        $bit: { bitmask: { and: 0b01010000 } }
      });

      // An operation overwrite causes an error
      expect(() => p0.partialUpdate()
        .and('bitmask', 0b00001111)
        .or('bitmask', 0b00001111)).to.throw('Field bitmask already has a $bit operation set');

      // Operation can be combined
      pub = p0.partialUpdate()
        .and('bitmask', 0b00001111)
        .or('age', 0b11110000);
      expect(pub.toJSON()).eql({
        $bit: { bitmask: { and: 0b00001111 }, age: { or: 0b11110000 } }
      });
    });
  });

});
