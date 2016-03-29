if (typeof DB == 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe("Test Query", function() {
  var emf, metamodel;

  before(function() {
    var personType, addressType;

    emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, schema: {}, tokenStorage: helper.rootTokenStorage });
    metamodel = emf.metamodel;

    metamodel.addType(personType = new DB.metamodel.EntityType("QueryPerson", metamodel.entity(Object)));
    metamodel.addType(addressType = new DB.metamodel.EmbeddableType("QueryAddress"));

    personType.addAttribute(new DB.metamodel.SingularAttribute("name", metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("person", personType));
    personType.addAttribute(new DB.metamodel.SingularAttribute("address", addressType));
    personType.addAttribute(new DB.metamodel.SingularAttribute("age", metamodel.baseType(Number)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("date", metamodel.baseType(Date)));
    personType.addAttribute(new DB.metamodel.ListAttribute("colors", metamodel.baseType(String)));
    personType.addAttribute(new DB.metamodel.SingularAttribute("birthplace", metamodel.baseType(DB.GeoPoint)));

    addressType.addAttribute(new DB.metamodel.SingularAttribute("zip", metamodel.baseType(Number)));
    addressType.addAttribute(new DB.metamodel.SingularAttribute("city", metamodel.baseType(String)));

    return metamodel.save();
  });

  describe("Builder", function() {
    var db;

    before(function() {
      db =  emf.createEntityManager();
    });

    it("should create simple query", function() {
      var q = db.QueryPerson.find().where({name: 'Test QueryPerson', age: 3});
      expect(q.resultClass).equals(metamodel.entity('QueryPerson').typeConstructor);
      expect(q.firstResult).equals(0);
      expect(q.maxResults).equals(-1);
      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: 3
      });
    });

    it("should create simple query with build pattern", function() {
      var q = db.QueryPerson.find()
          .equal('name', 'Test QueryPerson')
          .equal('age', 3);

      expect(q.resultClass).equals(metamodel.entity('QueryPerson').typeConstructor);
      expect(q.firstResult).equals(0);
      expect(q.maxResults).equals(-1);
      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: 3
      });
    });

    it("should create simple query with reference", function() {
      var q = db.QueryPerson.find()
          .equal('person', '/db/QueryPerson/30')
          .equal('age', 3);

      expect(q.resultClass).equals(metamodel.entity('QueryPerson').typeConstructor);
      expect(q.firstResult).equals(0);
      expect(q.maxResults).equals(-1);
      expect(q.toJSON()).eql({
        person: '/db/QueryPerson/30',
        age: 3
      });
    });
    it("should replace other conditions with equal condition", function() {
      var q = db.QueryPerson.find()
          .between('age', 2, 20)
          .equal('age', 3)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: 3
      });
    });

    it("should replace equal condition with other condition", function() {
      var q = db.QueryPerson.find()
          .equal('age', 3)
          .between('age', 2, 20)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$gt': 2, '$lt': 20}
      });
    });

    it("should merge where condition with other condition", function() {
      var q = db.QueryPerson.find()
          .where({name: 'Test QueryPerson'})
          .equal('age', 3)
          .where({'age': 5});

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: 5
      });
    });

    it("should create notEqual condition", function() {
      var q = db.QueryPerson.find()
          .notEqual('age', 3)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$ne': 3}
      });
    });

    it("should create greaterThan condition", function() {
      var q = db.QueryPerson.find()
          .greaterThan('age', 3)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$gt': 3}
      });
    });

    it("should create gt condition", function() {
      var q = db.QueryPerson.find()
          .gt('age', 3)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$gt': 3}
      });
    });

    it("should create greaterThanOrEqualTo condition", function() {
      var q = db.QueryPerson.find()
          .greaterThanOrEqualTo('age', 3)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$gte': 3}
      });
    });

    it("should create ge condition", function() {
      var q = db.QueryPerson.find()
          .ge('age', 3)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$gte': 3}
      });
    });

    it("should create lessThan condition", function() {
      var q = db.QueryPerson.find()
          .lessThan('age', 3)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$lt': 3}
      });
    });

    it("should create lt condition", function() {
      var q = db.QueryPerson.find()
          .lt('age', 3)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$lt': 3}
      });
    });

    it("should create lessThanOrEqualTo condition", function() {
      var q = db.QueryPerson.find()
          .lessThanOrEqualTo('age', 3)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$lte': 3}
      });
    });

    it("should create le condition", function() {
      var q = db.QueryPerson.find()
          .le('age', 3)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$lte': 3}
      });
    });

    it("should create between condition", function() {
      var q = db.QueryPerson.find()
          .between('age', 3, 20)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$gt': 3, '$lt': 20}
      });
    });

    it("should create isNull condition", function() {
      var q = db.QueryPerson.find()
          .isNull('age')
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: null
      });
    });

    it("should create isNotNull condition", function() {
      var q = db.QueryPerson.find()
          .isNotNull('age')
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$ne': null, '$exists': true}
      });
    });

    it("should create in varargs condition", function() {
      var q = db.QueryPerson.find()
          .in('age', 1, 2, 3)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$in': [1, 2, 3]}
      });
    });

    it("should create in condition", function() {
      var q = db.QueryPerson.find()
          .in('age', [1, 2, 3])
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$in': [1, 2, 3]}
      });
    });

    it("should create in condition", function() {
      var q = db.QueryPerson.find()
          .in('age', [1, 2, 3])
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        age: {'$in': [1, 2, 3]}
      });
    });

    it("should create contains condition", function() {
      var q = db.QueryPerson.find()
          .containsAny('colors', ['green', 'red', 'blue'])
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        colors: {'$in': ['green', 'red', 'blue']}
      });
    });

    it("should create containsAny varargs condition", function() {
      var q = db.QueryPerson.find()
          .containsAny('colors', 'green', 'red', 'blue')
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        colors: {'$in': ['green', 'red', 'blue']}
      });
    });

    it("should create containsAll varargs condition", function() {
      var q = db.QueryPerson.find()
          .containsAll('colors', ['green', 'red', 'blue'])
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        colors: {'$all': ['green', 'red', 'blue']}
      });
    });

    it("should create containsAll varargs condition", function() {
      var q = db.QueryPerson.find()
          .containsAll('colors', 'green', 'red', 'blue')
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        colors: {'$all': ['green', 'red', 'blue']}
      });
    });

    it("should create size condition", function() {
      var q = db.QueryPerson.find()
          .size('colors', 3)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: "Test QueryPerson",
        colors: {'$size': 3}
      });
    });

    it("should create matches condition", function() {
      var q = db.QueryPerson.find()
          .matches('name', /^Test/)
          .equal('age', 3);

      expect(q.toJSON()).eql({
        name: {$regex: "^Test"},
        age: 3
      });
    });

    it("should create matches with multiline condition", function() {
      var q = db.QueryPerson.find()
          .matches('name', /^Test/m)
          .equal('age', 3);

      expect(q.toJSON()).eql({
        name: {$regex: "^Test", $options: 'm'},
        age: 3
      });
    });

    it("should not create matches with case insensitive condition", function() {
      expect(function() {
        db.QueryPerson.find().matches('name', /^Test/i);
      }).throw(Error);
    });

    it("should not create matches with global search condition", function() {
      expect(function() {
        db.QueryPerson.find().matches('name', /^Test/g);
      }).throw(Error);
    });

    it("should not create matches with none anchored condition", function() {
      expect(function() {
        db.QueryPerson.find().matches('name', /Test/);
      }).throw(Error);
    });

    it("should create mod condition", function() {
      var q = db.QueryPerson.find()
          .mod('age', 10, 3)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        name: 'Test QueryPerson',
        age: {$mod: [10, 3]}
      });
    });

    it("should create near condition", function() {
      var q = db.QueryPerson.find()
          .near('birthplace', new DB.GeoPoint(85, 100), 3000)
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        birthplace: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [100, 85]
            },
            $maxDistance: 3000
          }
        },
        name: 'Test QueryPerson'
      });
    });

    it("should create withinPolygon condition", function() {
      var q = db.QueryPerson.find()
          .withinPolygon('birthplace', [new DB.GeoPoint(85, 100), new DB.GeoPoint(81, 89), new DB.GeoPoint(90, 105)])
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        birthplace: {
          $geoWithin: {
            $geometry: {
              type: "Polygon",
              coordinates: [[[100, 85], [89, 81], [105, 90]]]
            }
          }
        },
        name: 'Test QueryPerson'
      });
    });

    it("should create withinPolygon varargs condition", function() {
      var q = db.QueryPerson.find()
          .withinPolygon('birthplace', new DB.GeoPoint(85, 100), new DB.GeoPoint(81, 89), new DB.GeoPoint(90, 105))
          .equal('name', 'Test QueryPerson');

      expect(q.toJSON()).eql({
        birthplace: {
          $geoWithin: {
            $geometry: {
              type: "Polygon",
              coordinates: [[[100, 85], [89, 81], [105, 90]]]
            }
          }
        },
        name: 'Test QueryPerson'
      });
    });

    it("should create and conditions", function() {
      var qb = db.QueryPerson.find();
      var q = qb.and(
          qb.equal('name', 'Test QueryPerson'),
          qb.between('age', 3, 20));

      expect(JSON.parse(JSON.stringify(q))).eql({
        $and: [{
          name: "Test QueryPerson"
        }, {
          age: {$gt: 3, $lt: 20}
        }]
      });
    });

    it("should create or conditions", function() {
      var qb = db.QueryPerson.find();
      var q = qb.or(
          qb.equal('name', 'Test QueryPerson1'),
          qb.between('age', 3, 20));

      expect(JSON.parse(JSON.stringify(q))).eql({
        $or: [{
          name: "Test QueryPerson1"
        }, {
          age: {$gt: 3, $lt: 20}
        }]
      });
    });

    it("should create nor conditions", function() {
      var qb = db.QueryPerson.find();
      var q = qb.nor(
          qb.equal('name', 'Test QueryPerson1'),
          qb.between('age', 3, 20));

      expect(JSON.parse(JSON.stringify(q))).eql({
        $nor: [{
          name: "Test QueryPerson1"
        }, {
          age: {$gt: 3, $lt: 20}
        }]
      });
    });

    it("should create complex query conditions", function() {
      var qb = db.QueryPerson.find();
      var q = qb.and(
          qb.or(qb.between('age', 40, 65), qb.between('age', 3, 20)),
          qb.or(qb.equal('name', 'Test QueryPerson1'), qb.equal('name', 'Test QueryPerson2'))
      );

      expect(JSON.parse(JSON.stringify(q))).eql({
        $and: [{
          $or: [{
            age: {$gt: 40, $lt: 65}
          }, {
            age: {$gt: 3, $lt: 20}
          }]
        }, {
          $or: [{
            name: 'Test QueryPerson1'
          }, {
            name: 'Test QueryPerson2'
          }]
        }]
      });
    });

    it("should create chained query conditions", function() {
      var qb = db.QueryPerson.find();

      var q = qb.or(
          qb.equal('name', 'Test QueryPerson1'),
          qb.equal('name', 'Test QueryPerson2'),
          qb.equal('name', 'Test QueryPerson3'));

      expect(JSON.parse(JSON.stringify(q))).eql({
        $or: [{
          name: 'Test QueryPerson1'
        }, {
          name: 'Test QueryPerson2'
        }, {
          name: 'Test QueryPerson3'
        }]
      });
    });
  });

  describe('execution', function() {
    var db, p0, p1, p2, p3;

    before(function() {
      db = emf.createEntityManager();

      p0 = new db.QueryPerson({
        key: 'query_p0'
      });

      p1 = new db.QueryPerson({
        key: 'query_p1',
        person: p0,
        name: 'QueryPerson 1',
        age: 45,
        date: new Date('1978-02-03T00:00Z'),
        address: new db.QueryAddress({city: 'Hamburg', zip: 22865}),
        colors: new DB.List(['red', 'green']),
        birthplace: new DB.GeoPoint(35, 110)
      });

      p2 = new db.QueryPerson({
        key: 'query_p2',
        person: p1,
        name: 'QueryPerson 2',
        age: 33,
        date: new Date('1966-05-01T00:00Z'),
        address: new db.QueryAddress({city: 'Hamburg', zip: 23432}),
        colors: new DB.List(['blue', 'green', 'red']),
        birthplace: new DB.GeoPoint(32, 112)
      });

      p3 = new db.QueryPerson({
        key: 'query_p3',
        person: p1,
        name: 'QueryPerson 3',
        age: 23,
        date: new Date('1989-05-01T00:00Z'),
        address: new db.QueryAddress({city: 'Munich', zip: 92438}),
        colors: new DB.List(['yellow', 'blue', 'white']),
        birthplace: new DB.GeoPoint(29, 109)
      });

      return Promise.all([p0.save({force:true}), p1.save({force:true}), p2.save({force:true}), p3.save({force:true})])
    });

    it('should return all objects', function() {
      return db.QueryPerson.find().resultList().then(function(list) {
        expectResult([p0, p1, p2, p3], list);
      });
    });

    it("should handle empty results", function() {
      return db.QueryPerson.find()
          .equal('name', 'test')
          .resultList()
          .then(function(list) {
            expectResult([], list);
          });
    });

    it("should return age <= 40 and address.city = Hamburg matches", function() {
      return db.QueryPerson.find()
          .lessThanOrEqualTo('age', 40)
          .equal('address.city', 'Hamburg')
          .resultList()
          .then(function(list) {
            expectResult([p2], list);
          });
    });

    it("should return age <= 40 and address.city = Hamburg match as single result", function() {
      return db.QueryPerson.find()
          .lessThanOrEqualTo('age', 40)
          .equal('address.city', 'Hamburg')
          .singleResult()
          .then(function(obj) {
            expect(obj).equals(p2);
          });
    });

    it("should return name is notNull matches", function() {
      return db.QueryPerson.find()
          .isNotNull('name')
          .resultList()
          .then(function(list) {
            expectResult([p1, p2, p3], list);
          });
    });

    it("should return name is null matches", function() {
      return db.QueryPerson.find()
          .isNull('name')
          .resultList()
          .then(function(list) {
            expectResult([p0], list);
          });
    });

    it("should return address.zip > 23000 and name != QueryPerson 2 matches", function() {
      return db.QueryPerson.find()
          .notEqual('name', 'QueryPerson 2')
          .greaterThan('address.zip', 23000)
          .resultList()
          .then(function(list) {
            expectResult([p3], list);
          });
    });

    it("should return person references p1", function() {
      return db.QueryPerson.find()
          .equal('person', p1)
          .resultList()
          .then(function(list) {
            expectResult([p2, p3], list);
          });
    });

    it("should return person references null", function() {
      return db.QueryPerson.find()
          .isNull('person')
          .resultList()
          .then(function(list) {
            expectResult([p0], list);
          });
    });

    it("should return name matches ^QueryPerson [23] matches", function() {
      return db.QueryPerson.find()
          .matches('name', '^QueryPerson [23]')
          .resultList()
          .then(function(list) {
            expectResult([p2, p3], list);
          });
    });

    it("should return name matches /^QueryPerson [23]/ matches", function() {
      return db.QueryPerson.find()
          .matches('name', /^QueryPerson [23]/)
          .resultList()
          .then(function(list) {
            expectResult([p2, p3], list);
          });
    });

    it("should return name in [QueryPerson 1, QueryPerson 2]", function() {
      return db.QueryPerson.find()
          .in('name', 'QueryPerson 1', 'QueryPerson 2')
          .resultList()
          .then(function(list) {
            expectResult([p1, p2], list);
          });
    });

    it("should return name not in [QueryPerson 1, QueryPerson 2]", function() {
      return db.QueryPerson.find()
          .notIn('name', 'QueryPerson 1', 'QueryPerson 2')
          .resultList()
          .then(function(list) {
            expectResult([p0, p3], list);
          });
    });

    it("should return color contains any green, blue matches", function() {
      return db.QueryPerson.find()
          .containsAny('colors', 'green', 'blue')
          .resultList()
          .then(function(list) {
            expectResult([p1, p2, p3], list);
          });
    });

    it("should return color contains all green, blue matches", function() {
      return db.QueryPerson.find()
          .containsAll('colors', 'green', 'blue')
          .resultList()
          .then(function(list) {
            expectResult([p2], list);
          });
    });

    it("should return color size = 3 matches", function() {
      return db.QueryPerson.find()
          .size('colors', 3)
          .resultList()
          .then(function(list) {
            expectResult([p2, p3], list);
          });
    });

    it("should return age % 10 = 3 matches", function() {
      return db.QueryPerson.find()
          .mod('age', 10, 3)
          .resultList()
          .then(function(list) {
            expectResult([p2, p3], list);
          });
    });

    it("should return date between 1970-01-01Z and 1990-31-12Z matches", function() {
      return db.QueryPerson.find()
          .between('date', new Date("1970-01-01T00:00Z"), new Date("1990-12-31T00:00Z"))
          .resultList()
          .then(function(list) {
            expectResult([p1, p3], list);
          });
    });

    it("should return date between 1970-01-01Z and 1990-31-12Z matches", function() {
      return db.QueryPerson.find()
          .between('date', new Date("1970-01-01T00:00Z"), new Date("1990-12-31T00:00Z"))
          .resultList()
          .then(function(list) {
            expectResult([p1, p3], list);
          });
    });

    it("should return birthplace withinPolygon matches", function() {
      return db.QueryPerson.find()
          .withinPolygon('birthplace',
              new DB.GeoPoint(30, 110), new DB.GeoPoint(30, 115),
              new DB.GeoPoint(40, 115), new DB.GeoPoint(40, 110),
              new DB.GeoPoint(30, 110))
          .resultList()
          .then(function(list) {
            expectResult([p1, p2], list);
          });
    });

    it("should return and/or condition based matches", function() {
      var qb = db.QueryPerson.find();
      return qb.and(
          qb.or(qb.between('age', 20, 35), qb.between('age', 40, 55)),
          qb.or(qb.equal('name', 'QueryPerson 1'), qb.equal('name', 'QueryPerson 3'))
      ).resultList()
          .then(function(list) {
            expectResult([p1, p3], list);
          });
    });

    it("should return matches in right order", function() {
      return db.QueryPerson.find()
          .containsAny('colors', 'green', 'blue')
          .ascending('age')
          .resultList()
          .then(function(list) {
            expectSortedResult([p3, p2, p1], list);
          });
    });

    it("should return matches in right order, with two sort criteria", function() {
      return db.QueryPerson.find()
          .containsAny('colors', 'green', 'blue')
          .descending('address.city')
          .descending('age')
          .resultList()
          .then(function(list) {
            expectSortedResult([p3, p1, p2], list);
          });
    });

    it("should return matches in right order, with sort criteria", function() {
      return db.QueryPerson.find()
          .containsAny('colors', 'green', 'blue')
          .sort({'address.city': 1, 'age': 1})
          .resultList()
          .then(function(list) {
            expectSortedResult([p2, p1, p3], list);
          });
    });

    it("should return matches in right order with offset and limit", function() {
      return db.QueryPerson.find()
          .ascending('age')
          .offset(1)
          .limit(2)
          .resultList()
          .then(function(list) {
            expectSortedResult([p3, p2], list);
          });
    });

    it("should be allowed to use limit and offset before a filter", function() {
      return db.QueryPerson.find()
          .offset(1)
          .limit(2)
          .ascending('age')
          .resultList()
          .then(function(list) {
            expectSortedResult([p3, p2], list);
          });
    });

    it("should count the number of matching objects", function() {
      return db.QueryPerson.find()
          .containsAny('colors', 'green', 'blue')
          .count()
          .then(function(count) {
            expect(count).equal(3);
          });
    });

    it("should count the total number of objects", function() {
      return db.QueryPerson.find()
          .count()
          .then(function(count) {
            return db.QueryPerson.find().resultList(function(list) {
              expect(list.length).equal(count)
            })
          });
    });

    it("should allow large query", function() {
      var inQuery = [];
      for(var i = 0; i < 5000; ++i) {
        inQuery.push("QueryPerson " + i);
      }

      return db.QueryPerson.find()
          .in('name', inQuery)
          .resultList()
          .then(function(list) {
            expectResult([p1, p2, p3], list);
          });
    });


    function expectResult(expectedResult, actualResult) {
      expect(actualResult.length).equals(expectedResult.length);
      actualResult.forEach(function(el) {
        var index = expectedResult.indexOf(el);
        expect(index).not.equal(-1);
        expectedResult[index] = null;
      });
    }

    function expectSortedResult(expectedResult, actualResult) {
      expect(actualResult.length).equals(expectedResult.length);
      expectedResult.forEach(function(el, index) {
        expect(actualResult[index]).equals(el);
      });
    }
  });
});