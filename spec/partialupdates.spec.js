if (typeof module != 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test Partial Updates', function() {
  var emf, metamodel;

  before(function () {
    var personType, addressType;

    emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, schema: {}, tokenStorage: helper.rootTokenStorage });
    metamodel = emf.metamodel;

    metamodel.addType(personType = new DB.metamodel.EntityType('PartialUpdatePerson', metamodel.entity(Object)));
    metamodel.addType(addressType = new DB.metamodel.EmbeddableType('PartialUpdateAddress'));

    personType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('person', personType));
    personType.addAttribute(new DB.metamodel.SingularAttribute('address', addressType));
    personType.addAttribute(new DB.metamodel.SingularAttribute('age', metamodel.baseType('Integer')));
    personType.addAttribute(new DB.metamodel.SingularAttribute('numFriends', metamodel.baseType('Integer')));
    personType.addAttribute(new DB.metamodel.SingularAttribute('tasksToDo', metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('foo', metamodel.baseType('Double')));
    personType.addAttribute(new DB.metamodel.SingularAttribute('bar', metamodel.baseType('Double')));
    personType.addAttribute(new DB.metamodel.SingularAttribute('baz', metamodel.baseType('Double')));
    personType.addAttribute(new DB.metamodel.SingularAttribute('bitmask', metamodel.baseType('Integer')));
    personType.addAttribute(new DB.metamodel.SingularAttribute('date', metamodel.baseType(Date)));
    personType.addAttribute(new DB.metamodel.ListAttribute('listAttr', metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SetAttribute('set', metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.MapAttribute('myMap', metamodel.baseType(String), metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute('birthplace', metamodel.baseType(DB.GeoPoint)));

    addressType.addAttribute(new DB.metamodel.SingularAttribute('zip', metamodel.baseType(Number)));
    addressType.addAttribute(new DB.metamodel.SingularAttribute('city', metamodel.baseType(String)));

    return metamodel.save();
  });

  describe('Entity Builder', () => {
    var db, p0;

    before(() => {
      db =  emf.createEntityManager();

      p0 = new db.PartialUpdatePerson({
        key: 'partial_update_p0',
        name: 'Konstantin',
        age: 24,
        numFriends: 5,
        listAttr: ['blue'],
        set: new Set(['blue']),
        myMap: new Map([ ['test', 'demo'] ]),
        tasksToDo: 5,
        foo: 23,
        bar: 1337,
        baz: 42,
        bitmask: 0b01010101,
        address: {
          city: 'Cologne',
          zip: 50667
        }
      });
    });

    it('should create an entity partial update builder', function() {
      const pub = p0.partialUpdate();

      expect(pub).to.be.an.instanceof(DB.partialupdate.EntityPartialUpdateBuilder);
      expect(pub._entity).to.equal(p0);
    });

    it('should support numeric operations', function() {
      var pub;
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
        .decrement('age', 12)).to.throw('Path age already has a $inc operation set');
      expect(() => p0.partialUpdate()
        .multiply('age', 12)
        .divide('age', 12)).to.throw('Path age already has a $mul operation set');
    });

    it('should support min and max operations', function() {
      var pub;
      pub = p0.partialUpdate()
        .min('bar', 1337)
        .max('baz', 23)
      ;
      expect(pub.toJSON()).eql({ $min: { bar: 1337 }, $max: { baz: 23 } });

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
    });

    it('should support set operations', function() {
      var pub;
      const date = new Date();
      pub = p0.partialUpdate()
        .set('age', 25)
        .set('name', 'KSM')
        .set('address.city', 'Hamburg')
        .set('address.zip', 20259)
        .set('date', date)
      ;
      expect(pub.toJSON()).eql({
        $set: { age: 25, name: 'KSM', 'address.city': 'Hamburg', 'address.zip': 20259, date: date },
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
      var pub;
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
        $replace: { listAttr: { at: 0, to: 'green' } },
      });
    });

    it('should support array operations on sets', function() {
      var pub;
      pub = p0.partialUpdate().add('set', 'red');
      expect(pub.toJSON()).eql({ $add: { set: 'red' } });

      pub = p0.partialUpdate().remove('set', 'blue');
      expect(pub.toJSON()).eql({ $remove: { set: 'blue' } });

      pub = p0.partialUpdate().set('set', new Set(['yellow']));
      expect(pub.toJSON()).eql({ $set: { set: ['yellow'] } });
    });

    it('should support operations on maps', function() {
      var pub;
      pub = p0.partialUpdate().put('myMap', 'color', 'red');
      expect(pub.toJSON()).eql({ $put: { myMap: {'color': 'red'} } });
      pub = p0.partialUpdate().put('myMap', {'color': 'red', 'city': 'Hamburg'});
      expect(pub.toJSON()).eql({ $put: { myMap: {'color': 'red', 'city': 'Hamburg'} } });

      pub = p0.partialUpdate().remove('myMap', 'test');
      expect(pub.toJSON()).eql({ $remove: { myMap: 'test' } });

      pub = p0.partialUpdate().set('myMap', new Map([ ['alpha', 'alef'] ]));
      expect(pub.toJSON()).eql({ $set: { myMap: {'alpha': 'alef'} } });
    });

    it('should support date operations', function() {
      var pub;
      pub = p0.partialUpdate()
        .toNow('date') // alias: .toCurrentDate('date')
      ;

      expect(pub.toJSON()).eql({
        $currentDate: { date: null },
      });
    });

    it('should support meta operations', function() {
      var pub;
      pub = p0.partialUpdate().rename('bitmask', 'bits');
      expect(pub.toJSON()).eql({
        $rename: { bitmask: 'bits' }
      });
    });

    it('should support bitwise operations', function() {
      var pub;
      pub = p0.partialUpdate().and('bitmask', 0b01010000);
      expect(pub.toJSON()).eql({
        $and: { bitmask: 0b01010000 }
      });

      pub = p0.partialUpdate().or('bitmask', 0b00001111);
      expect(pub.toJSON()).eql({
        $or: { bitmask: 0b00001111 }
      });

      pub = p0.partialUpdate().xor('bitmask', 0b00001010);
      expect(pub.toJSON()).eql({
        $xor: { bitmask: 0b00001010 }
      });

      // An operation overwrite causes an error
      expect(() => p0.partialUpdate()
        .and('bitmask', 0b00001111)
        .or('bitmask', 0b00001111)).to.throw('Path bitmask already has a bitwise operation set');
    });
  });

  describe('Entity Execution', () => {
    var db, p0;

    beforeEach(() => {
      db = emf.createEntityManager();

      p0 = new db.PartialUpdatePerson({
        key: 'partial_update_p0',
        name: 'Konstantin',
        age: 24,
        foo: 13.37,
        bar: 42,
        baz: 1337,
        bitmask: 0b00001111,
        listAttr: ['blue', 'green'],
        set: new Set(['Einstein', 'Planck', 'Bor']),
        date: new Date(1992, 05, 14, 0, 42, 0),
        myMap: new Map([ ['Hamburg', 'Moin'], ['Hannover', 'Hallo'], ['München', 'Grüß Gott'] ]),
        address: new db.PartialUpdateAddress({
          city: 'Cologne',
          zip: 50667,
        }),
      });

      return Promise.all([p0.save({ force: true })]);
    });

    it('should fail with status code 400 if key is wrong', function() {
      return p0.partialUpdate({ $wrongOperation: { age: 42 } }).execute()
        .catch((response) => {
          expect(response.status).to.equal(400);
          expect(response.message).to.equal('Invalid operation key: $wrongOperation');
        });
    });

    it('should perform a $set partial update on numbers', function() {
      expect(p0.age).to.equal(24);
      return p0.partialUpdate()
        .set('age', 42)
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.age).to.equal(42);
        });
    });

    it('should perform a $set partial update on strings', function() {
      expect(p0.name).to.equal('Konstantin');
      return p0.partialUpdate()
        .set('name', 'KSM')
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.name).to.equal('KSM');
        });
    });

    it('should perform a partial updates on embedded objects', function() {
      expect(p0.address.city).to.equal('Cologne');
      expect(p0.address.zip).to.equal(50667);
      return p0.partialUpdate()
        .set('address.city', 'Hamburg')
        .set('address.zip', 20259)
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.address).to.equal(result.address);
          expect(p0.address.city).to.equal('Hamburg');
          expect(p0.address.zip).to.equal(20259);
        });
    });

    it('should perform an increment partial update', function() {
      expect(p0.age).to.equal(24);
      return p0.partialUpdate()
        .increment('age')
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.age).to.equal(25);
        });
    });

    it('should perform an decrement partial update', function() {
      expect(p0.age).to.equal(24);
      return p0.partialUpdate()
        .decrement('age')
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.age).to.equal(23);
        });
    });

    it('should perform a multiply partial update', function() {
      expect(p0.foo).to.equal(13.37);
      return p0.partialUpdate()
        .multiply('foo', 2)
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.foo).to.equal(26.74);
        });
    });

    it('should perform a divide partial update', function() {
      expect(p0.foo).to.equal(13.37);
      return p0.partialUpdate()
        .divide('foo', 2)
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.foo).to.equal(6.685);
        });
    });

    it('should perform a $min partial update', function() {
      expect(p0.foo).to.equal(13.37);
      expect(p0.bar).to.equal(42);
      expect(p0.baz).to.equal(1337);
      return p0.partialUpdate()
        .min('foo', 42)
        .min('bar', 42)
        .min('baz', 42)
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.foo).to.equal(13.37);
          expect(p0.bar).to.equal(42);
          expect(p0.baz).to.equal(42);
        });
    });

    it('should perform a $max partial update', function() {
      expect(p0.foo).to.equal(13.37);
      expect(p0.bar).to.equal(42);
      expect(p0.baz).to.equal(1337);
      return p0.partialUpdate()
        .max('foo', 42)
        .max('bar', 42)
        .max('baz', 42)
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.foo).to.equal(42);
          expect(p0.bar).to.equal(42);
          expect(p0.baz).to.equal(1337);
        });
    });

    it('should perform a $set partial update on a list', function() {
      expect(p0.listAttr).to.eql(['blue', 'green']);
      return p0.partialUpdate()
        .set('listAttr', ['red'])
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.listAttr).to.eql(['red']);
        });
    });

    it('should perform a $push partial update on a list', function() {
      expect(p0.listAttr).to.eql(['blue', 'green']);
      return p0.partialUpdate()
        .push('listAttr', 'red')
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.listAttr).to.eql(['blue', 'green', 'red']);

          return p0.partialUpdate()
            .push('listAttr', 'red')
            .execute()
            .then((result) => {
              expect(p0).to.equal(result);
              expect(p0.listAttr).to.eql(['blue', 'green', 'red', 'red']);
            });
        });
    });

    it('should perform an $unshift partial update on a list', function() {
      expect(p0.listAttr).to.eql(['blue', 'green']);
      return p0.partialUpdate()
        .unshift('listAttr', 'red')
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.listAttr).to.eql(['red', 'blue', 'green']);

          return p0.partialUpdate()
            .unshift('listAttr', 'red')
            .execute()
            .then((result) => {
              expect(p0).to.equal(result);
              expect(p0.listAttr).to.eql(['red', 'red', 'blue', 'green']);
            });
        });
    });

    it('should perform a $remove partial update on a list', function() {
      expect(p0.listAttr).to.include('blue', 'green');
      return p0.partialUpdate()
        .remove('listAttr', 'green')
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.listAttr).to.include('blue');
          expect(p0.listAttr).to.not.include('green');
        });
    });

    it('should perform a $shift partial update on a list', function() {
      expect(p0.listAttr).to.eql(['blue', 'green']);
      return p0.partialUpdate()
        .shift('listAttr')
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.listAttr).to.eql(['green']);
        });
    });

    it('should perform a $pop partial update on a list', function() {
      expect(p0.listAttr).to.eql(['blue', 'green']);
      return p0.partialUpdate()
        .pop('listAttr')
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.listAttr).to.eql(['blue']);
        });
    });

    it('should perform a $set partial update on a set', function() {
      expect(p0.set.has('Einstein')).to.be.true;
      expect(p0.set.has('Planck')).to.be.true;
      expect(p0.set.has('Bor')).to.be.true;
      expect(p0.set.has('Curie')).to.be.false;
      expect(p0.set.has('Huygens')).to.be.false;
      expect(p0.set.has('Heisenberg')).to.be.false;
      return p0.partialUpdate()
        .set('set', new Set(['Curie', 'Huygens', 'Heisenberg']))
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.set.has('Einstein')).to.be.false;
          expect(p0.set.has('Planck')).to.be.false;
          expect(p0.set.has('Bor')).to.be.false;
          expect(p0.set.has('Curie')).to.be.true;
          expect(p0.set.has('Huygens')).to.be.true;
          expect(p0.set.has('Heisenberg')).to.be.true;
        });
    });

    it('should perform an $add partial update on a set', function() {
      expect(p0.set.has('Einstein')).to.be.true;
      expect(p0.set.has('Planck')).to.be.true;
      expect(p0.set.has('Bor')).to.be.true;
      expect(p0.set.has('Curie')).to.be.false;
      return p0.partialUpdate()
        .add('set', 'Curie')
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.set.has('Einstein')).to.be.true;
          expect(p0.set.has('Planck')).to.be.true;
          expect(p0.set.has('Bor')).to.be.true;
          expect(p0.set.has('Curie')).to.be.true;

          return p0.partialUpdate()
            .add('set', 'Einstein')
            .execute()
            .then((result) => {
              expect(p0).to.equal(result);
              expect(p0.set.has('Einstein')).to.be.true;
              expect(p0.set.has('Planck')).to.be.true;
              expect(p0.set.has('Bor')).to.be.true;
              expect(p0.set.has('Curie')).to.be.true;
            });
        });
    });

    it('should perform a $remove partial update on a set', function() {
      expect(p0.set.has('Einstein')).to.be.true;
      expect(p0.set.has('Planck')).to.be.true;
      expect(p0.set.has('Bor')).to.be.true;
      return p0.partialUpdate()
        .remove('set', 'Planck')
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.set.has('Einstein')).to.be.true;
          expect(p0.set.has('Planck')).to.be.false;
          expect(p0.set.has('Bor')).to.be.true;
        });
    });

    it('should perform a $set partial update on a map', function() {
      expect(p0.myMap.get('Hamburg')).to.eql('Moin');
      expect(p0.myMap.get('Hannover')).to.eql('Hallo');
      expect(p0.myMap.get('München')).to.eql('Grüß Gott');
      expect(p0.myMap.has('Paris')).to.be.false;
      expect(p0.myMap.has('London')).to.be.false;
      return p0.partialUpdate()
        .set('myMap', new Map([ ['London', 'Hello'], ['Paris', 'Salut'] ]))
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.myMap.get('London')).to.eql('Hello');
          expect(p0.myMap.get('Paris')).to.eql('Salut');
          expect(p0.myMap.has('Hamburg')).to.be.false;
          expect(p0.myMap.has('Hannover')).to.be.false;
          expect(p0.myMap.has('München')).to.be.false;
        });
    });

    it('should perform a $put partial update on a map', function() {
      expect(p0.myMap.get('Hamburg')).to.eql('Moin');
      expect(p0.myMap.get('Hannover')).to.eql('Hallo');
      expect(p0.myMap.get('München')).to.eql('Grüß Gott');
      expect(p0.myMap.has('Wien')).to.be.false;
      return p0.partialUpdate()
        .put('myMap', 'Wien', 'Servus')
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.myMap.get('Hamburg')).to.eql('Moin');
          expect(p0.myMap.get('Hannover')).to.eql('Hallo');
          expect(p0.myMap.get('München')).to.eql('Grüß Gott');
          expect(p0.myMap.get('Wien')).to.eql('Servus');
        });
    });

    it('should perform a $remove partial update on a map', function() {
      expect(p0.myMap.get('Hamburg')).to.eql('Moin');
      expect(p0.myMap.get('Hannover')).to.eql('Hallo');
      expect(p0.myMap.get('München')).to.eql('Grüß Gott');
      return p0.partialUpdate()
        .remove('myMap', 'München')
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.myMap.get('Hamburg')).to.eql('Moin');
          expect(p0.myMap.get('Hannover')).to.eql('Hallo');
          expect(p0.myMap.has('München')).to.be.false;
        });
    });

    it('should perform a $set partial update on a date', function() {
      var date = new Date();
      return p0.partialUpdate()
        .set('date', date)
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.date.getFullYear()).to.eql(date.getFullYear());
          expect(p0.date.getMonth()).to.eql(date.getMonth());
          expect(p0.date.getDay()).to.eql(date.getDay());
          expect(p0.date.getHours()).to.eql(date.getHours());
          expect(p0.date.getMinutes()).to.eql(date.getMinutes());
          expect(p0.date.getSeconds()).to.eql(date.getSeconds());
          expect(p0.date.getTime()).to.eql(date.getTime());
        });
    });

    it('should perform a $currentDate partial update on a date', function() {
      return p0.partialUpdate()
        .toNow('date')
        .execute()
        .then((result) => {
          var date = new Date();
          expect(p0).to.equal(result);
          expect(p0.date.getFullYear()).to.eql(date.getFullYear());
          expect(p0.date.getMonth()).to.eql(date.getMonth());
          expect(p0.date.getDay()).to.eql(date.getDay());
          expect(p0.date.getHours()).to.eql(date.getHours());
          expect(p0.date.getMinutes()).to.eql(date.getMinutes());
        });
    });

    it('should perform bitwise AND partial update', function() {
      expect(p0.bitmask).to.equal(0b00001111);
      return p0.partialUpdate()
        .and('bitmask', 0b01010101)
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.bitmask).to.equal(0b00000101);
        });
    });

    it('should perform bitwise OR partial update', function() {
      expect(p0.bitmask).to.equal(0b00001111);
      return p0.partialUpdate()
        .or('bitmask', 0b01010101)
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.bitmask).to.equal(0b01011111);
        });
    });

    it('should perform bitwise XOR partial update', function() {
      expect(p0.bitmask).to.equal(0b00001111);
      return p0.partialUpdate()
        .xor('bitmask', 0b01010101)
        .execute()
        .then((result) => {
          expect(p0).to.equal(result);
          expect(p0.bitmask).to.equal(0b01011010);
        });
    });

  })

});
