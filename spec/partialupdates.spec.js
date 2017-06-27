if (typeof module != 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test Partial Updates', function () {
  var emf, metamodel;

  before(function () {
    var personType, addressType;

    emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, tokenStorage: helper.rootTokenStorage });
    metamodel = emf.metamodel;

    return emf.ready().then(function () {

      if (!metamodel.entity("PartialUpdatePerson")) {
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
        personType.addAttribute(new DB.metamodel.SetAttribute('setAttr', metamodel.baseType(String)));
        personType.addAttribute(new DB.metamodel.MapAttribute('mapAttr', metamodel.baseType(String), metamodel.baseType(String)));
        personType.addAttribute(new DB.metamodel.SingularAttribute('birthplace', metamodel.baseType(DB.GeoPoint)));

        addressType.addAttribute(new DB.metamodel.SingularAttribute('zip', metamodel.baseType(Number)));
        addressType.addAttribute(new DB.metamodel.SingularAttribute('city', metamodel.baseType(String)));
      } else {
        personType = metamodel.entity('PartialUpdatePerson');
        addressType = metamodel.entity('PartialUpdateAddress');
      }

      return metamodel.save();
    })
  });

  describe('Entity Builder', function () {
    var db, p0;

    before(function () {
      db =  emf.createEntityManager();

      p0 = new db.PartialUpdatePerson({
        key: 'partial_update_p0',
        name: 'Konstantin',
        age: 24,
        numFriends: 5,
        listAttr: ['blue'],
        set: new Set(['blue']),
        mapAttr: new Map([ ['test', 'demo'] ]),
        tasksToDo: 5,
        foo: 23,
        bar: 1337,
        baz: 42,
        bitmask: 85,
        address: {
          city: 'Cologne',
          zip: 50667
        }
      });
    });

    it('should create an entity partial update builder', function() {
      var pub = p0.partialUpdate();

      expect(pub).to.be.an.instanceof(DB.partialupdate.EntityPartialUpdateBuilder);
      expect(pub._entity).to.equal(p0);
    });

    it('should create an entity factory partial update builder', function() {
      var pub = db.PartialUpdatePerson.partialUpdate(p0.key);

      expect(pub).to.be.an.instanceof(DB.partialupdate.EntityPartialUpdateBuilder);
      expect(pub._entity.id).to.equal(p0.id);
    });

    it('provides an initializer for partial updates', function() {
      var testPU = { $set: { name: 'KSM' } };
      var pub1 = db.PartialUpdatePerson.partialUpdate(p0.key, testPU).toJSON();
      var pub2 = p0.partialUpdate(testPU).toJSON();
      expect(pub1).eql(testPU);
      expect(pub2).eql(testPU);
    });

    it('should throw an error if you update a path twice', function() {
      expect(function () {
        p0.partialUpdate()
          .increment('age')
          .multiply('age', 2)
      }).to.throw('You cannot update age multiple times');

      expect(function () {
        p0.partialUpdate()
          .push('listAttr')
          .pop('listAttr')
      }).to.throw('You cannot update listAttr multiple times');

      expect(function () {
        p0.partialUpdate()
          .push('listAttr')
          .replace('listAttr', 0, 'Demo')
      }).to.throw('You cannot update listAttr multiple times');

      expect(function () {
        p0.partialUpdate()
          .replace('listAttr', 0, 'Demo1')
          .replace('listAttr', 1, 'Demo2')
      }).to.not.throw();
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

      expect(function () { 
        p0.partialUpdate().multiply('foo', 'string'); 
      }).to.throw();
      expect(function () { 
        p0.partialUpdate().divide('foo', 'string'); 
      }).to.throw();

      // An operation overwrite causes an error
      expect(function () {
        p0.partialUpdate()
          .increment('age', 12)
          .decrement('age', 12);
      }).to.throw('You cannot update age multiple times');
      expect(function () {
        p0.partialUpdate()
          .multiply('age', 12)
          .divide('age', 12);
      }).to.throw('You cannot update age multiple times');
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
      expect(function () { p0.partialUpdate().min('foo', 'string'); }).to.throw('Value must be a number');
      expect(function () { p0.partialUpdate().max('foo', 'string'); }).to.throw('Value must be a number');
      expect(function () { p0.partialUpdate().atLeast('foo', 'string'); }).to.throw('Value must be a number');
      expect(function () { p0.partialUpdate().atMost('foo', 'string'); }).to.throw('Value must be a number');
    });

    it('should support set operations', function() {
      var pub;
      var date = new Date();
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
        $replace: { 'listAttr.0': 'green' },
      });
    });

    it('should support array operations on sets', function() {
      var pub;
      pub = p0.partialUpdate().add('setAttr', 'red');
      expect(pub.toJSON()).eql({ $add: { setAttr: 'red' } });

      pub = p0.partialUpdate().remove('setAttr', 'blue');
      expect(pub.toJSON()).eql({ $remove: { setAttr: 'blue' } });

      pub = p0.partialUpdate().set('setAttr', new Set(['yellow']));
      expect(pub.toJSON()).eql({ $set: { setAttr: ['yellow'] } });
    });

    it('should support operations on maps', function() {
      var pub;
      pub = p0.partialUpdate().put('mapAttr', 'color', 'red');
      expect(pub.toJSON()).eql({ $put: { mapAttr: {'color': 'red'} } });
      pub = p0.partialUpdate().put('mapAttr', {'color': 'red', 'city': 'Hamburg'});
      expect(pub.toJSON()).eql({ $put: { mapAttr: {'color': 'red', 'city': 'Hamburg'} } });

      pub = p0.partialUpdate().remove('mapAttr', 'test');
      expect(pub.toJSON()).eql({ $remove: { mapAttr: 'test' } });

      pub = p0.partialUpdate().set('mapAttr', new Map([ ['alpha', 'alef'] ]));
      expect(pub.toJSON()).eql({ $set: { mapAttr: {'alpha': 'alef'} } });
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
      pub = p0.partialUpdate().and('bitmask', 80);
      expect(pub.toJSON()).eql({
        $and: { bitmask: 80 }
      });

      pub = p0.partialUpdate().or('bitmask', 15);
      expect(pub.toJSON()).eql({
        $or: { bitmask: 15 }
      });

      pub = p0.partialUpdate().xor('bitmask', 10);
      expect(pub.toJSON()).eql({
        $xor: { bitmask: 10 }
      });

      // An operation overwrite causes an error
      expect(function () {
        p0.partialUpdate()
          .and('bitmask', 15)
          .or('bitmask', 15)
      }).to.throw('You cannot update bitmask multiple times');
    });
  });

  describe('Entity Execution', function () {
    var key, db, db2, p0, p1;

    beforeEach(function () {
      key = 'partial_update_' + Math.round(Math.random() * Date.now());

      db = emf.createEntityManager();
      db2 = emf.createEntityManager();

      p0 = new db.PartialUpdatePerson({
        key: key,
        name: 'Konstantin',
        age: 24,
        foo: 13.37,
        bar: 42,
        baz: 1337,
        bitmask: 15,
        listAttr: ['blue', 'green'],
        setAttr: new Set(['Einstein', 'Planck', 'Bor']),
        date: new Date(1992, 5, 14, 0, 42, 0),
        mapAttr: new Map([ ['Hamburg', 'Moin'], ['Hannover', 'Hallo'], ['München', 'Grüß Gott'] ]),
        address: new db.PartialUpdateAddress({
          city: 'Cologne',
          zip: 50667,
        }),
      });

      return Promise.all([p0.save({ force: true, refresh: true }), db2.ready()]);
    });

    it('should fail with status code 400 if key is wrong', function() {
      return p0.partialUpdate({ $wrongOperation: { age: 42 } }).execute()
        .catch(function (response) {
          expect(response.status).to.equal(400);
          expect(response.message).to.equal('Unsupported update operation $wrongOperation on age');
        });
    });

    it('updates metadata on the object', function() {
      expect(p0.version).to.equal(1);
      expect(p0.createdAt).to.be.not.undefined;
      expect(p0.updatedAt).to.be.not.undefined;
      expect(p0.updatedAt).to.eql(p0.createdAt);
      return p0.partialUpdate()
        .execute()
        .then(function (result) {
          expect(p0.version).to.equal(2);
          expect(p0.updatedAt).to.not.eql(p0.createdAt);
        });
    });

    it('updates metadata on unloaded references', function() {
      var fiveMinutes = 5 * 60 * 1000;
      p1 = db2.PartialUpdatePerson.ref(key);
      expect(p1.version).null;
      return p1.partialUpdate()
        .set('age', 25)
        .execute()
        .then(function (result) {
          expect(p1.version).to.equal(2);
          expect(p1.updatedAt).to.not.eql(p1.createdAt);
        });
    });

    it('throws an error if you $set an embedded object', function() {
      return expect(
        p0.partialUpdate()
          .set('address', { zip: 22527, city: 'Stellingen' })
          .execute()
      ).rejectedWith('The body can\'t be processed');
    });

    it('should perform a $set partial update on numbers', function() {
      expect(p0.age).to.equal(24);
      return p0.partialUpdate()
        .set('age', 42)
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.age).to.equal(42);
        });
    });

    it('should perform a $set partial update on strings', function() {
      expect(p0.name).to.equal('Konstantin');
      return p0.partialUpdate()
        .set('name', 'KSM')
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
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
        .then(function (result) {
          expect(result).to.equal(p0);
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
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.age).to.equal(25);
        });
    });

    it('should perform an decrement partial update', function() {
      expect(p0.age).to.equal(24);
      return p0.partialUpdate()
        .decrement('age')
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.age).to.equal(23);
        });
    });

    it('should perform a multiply partial update', function() {
      expect(p0.foo).to.equal(13.37);
      return p0.partialUpdate()
        .multiply('foo', 2)
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.foo).to.equal(26.74);
        });
    });

    it('should perform a divide partial update', function() {
      expect(p0.foo).to.equal(13.37);
      return p0.partialUpdate()
        .divide('foo', 2)
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
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
        .then(function (result) {
          expect(result).to.equal(p0);
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
        .then(function (result) {
          expect(result).to.equal(p0);
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
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.listAttr).to.eql(['red']);
        });
    });

    it('should perform a $push partial update on a list', function() {
      expect(p0.listAttr).to.eql(['blue', 'green']);
      return p0.partialUpdate()
        .push('listAttr', 'red')
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.listAttr).to.eql(['blue', 'green', 'red']);

          return p0.partialUpdate()
            .push('listAttr', 'red')
            .execute();
        })
      .then(function (result) {
        expect(result).to.equal(p0);
        expect(p0.listAttr).to.eql(['blue', 'green', 'red', 'red']);
      });
    });

    it('should perform an $unshift partial update on a list', function() {
      expect(p0.listAttr).to.eql(['blue', 'green']);
      return p0.partialUpdate()
        .unshift('listAttr', 'red')
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.listAttr).to.eql(['red', 'blue', 'green']);

          return p0.partialUpdate()
            .unshift('listAttr', 'red')
            .execute()
            .then(function (result) {
              expect(result).to.equal(p0);
              expect(p0.listAttr).to.eql(['red', 'red', 'blue', 'green']);
            });
        });
    });

    it('should perform a $remove partial update on a list', function() {
      expect(p0.listAttr).to.include('blue', 'green');
      return p0.partialUpdate()
        .remove('listAttr', 'green')
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.listAttr).to.include('blue');
          expect(p0.listAttr).to.not.include('green');
        });
    });

    it('should perform a $shift partial update on a list', function() {
      expect(p0.listAttr).to.eql(['blue', 'green']);
      return p0.partialUpdate()
        .shift('listAttr')
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.listAttr).to.eql(['green']);
        });
    });

    it('should perform a $pop partial update on a list', function() {
      expect(p0.listAttr).to.eql(['blue', 'green']);
      return p0.partialUpdate()
        .pop('listAttr')
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.listAttr).to.eql(['blue']);
        });
    });

    it('should perform a $replace partial update on a list', function() {
      return Promise.resolve(p0)
      .then(function (result) {
        expect(result).to.equal(p0);
        expect(p0.listAttr).to.eql(['blue', 'green']);

        // Test simple replace
        return p0.partialUpdate()
          .replace('listAttr', 0, 'red')
          .execute();
      })
      .then(function (result) {
        expect(result).to.equal(p0);
        expect(p0.listAttr).to.eql(['red', 'green']);

        // Test replace at other index
        return p0.partialUpdate()
          .replace('listAttr', 1, 'red')
          .execute()
      })
      .then(function (result) {
        expect(result).to.equal(p0);
        expect(p0.listAttr).to.eql(['red', 'red']);

        // Test two replaces on same list at once
        return p0.partialUpdate()
          .replace('listAttr', 0, 'yellow')
          .replace('listAttr', 1, 'cyan')
          .execute();
      })
      .then(function (result) {
        expect(result).to.equal(p0);
        expect(p0.listAttr).to.eql(['yellow', 'cyan']);

        // Test replace on undefined index
        return p0.partialUpdate()
          .replace('listAttr', 2, 'green')
          .execute();
      })
      .then(function (result) {
        expect(result).to.equal(p0);
        expect(p0.listAttr).to.eql(['yellow', 'cyan', 'green']);

        // Test replace on far away index
        return p0.partialUpdate()
          .replace('listAttr', 99, 'ninetynine')
          .execute();
      })
      .then(function (result) {
        expect(result).to.equal(p0);
        expect(p0.listAttr.length).to.eql(100);
        expect(p0.listAttr[0]).to.eql('yellow');
        expect(p0.listAttr[1]).to.eql('cyan');
        expect(p0.listAttr[2]).to.eql('green');
        expect(p0.listAttr[3]).to.be.null;
        expect(p0.listAttr[99]).to.eql('ninetynine');
      });
    });

    it('should perform a $set partial update on a set', function() {
      expect(p0.setAttr.has('Einstein')).to.be.true;
      expect(p0.setAttr.has('Planck')).to.be.true;
      expect(p0.setAttr.has('Bor')).to.be.true;
      expect(p0.setAttr.has('Curie')).to.be.false;
      expect(p0.setAttr.has('Huygens')).to.be.false;
      expect(p0.setAttr.has('Heisenberg')).to.be.false;
      return p0.partialUpdate()
        .set('setAttr', new Set(['Curie', 'Huygens', 'Heisenberg']))
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.setAttr.has('Einstein')).to.be.false;
          expect(p0.setAttr.has('Planck')).to.be.false;
          expect(p0.setAttr.has('Bor')).to.be.false;
          expect(p0.setAttr.has('Curie')).to.be.true;
          expect(p0.setAttr.has('Huygens')).to.be.true;
          expect(p0.setAttr.has('Heisenberg')).to.be.true;
        });
    });

    it('should perform an $add partial update on a set', function() {
      expect(p0.setAttr.has('Einstein')).to.be.true;
      expect(p0.setAttr.has('Planck')).to.be.true;
      expect(p0.setAttr.has('Bor')).to.be.true;
      expect(p0.setAttr.has('Curie')).to.be.false;
      return p0.partialUpdate()
        .add('setAttr', 'Curie')
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.setAttr.has('Einstein')).to.be.true;
          expect(p0.setAttr.has('Planck')).to.be.true;
          expect(p0.setAttr.has('Bor')).to.be.true;
          expect(p0.setAttr.has('Curie')).to.be.true;

          return p0.partialUpdate()
            .add('setAttr', 'Einstein')
            .execute()
            .then(function (result) {
              expect(result).to.equal(p0);
              expect(p0.setAttr.has('Einstein')).to.be.true;
              expect(p0.setAttr.has('Planck')).to.be.true;
              expect(p0.setAttr.has('Bor')).to.be.true;
              expect(p0.setAttr.has('Curie')).to.be.true;
            });
        });
    });

    it('should perform a $remove partial update on a set', function() {
      expect(p0.setAttr.has('Einstein')).to.be.true;
      expect(p0.setAttr.has('Planck')).to.be.true;
      expect(p0.setAttr.has('Bor')).to.be.true;
      return p0.partialUpdate()
        .remove('setAttr', 'Planck')
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.setAttr.has('Einstein')).to.be.true;
          expect(p0.setAttr.has('Planck')).to.be.false;
          expect(p0.setAttr.has('Bor')).to.be.true;
        });
    });

    it('should perform a $set partial update on a map', function() {
      expect(p0.mapAttr.get('Hamburg')).to.eql('Moin');
      expect(p0.mapAttr.get('Hannover')).to.eql('Hallo');
      expect(p0.mapAttr.get('München')).to.eql('Grüß Gott');
      expect(p0.mapAttr.has('Paris')).to.be.false;
      expect(p0.mapAttr.has('London')).to.be.false;
      return p0.partialUpdate()
        .set('mapAttr', new Map([ ['London', 'Hello'], ['Paris', 'Salut'] ]))
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.mapAttr.get('London')).to.eql('Hello');
          expect(p0.mapAttr.get('Paris')).to.eql('Salut');
          expect(p0.mapAttr.has('Hamburg')).to.be.false;
          expect(p0.mapAttr.has('Hannover')).to.be.false;
          expect(p0.mapAttr.has('München')).to.be.false;
        });
    });

    it('should perform a $put partial update on a map', function() {
      expect(p0.mapAttr.get('Hamburg')).to.eql('Moin');
      expect(p0.mapAttr.get('Hannover')).to.eql('Hallo');
      expect(p0.mapAttr.get('München')).to.eql('Grüß Gott');
      expect(p0.mapAttr.has('Wien')).to.be.false;
      return p0.partialUpdate()
        .put('mapAttr', 'Wien', 'Servus')
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.mapAttr.get('Hamburg')).to.eql('Moin');
          expect(p0.mapAttr.get('Hannover')).to.eql('Hallo');
          expect(p0.mapAttr.get('München')).to.eql('Grüß Gott');
          expect(p0.mapAttr.get('Wien')).to.eql('Servus');
        });
    });

    it('should perform a $remove partial update on a map', function() {
      expect(p0.mapAttr.get('Hamburg')).to.eql('Moin');
      expect(p0.mapAttr.get('Hannover')).to.eql('Hallo');
      expect(p0.mapAttr.get('München')).to.eql('Grüß Gott');
      return p0.partialUpdate()
        .remove('mapAttr', 'München')
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.mapAttr.get('Hamburg')).to.eql('Moin');
          expect(p0.mapAttr.get('Hannover')).to.eql('Hallo');
          expect(p0.mapAttr.has('München')).to.be.false;
        });
    });

    it('should perform a $set partial update on a date', function() {
      var date = new Date();
      return p0.partialUpdate()
        .set('date', date)
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
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
      var ancient = new Date(1992, 4, 14);

      p0.date = ancient;
      return p0.save()
      .then(function () {
          expect(p0.date).eqls(ancient);

          return p0.partialUpdate()
            .toNow('date')
            .execute();
      })
      .then(function (result) {
        // Ensure timestamp is at least as high as before the operation
        expect(result).to.equal(p0);

        var fiveMinutes = 5 * 60 * 1000;
        expect(p0.date).gt(new Date(Date.now() - fiveMinutes));
        expect(p0.date).lt(new Date(Date.now() + fiveMinutes));
      });
    });

    it('should perform bitwise AND partial update', function() {
      expect(p0.bitmask).to.equal(15);
      return p0.partialUpdate()
        .and('bitmask', 85)
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.bitmask).to.equal(5);
        });
    });

    it('should perform bitwise OR partial update', function() {
      expect(p0.bitmask).to.equal(15);
      return p0.partialUpdate()
        .or('bitmask', 85)
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.bitmask).to.equal(95);
        });
    });

    it('should perform bitwise XOR partial update', function() {
      expect(p0.bitmask).to.equal(15);
      return p0.partialUpdate()
        .xor('bitmask', 85)
        .execute()
        .then(function (result) {
          expect(result).to.equal(p0);
          expect(p0.bitmask).to.equal(90);
        });
    });

    it('throws an error if you perform an $add on a number', function() {
      return expect(
        p0.partialUpdate()
          .add('bitmask', 85)
          .execute()
      ).rejectedWith('Unsupported update operation $add on bitmask');
    });

    it('throws an error if you $add to a list', function () {
      return expect(
        p0.partialUpdate()
          .add('listAttr', '')
          .execute()
      ).rejectedWith('Unsupported update operation $add on listAttr');
    });

    it('throws an error if you $push to a set', function () {
      return expect(
        p0.partialUpdate()
          .push('setAttr', '')
          .execute()
      ).rejectedWith('Unsupported update operation $push on setAttr');
    });

    it('should allow partial updates on unloaded objects', function() {
      var p = db2.getReference('/db/PartialUpdatePerson/' + key);
      return p.partialUpdate()
        .set('name', 'Unloaded KSM')
        .execute()
      .then(function (loaded) {
        expect(loaded.name).to.equal('Unloaded KSM');
      });
    });

    it('should allow partial updates on entity factories', function() {
      return db.PartialUpdatePerson.partialUpdate(key)
        .set('name', 'Unloaded KSM')
        .execute()
      .then(function (loadedFromClass) {
        expect(loadedFromClass === p0).true;
        expect(loadedFromClass.name).to.equal('Unloaded KSM');
      });
    });
  })
});
