var DB;
if (typeof module != 'undefined') {
  require('./node');
  DB = require('../lib');
}

describe('Test Offline', function() {
    var emf, metamodel;

    before(function() {
        var personType, addressType;

        emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, schema: {}, tokenStorage: helper.rootTokenStorage, conflictResolution: function (localObj, serverObj) { return localObj; }});
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
                colors: ['red', 'green'],
                birthplace: new DB.GeoPoint(35, 110)
            });

            p2 = new db.QueryPerson({
                key: 'query_p2',
                person: p1,
                name: 'QueryPerson 2',
                age: 33,
                date: new Date('1966-05-01T00:00Z'),
                address: new db.QueryAddress({city: 'Hamburg', zip: 23432}),
                colors: ['blue', 'green', 'red'],
                birthplace: new DB.GeoPoint(32, 112)
            });

            p3 = new db.QueryPerson({
                key: 'query_p3',
                person: p1,
                name: 'QueryPerson 3',
                age: 23,
                date: new Date('1989-05-01T00:00Z'),
                address: new db.QueryAddress({city: 'Munich', zip: 92438}),
                colors: ['yellow', 'blue', 'white'],
                birthplace: new DB.GeoPoint(29, 109)
            });

            return Promise.all([p0.save({force:true}), p1.save({force:true}), p2.save({force:true}), p3.save({force:true})])
        });

        it('should return loaded object', function() {
            return db.QueryPerson.load('query_p2').then(function(obj) {
                expect(obj).equals(p2);
            });
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
                .between('date', "1970-01-01T00:00Z", "1990-12-31T00:00Z")
                .resultList()
                .then(function(list) {
                    expectResult([p1, p3], list);
                });
        });

// Query Filter $geoWithin not supported by minimongo
/*        it("should return birthplace withinPolygon matches", function() {
            return db.QueryPerson.find()
                .withinPolygon('birthplace',
                    new DB.GeoPoint(30, 110), new DB.GeoPoint(30, 115),
                    new DB.GeoPoint(40, 115), new DB.GeoPoint(40, 110),
                    new DB.GeoPoint(30, 110))
                .resultList()
                .then(function(list) {
                    expectResult([p1, p2], list);
                });
        });*/

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
// Query Operator offset not supported by minimongo
/*        it("should return matches in right order with offset and limit", function() {
            return db.QueryPerson.find()
                .ascending('age')
                .offset(1)
                .limit(2)
                .resultList()
                .then(function(list) {
                    expectSortedResult([p3, p2], list);
                });
        });*/
// Query Operator offset not supported by minimongo
/*        it("should be allowed to use limit and offset before a filter", function() {
            return db.QueryPerson.find()
                .offset(1)
                .limit(2)
                .ascending('age')
                .resultList()
                .then(function(list) {
                    expectSortedResult([p3, p2], list);
                });
        });*/

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

        it('should update object', function() {
            return db.QueryPerson.load('query_p2').then(function(obj) {
                obj.age = 55;
                return obj.update().then(function(updated) {
                    expect(true);
                });
             });
         });

/*        it('should delete object', function() {
            return db.QueryPerson.load('query_p2').then(function(obj) {
                return obj.delete().then(function(removed) {
                    expect(true);
                });
            });
        });*/

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