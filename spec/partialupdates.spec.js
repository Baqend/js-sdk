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
    personType.addAttribute(new DB.metamodel.ListAttribute('colors', metamodel.baseType(String)));
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
        colors: ['blue'],
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

    it('should support numeric operations', function() {
      const pub0 = p0.partialUpdate()
        .increment('age')
        .increment('numFriends', 10)
        .decrement('tasksToDo')
        .multiply('foo', 42)
        .divide('bar', 2)
      ;

      expect(pub0.toJSON()).eql({
        $inc: { age: 1, numFriends: 10, tasksToDo: -1 },
        $mul: { foo: 42, bar: 0.5 },
      });

      expect(() => p0.partialUpdate().multiply('foo', 'string')).to.throw();
      expect(() => p0.partialUpdate().divide('foo', 'string')).to.throw();
    });

    it('should support min and max operations', function() {
      const pub0 = p0.partialUpdate()
        .min('bar', 1337)
        .max('baz', 23)
      ;

      expect(pub0.toJSON()).eql({
        $min: { bar: 1337 },
        $max: { baz: 23 },
      });

      const pub1 = p0.partialUpdate()
        .atMost('bar', 1337)
        .atLeast('baz', 23)
      ;

      expect(pub1.toJSON()).eql({
        $min: { bar: 1337 },
        $max: { baz: 23 },
      });

      expect(() => p0.partialUpdate().min('foo', 'string')).to.throw();
      expect(() => p0.partialUpdate().max('foo', 'string')).to.throw();
      expect(() => p0.partialUpdate().atLeast('foo', 'string')).to.throw();
      expect(() => p0.partialUpdate().atMost('foo', 'string')).to.throw();
    });

    it('should support set operations', function() {
      const date = new Date();
      const pub0 = p0.partialUpdate()
        .set('age', 25)
        .set('name', 'KSM')
        .set('address.city', 'Hamburg')
        .set('address.zipcode', '22527')
        .set('date', date)
      ;
      expect(pub0.toJSON()).eql({
        $set: { age: 25, name: 'KSM', 'address.city': 'Hamburg', 'address.zipcode': '22527', date: date },
      });

      const pub1 = p0.partialUpdate()
        .set('age', null)
        .set('name', null)
      ;
      expect(pub1.toJSON()).eql({
        $unset: { age: '', name: '' },
      });
    });

    it('should support array operations', function() {
      const pub0 = p0.partialUpdate()
        .push('colors', 'red')
        .pull('colors', 'blue')
      ;
      expect(pub0.toJSON()).eql({
        $push: { colors: 'red' },
        $pull: { colors: 'blue' },
      });

      const pub1 = p0.partialUpdate().pop('colors');
      expect(pub1.toJSON()).eql({
        $pop: { colors: 1 },
      });

      const pub2 = p0.partialUpdate().shift('colors');
      expect(pub2.toJSON()).eql({
        $pop: { colors: -1 },
      });

      const pub3 = p0.partialUpdate().unshift('colors', 'green');
      expect(pub3.toJSON()).eql({
        $push: { colors: { $each: ['green'], $position: 0 } },
      });
    });

    it('should support date operations', function() {
      const pub0 = p0.partialUpdate()
        .toNow('date') // alias: .toCurrentDate('date')
      ;

      expect(pub0.toJSON()).eql({
        $currentDate: { date: 'timestamp' },
      });
    });

    it('should support meta operations', function() {
      const pub0 = p0.partialUpdate().rename('bitmask', 'bits');
      expect(pub0.toJSON()).eql({
        $rename: { bitmask: bits }
      });
    });

    it('should support bitwise operations', function() {
      const pub0 = p0.partialUpdate().and('bitmask', 0b01010000);
      expect(pub0.toJSON()).eql({
        $bit: { bitmask: { and: 0b01010000 } }
      });

      const pub1 = p0.partialUpdate().or('bitmask', 0b00001111);
      expect(pub1.toJSON()).eql({
        $bit: { bitmask: { or: 0b00001111 } }
      });

      const pub2 = p0.partialUpdate().xor('bitmask', 0b00001010);
      expect(pub2.toJSON()).eql({
        $bit: { bitmask: { xor: 0b00001010 } }
      });
    });
  });

});
