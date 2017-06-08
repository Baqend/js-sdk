var DB;
if (typeof module != 'undefined') {
    require('./node');
    DB = require('../lib');
}

describe("Test Query", function () {
    var emf, metamodel;

    before(function () {
        var personType, addressType;

        emf = new DB.EntityManagerFactory({host: env.TEST_SERVER, schema: {}, tokenStorage: helper.rootTokenStorage});
        metamodel = emf.metamodel;

        metamodel.addType(personType = new DB.metamodel.EntityType("AggregationPerson", metamodel.entity(Object)));

        personType.addAttribute(new DB.metamodel.SingularAttribute("name", metamodel.baseType(String)));
        personType.addAttribute(new DB.metamodel.SingularAttribute("city", metamodel.baseType(String)));
        personType.addAttribute(new DB.metamodel.SingularAttribute("person", personType));
        personType.addAttribute(new DB.metamodel.SingularAttribute("age", metamodel.baseType(Number)));
        personType.addAttribute(new DB.metamodel.SingularAttribute("summary", metamodel.baseType(String)));

        return metamodel.save();
    });

    describe("Builder", function () {
        var db;

        before(function () {
            db = emf.createEntityManager();
        });

        it("should create simple aggregation", function () {
            var a = db.AggregationPerson.aggregate().addStage(
                {
                    $project: {name: {$toUpper: "$name"}, _id: 0}
                }
            ).addStage(
                {$sort: {name: 1}}
            );


            expect(a.toJSON()).eql([
                {
                    $project: {name: {$toUpper: "$name"}, _id: 0}
                },
                {
                    $sort: {name: 1}
                }
            ]);
        });

    });


    describe('execution', function () {
        var db, p1, p2, p3;

        before(function () {
            db = emf.createEntityManager();

            p1 = new db.AggregationPerson({
                key: 'agg_p1',
                name: 'AggregationPerson 1',
                age: 45,
                city: 'Hamburg',
                colors: ['red', 'green'],
                summary: 'Hello my Name is Person 3.',

            });

            p2 = new db.AggregationPerson({
                key: 'agg_p2',
                name: 'AggregationPerson 2',
                age: 33,
                city: 'Hamburg',
                summary: 'Hello, i am Persón Number 2.',
            });

            p3 = new db.AggregationPerson({
                key: 'agg_p3',
                name: 'AggregationPerson 3',
                age: 23,
                city: 'München',
                summary: 'Hello my Name is Person 3. Name Name',
            });

            let meta = emf.metamodel;
            let index = new DB.metamodel.DbIndex([
                {summary: DB.metamodel.DbIndex.TEXT},
                {adress: DB.metamodel.DbIndex.TEXT}
            ]);
            let personType = new DB.metamodel.EntityType("AggregationPerson", metamodel.entity(Object));

            return Promise.all([p1.save({force: true}), p2.save({force: true}), p3.save({force: true}),
                meta.createIndex(personType.name, index).then(function () {
                    return helper.sleep(3000);
                })
            ]);
        });


        it('aggregate name to upper case', function () {
            return db.AggregationPerson.aggregate().addStage(
                {
                    $project: {name: {$toUpper: "$name"}, _id: 0}
                }
            ).addStage(
                {
                    $sort: {name: 1}
                }
            ).result().then(function (result) {
                expectResult([
                    {name: 'AGGREGATIONPERSON 1'},
                    {name: 'AGGREGATIONPERSON 2'},
                    {name: 'AGGREGATIONPERSON 3'}
                ], result);
            });
        });

        it("aggregate group count by city", function () {
                return db.AggregationPerson.aggregate().addStage
                (
                    {
                        $group: {
                            _id: '$city',
                            totalAge: {$sum: '$age'},
                            count: {$sum: 1}
                        }
                    }
                ).result().then(function (result) {
                    expectResult([
                        {_id: 'München', totalAge: 23, count: 1,},
                        {_id: 'Hamburg', totalAge: 78, count: 2}
                    ], result);
                });
            }
        );

        it("aggregate text search", function () {
                return db.AggregationPerson.aggregate().addStage
                (
                    {
                        $match: {
                            $text: {$search: "Name"}
                        }
                    }
                ).addStage(
                    {
                        $sort: {score: {$meta: "textScore"}}
                    }
                ).addStage(
                    {
                        $project: {name: 1, score: {$meta: "textScore"}, _id: 0}
                    }
                ).result().then(function (result) {
                    expectResult([
                        {name: 'AggregationPerson 3', score: 1.3125},
                        {name: 'AggregationPerson 1', score: 0.625}
                    ], result);
                });
            }
        );


        // TODO: Find better way to compare array of aggregation results
        function expectResult(expectedResult, actualResult) {
            let erS = [];
            expectedResult.forEach(function (ar) {
                erS.push(JSON.stringify(ar));
            });

            expect(actualResult.length).equals(expectedResult.length);

            actualResult.forEach(function (ar) {

                var index = erS.indexOf(JSON.stringify(ar));
                expect(index).not.equal(-1);
                expectedResult[index] = null;
            });
        }

    });
});