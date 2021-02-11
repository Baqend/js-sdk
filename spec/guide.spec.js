'use strict';

if (typeof module !== 'undefined') {
  require('./node');
  require('rxjs/operators');
}

xdescribe('Guide Examples', function () {
  // skips test for ie9 and ie10
  if (typeof window !== 'undefined' && !window.WebSocket) {
    return;
  }

  var Stream = DB.query.Stream;
  var tautology = { $or: [{ value: { $exists: true } }, { value: { $exists: false } }] };
  var t = 400;
  var bucket = helper.randomize('Guide_StreamingQuery');
  var emf, metamodel, db, stream, subscription;

  var _Observable = DB.Observable;

  before(function () {

  });

  before(function () {
    var todoType, activityType;
    emf = new DB.EntityManagerFactory({ host: env.TEST_SERVER, schema: {}, tokenStorage: helper.rootTokenStorage });
    metamodel = emf.metamodel;

    metamodel.addType(todoType = new DB.metamodel.EntityType(bucket, metamodel.entity(Object)));
    metamodel.addType(activityType = new DB.metamodel.EmbeddableType('Activity'));

    // todo list
    todoType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));
    todoType.addAttribute(new DB.metamodel.ListAttribute('activities', activityType));

    // activities
    activityType.addAttribute(new DB.metamodel.SingularAttribute('name', metamodel.baseType(String)));

    return metamodel.save().then(function () {
      return emf.createEntityManager().ready();
    }).then(function (em) {
      db = em;
    });
  });

  afterEach(function () {
    // Unregister subscriptions and streams
    if (subscription) {
      subscription.unsubscribe();
      subscription = undefined;
    }
    if (stream) {
      stream = undefined;
    }
    // Remove excess objects
    return helper.sleep(t).then(function () {
      return db[bucket].find().resultList(function (result) {
        return Promise.all(result.map(function (person) {
          return person.delete();
        }));
      });
    }).then(function () {
      return helper.sleep(t);
    });
  });


  it('should compute aggregate: count', function () {
    this.timeout(6000);

    stream = db[bucket].find().where(tautology).eventStream();
    var aggregate; // aggregate value goes here!

    var todo1, todo2, todo3;
    return helper.sleep(t).then(function () {
      console.log('count: ' + aggregate);
      expect(aggregate).to.be.equal(undefined);
      todo1 = new db[bucket]({ name: 'My Todo: groceries' });
      return helper.sleep(t, todo1.save());
    }).then(function () {
      console.log('subscribing --> count: ' + aggregate);
      expect(aggregate).to.be.equal(undefined);
      subscription = stream.scan(maintainCardinality, 0) // update counter
        .subscribe(function (value) {
          aggregate = value;
          return value;
        }); // output aggregate value
      return helper.sleep(t);
    }).then(function () {
      console.log('subscribed --> count: ' + aggregate);
      expect(aggregate).to.be.equal(1);
      return helper.sleep(t);
    })
      .then(function () {
        console.log('new list --> count: ' + aggregate);
        todo2 = new db[bucket]({ name: 'My Todo: dinner' });
        return helper.sleep(t, todo2.save());
      })
      .then(function () {
        console.log('another new list --> count: ' + aggregate);
        expect(aggregate).to.be.equal(2);
        todo3 = new db[bucket]({ name: 'My Todo: write invitations' });
        return helper.sleep(t, todo3.save());
      })
      .then(function () {
        console.log('yet another new list --> count: ' + aggregate);
        expect(aggregate).to.be.equal(3);
        return helper.sleep(t, todo3.delete());
      })
      .then(helper.sleep(t))
      .then(function () {
        console.log('removed a list --> count: ' + aggregate);
        expect(aggregate).to.be.equal(2);
      });
  });

  it('should compute aggregate: average activity number', function () {
    this.timeout(6000);

    stream = db[bucket].find().where(tautology).eventStream();
    var aggregate; // aggregate value goes here!

    var todo1, todo2, todo3;
    return helper.sleep(t).then(function () {
      console.log('count: ' + aggregate);
      expect(aggregate).to.be.equal(undefined);
      todo1 = new db[bucket]({ name: 'My Todo: groceries', activities: [] });
      todo1.activities = [//
        new db.Activity({ name: 'cabbage' }), //
        new db.Activity({ name: 'beer' }), //
      ];
      return helper.sleep(t, todo1.save());
    }).then(function () {
      console.log('saved: ' + print(todo1) + '\n --> average: ' + aggregate);
      expect(aggregate).to.be.equal(undefined);
      subscription = stream.scan(maintainAverage, initialAccumulatorAverage)// update counter
        .map(function (accumulator) {
          return accumulator.average;
        })// extract average
        .subscribe(function (value) {
          aggregate = value;
          return value;
        }); // output aggregate value
      return helper.sleep(t);
    }).then(function () {
      console.log('subscribed --> average: ' + aggregate);
      expect(aggregate).to.be.equal(2);
      return helper.sleep(t);
    })
      .then(function () {
        todo2 = new db[bucket]({ name: 'My Todo: dinner', activities: [] });
        return helper.sleep(t, todo2.save());
      })
      .then(function () {
        console.log('saved: ' + print(todo2) + '\n --> average: ' + aggregate);
        expect(aggregate).to.be.equal(1);
        todo3 = new db[bucket]({ name: 'My Todo: write invitations', activities: [] });
        todo3.activities = [//
          new db.Activity({ name: 'Alice' }), //
          new db.Activity({ name: 'Bob' }), //
          new db.Activity({ name: 'Carl' }), //
          new db.Activity({ name: 'Dieter' }), //
        ];
        return helper.sleep(t, todo3.save());
      })
      .then(function () {
        console.log('saved: ' + print(todo3) + '\n --> average: ' + aggregate);
        expect(aggregate).to.be.equal(2);
        return helper.sleep(t, todo2.delete());
      })
      .then(function () {
        console.log('removed: ' + print(todo2) + '\n --> average: ' + aggregate);
        expect(aggregate).to.be.equal(3);
        todo3.activities.splice(2, 1);
        return helper.sleep(t, todo3.save());
      })
      .then(function () {
        console.log('updated: ' + print(todo3) + '\n --> average: ' + aggregate);
        expect(aggregate).to.be.equal(2.5);
        return helper.sleep(t, todo1.delete());
      })
      .then(function () {
        console.log('removed: ' + print(todo1) + '\n --> average: ' + aggregate);
        expect(aggregate).to.be.equal(3);
        return helper.sleep(t, todo3.delete());
      })
      .then(helper.sleep(t))
      .then(function () {
        console.log(' removed: ' + print(todo3) + '\n --> average: ' + aggregate);
        expect(aggregate).to.be.equal(0);
      });
  });

  it('should return ordered result', function () {
    this.timeout(10000);

    var result = [];
    var events = [];

    stream = db[bucket].find()
      .matches('name', /^My Todo/)
      .ascending('name')
      .descending('active')
      .limit(3)
      .eventStream();

    var todo0, todo1, todo2, todo3;
    return helper.sleep(t).then(function () {
      console.log('\t result size: ' + result.length);
      expect(result.length).to.be.equal(0);
      todo1 = new db[bucket]({ name: 'My Todo 1' });
      return helper.sleep(t, todo1.save());
    }).then(function () {
      console.log('\t result size: ' + result.length);
      console.log('\t\t\t User 2 saved ' + print(todo1));
      expect(result.length).to.be.equal(0);
      console.log('User 1 subscribed --> result size: ' + result.length);
      subscription = stream.subscribe(function (event) {
        events.push(event);
        maintainResult(result, event);
        console.log('User 1 received: ' + event.matchType + '/' + event.operation + ': ' + event.data.name + ' is now at index ' + event.index);
        console.log('\t\t result: [ ' + result.map(function (match) {
          return match.name;
        }).join(', ') + ']');
      });
      return helper.sleep(t);
    }).then(function () {
      console.log('\t result size: ' + result.length);
      todo2 = new db[bucket]({ name: 'My Todo 2' });
      console.log('\t\t\t User 2 saved ' + print(todo2));
      expect(result.length).to.be.equal(1);
      expect(result[0]).to.be.equal(todo1);
      return helper.sleep(t, todo2.save());
    })
      .then(function () {
        console.log('\t result size: ' + result.length);
        expect(result.length).to.be.equal(2);
        expect(events[0].index).to.be.equal(0);
        expect(result[0]).to.be.equal(todo1);
        expect(result[1]).to.be.equal(todo2);
        todo3 = new db[bucket]({ name: 'My Todo 3' });
        console.log('\t\t\t User 2 saved ' + print(todo3));
        return helper.sleep(t, todo3.save());
      })
      .then(function () {
        console.log('\t result size: ' + result.length);
        expect(result.length).to.be.equal(3);
        expect(result[0]).to.be.equal(todo1);
        expect(result[1]).to.be.equal(todo2);
        expect(result[2]).to.be.equal(todo3);
        todo3.name = 'My Todo 1b (former 3)';
        console.log('\t\t\t User 2 updated ' + print(todo3));
        return helper.sleep(t, todo3.save());
      })
      .then(function () {
        console.log('\t result size: ' + result.length);
        expect(result.length).to.be.equal(3);
        expect(result[0]).to.be.equal(todo1);
        expect(result[1]).to.be.equal(todo3);
        expect(result[2]).to.be.equal(todo2);
        todo0 = new db[bucket]({ name: 'My Todo 0' });
        console.log('\t\t\t User 2 saved ' + print(todo0));
        return helper.sleep(t, todo0.save());
      })
      .then(function () {
        console.log('\t result size: ' + result.length);
        expect(result.length).to.be.equal(3);
        expect(result[0]).to.be.equal(todo0);
        expect(result[1]).to.be.equal(todo1);
        expect(result[2]).to.be.equal(todo3);
        todo3.name = 'My Todo 3';
        console.log('\t\t\t User 2 updated ' + print(todo3));
        return helper.sleep(t, todo3.save());
      })
      .then(function () {
        console.log('\t result size: ' + result.length);
        expect(result.length).to.be.equal(3);
        expect(result[0]).to.be.equal(todo0);
        expect(result[1]).to.be.equal(todo1);
        expect(result[2]).to.be.equal(todo2);
        console.log('\t\t\t User 2 deleted ' + print(todo3));
        return helper.sleep(t, todo3.delete());
      })
      .then(function () {
        expect(result.length).to.be.equal(3);
        expect(result[0]).to.be.equal(todo0);
        expect(result[1]).to.be.equal(todo1);
        expect(result[2]).to.be.equal(todo2);
        console.log('\ttest is over --> result size: ' + result.length);
        console.log('checking event attributes');
        //
        expect(events[0].index).to.be.equal(0);
        expect(events[0].matchType).to.be.equal('add');
        expect(events[0].operation).to.be.equal('none');
        expect(!events[0].initial);
        expect(events[1].index).to.be.equal(1);
        expect(events[1].matchType).to.be.equal('add');
        expect(events[1].operation).to.be.equal('insert');
        expect(!events[1].initial);
        expect(events[2].index).to.be.equal(2);
        expect(events[2].matchType).to.be.equal('add');
        expect(events[2].operation).to.be.equal('insert');
        expect(!events[2].initial);
        expect(events[3].index).to.be.equal(1);
        expect(events[3].matchType).to.be.equal('changeIndex');
        expect(events[3].operation).to.be.equal('update');
        expect(!events[3].initial);
        expect(events[4].index).to.be.equal(undefined);
        expect(events[4].matchType).to.be.equal('remove');
        expect(events[4].operation).to.be.equal('none');
        expect(!events[4].initial);
        expect(events[5].index).to.be.equal(0);
        expect(events[5].matchType).to.be.equal('add');
        expect(events[5].operation).to.be.equal('insert');
        expect(!events[5].initial);
        expect(events[6].index).to.be.equal(undefined);
        expect(events[6].matchType).to.be.equal('remove');
        expect(events[6].operation).to.be.equal('update');
        expect(!events[6].initial);
        expect(events[7].index).to.be.equal(2);
        expect(events[7].matchType).to.be.equal('add');
        expect(events[7].operation).to.be.equal('none');
        expect(!events[7].initial);
      });
  });

  it('should use sort predicate for sorting query', function () {
    this.timeout(6000);

    var counter = 0;
    stream = db[bucket].find().matches('name', /^My Todo/).sort({ name: 1, active: -1 }).limit(5)
      .eventStream();

    subscription = stream.subscribe(function (value) {
      counter += 1;
      return counter;
    });

    return helper.sleep(t).then(function () {
      var todo1 = new db[bucket]({ name: 'My Todo: groceries' });
      return helper.sleep(t, todo1.save());
    }).then(function () {
      expect(counter).to.be.equal(1);
      return helper.sleep(t);
    });
  });

  it('should sort with simple query', function () {
    this.timeout(6000);

    var counter = 0;

    // stream = db[bucket].find().sort({'name': 1, 'active': -1}).eventStream();
    stream = db[bucket].find().where(tautology).sort({ name: 1, active: -1 }).limit(5)
      .eventStream();

    subscription = stream.subscribe(function (value) {
      counter += 1;
      return counter;
    });

    return helper.sleep(t).then(function () {
      var todo1 = new db[bucket]({ name: 'My Todo: groceries' });
      return helper.sleep(t, todo1.save());
    }).then(function () {
      expect(counter).to.be.equal(1);
      return helper.sleep(t);
    });
  });

  it('should maintain ordered result', function () {
    this.timeout(6000);

    var urgent = [];
    stream = db[bucket].find().matches('name', /^result/)
      .ascending('name')
      .descending('active')
      .limit(3)
      .eventStream();


    var todo0, todo1, todo2, todo3;
    return helper.sleep(t).then(function () {
      console.log('result: ' + urgent);
      expect(urgent.length).to.be.equal(0);
      todo1 = new db[bucket]({ name: 'result 1' });
      return helper.sleep(t, todo1.save());
    }).then(function () {
      console.log('result: ' + urgent);
      console.log('\t\t\t User 2 saved ' + print(todo1));
      expect(urgent.length).to.be.equal(0);
      console.log('User 1 subscribed --> result size: ' + urgent.length);
      subscription = stream.scan(maintainResult, []).subscribe(function (result) {
        urgent = result;
      });
      return helper.sleep(t);
    }).then(function () {
      console.log('result: ' + urgent);
      todo2 = new db[bucket]({ name: 'result 2' });
      console.log('\t\t\t User 2 saved ' + print(todo2));
      expect(urgent.length).to.be.equal(1);
      expect(urgent[0]).to.be.equal(todo1);
      return helper.sleep(t, todo2.save());
    })
      .then(function () {
        console.log('result: ' + urgent);
        expect(urgent.length).to.be.equal(2);
        expect(urgent[0]).to.be.equal(todo1);
        expect(urgent[1]).to.be.equal(todo2);
        todo3 = new db[bucket]({ name: 'result 3' });
        console.log('\t\t\t User 2 saved ' + print(todo3));
        return helper.sleep(t, todo3.save());
      })
      .then(function () {
        console.log('result: ' + urgent);
        expect(urgent.length).to.be.equal(3);
        expect(urgent[0]).to.be.equal(todo1);
        expect(urgent[1]).to.be.equal(todo2);
        expect(urgent[2]).to.be.equal(todo3);
        todo3.name = 'result 1b (former 3)';
        console.log('\t\t\t User 2 updated ' + print(todo3));
        return helper.sleep(t, todo3.save());
      })
      .then(function () {
        console.log('result: ' + urgent);
        expect(urgent.length).to.be.equal(3);
        expect(urgent[0]).to.be.equal(todo1);
        expect(urgent[1]).to.be.equal(todo3);
        expect(urgent[2]).to.be.equal(todo2);
        todo0 = new db[bucket]({ name: 'result 0' });
        console.log('\t\t\t User 2 saved ' + print(todo0));
        return helper.sleep(t, todo0.save());
      })
      .then(function () {
        console.log('result: ' + urgent);
        expect(urgent.length).to.be.equal(3);
        expect(urgent[0]).to.be.equal(todo0);
        expect(urgent[1]).to.be.equal(todo1);
        expect(urgent[2]).to.be.equal(todo3);
        todo3.name = 'result 3';
        console.log('\t\t\t User 2 updated ' + print(todo3));
        return helper.sleep(t, todo3.save());
      })
      .then(function () {
        console.log('result: ' + urgent);
        expect(urgent.length).to.be.equal(3);
        expect(urgent[0]).to.be.equal(todo0);
        expect(urgent[1]).to.be.equal(todo1);
        expect(urgent[2]).to.be.equal(todo2);
        console.log('\t\t\t User 2 deleted ' + print(todo3));
        return helper.sleep(t, todo3.delete());
      });
  });

  it('should maintain unordered result', function () {
    this.timeout(6000);

    var urgent = [];
    stream = db[bucket].find().matches('name', /^result unordered/).eventStream();


    var todo0, todo1, todo2, todo3;
    return helper.sleep(t).then(function () {
      console.log('result: ' + urgent);
      expect(urgent.length).to.be.equal(0);
      todo1 = new db[bucket]({ name: 'result unordered 1' });
      return helper.sleep(t, todo1.save());
    }).then(function () {
      console.log('result: ' + urgent);
      console.log('\t\t\t User 2 saved ' + print(todo1));
      expect(urgent.length).to.be.equal(0);
      console.log('User 1 subscribed --> result size: ' + urgent.length);
      subscription = stream.scan(maintainResult, []).subscribe(function (result) {
        urgent = result;
      });
      return helper.sleep(t);
    }).then(function () {
      console.log('result: ' + urgent);
      todo2 = new db[bucket]({ name: 'result unordered 2' });
      console.log('\t\t\t User 2 saved ' + print(todo2));
      expect(urgent.length).to.be.equal(1);
      expect(urgent.includes(todo1)).to.be.greaterThan(-1);
      return helper.sleep(t, todo2.save());
    })
      .then(function () {
        console.log('result: ' + urgent);
        expect(urgent.length).to.be.equal(2);
        expect(urgent.includes(todo1)).to.be.greaterThan(-1);
        expect(urgent.includes(todo2)).to.be.greaterThan(-1);
        todo3 = new db[bucket]({ name: 'result unordered 3' });
        console.log('\t\t\t User 2 saved ' + print(todo3));
        return helper.sleep(t, todo3.save());
      })
      .then(function () {
        console.log('result: ' + urgent);
        expect(urgent.length).to.be.equal(3);
        expect(urgent.includes(todo1)).to.be.greaterThan(-1);
        expect(urgent.includes(todo2)).to.be.greaterThan(-1);
        expect(urgent.includes(todo3)).to.be.greaterThan(-1);
        todo3.name = 'result unordered 1b (former 3)';
        console.log('\t\t\t User 2 updated ' + print(todo3));
        return helper.sleep(t, todo3.save());
      })
      .then(function () {
        console.log('result: ' + urgent);
        expect(urgent.length).to.be.equal(3);
        expect(urgent.includes(todo1)).to.be.greaterThan(-1);
        expect(urgent.includes(todo2)).to.be.greaterThan(-1);
        expect(urgent.includes(todo3)).to.be.greaterThan(-1);
        todo0 = new db[bucket]({ name: 'result unordered 0' });
        console.log('\t\t\t User 2 saved ' + print(todo0));
        return helper.sleep(t, todo0.save());
      })
      .then(function () {
        console.log('result: ' + urgent);
        expect(urgent.length).to.be.equal(4);
        expect(urgent.includes(todo0)).to.be.greaterThan(-1);
        expect(urgent.includes(todo1)).to.be.greaterThan(-1);
        expect(urgent.includes(todo2)).to.be.greaterThan(-1);
        expect(urgent.includes(todo3)).to.be.greaterThan(-1);
        todo3.name = 'result unordered 3';
        console.log('\t\t\t User 2 updated ' + print(todo3));
        return helper.sleep(t, todo3.save());
      })
      .then(function () {
        console.log('result: ' + urgent);
        expect(urgent.length).to.be.equal(4);
        expect(urgent.includes(todo0)).to.be.greaterThan(-1);
        expect(urgent.includes(todo1)).to.be.greaterThan(-1);
        expect(urgent.includes(todo2)).to.be.greaterThan(-1);
        expect(urgent.includes(todo3)).to.be.greaterThan(-1);
        console.log('\t\t\t User 2 deleted ' + print(todo3));
        return helper.sleep(t, todo3.delete());
      })
      .then(function () {
        console.log('result: ' + urgent);
        expect(urgent.length).to.be.equal(3);
        expect(urgent.includes(todo0)).to.be.greaterThan(-1);
        expect(urgent.includes(todo1)).to.be.greaterThan(-1);
        expect(urgent.includes(todo2)).to.be.greaterThan(-1);
        console.log('\t\t\t finished');
      });
  });

  // TODO
  // it("should order by date", function() {
  //   expect(false);
  // });

  // TODO
  // it("should give same result: static and streaming query", function() {
  //   expect(false);
  // });

  function print(object) {
    return object.name + ' (' + (object.activities ? object.activities.length : 0) + ' activities)';
  }

  function maintainResult(result, event) {
    if (event.matchType === 'add') { // new entity
      result.splice(event.index || 0, 0, event.data);
    } else if (event.matchType === 'remove') { // leaving entity
      for (var i = 0; i < result.length; i += 1) {
        if (result[i].id === event.data.id) {
          result.splice(i, 1);
          break;
        }
      }
    } else if (event.matchType === 'changeIndex') { // updated position
      var index = result.indexOf(event.data);
      result.splice(index, 1);
      result.splice(event.index, 0, event.data);
    }
    return result;
  }

  function maintainCardinality(ctr, event) {
    var counter = ctr;
    if (event.matchType === 'add') { // entering item: count + 1
      counter += 1;
    } else if (event.matchType === 'remove') { // leaving item: count - 1
      counter -= 1;
    }
    return counter;
  }

  var initialAccumulatorAverage = {
    contributors: {}, // individual activity counts go here
    count: 0, // result set cardinality
    sum: 0, // overall number of activities in the result
    average: 0, // computed as: sum/count
  };

  function getCountByEventMatchType(event) {
    if (event.matchType === 'remove') return -1;

    return event.matchType === 'add' ? 1 : 0;
  }

  function maintainAverage(accumulator, event) {
    var newValue = event.matchType === 'remove' ? 0 : event.data.activities.length;
    var oldValue = accumulator.contributors[event.data.id] || 0;// default: 0

    if (newValue !== 0) { // remember new value
      accumulator.contributors[event.data.id] = newValue;
    } else { // forget old value
      delete accumulator.contributors[event.data.id];
    }
    accumulator.sum += newValue - oldValue;
    accumulator.count += getCountByEventMatchType(event);
    accumulator.average = accumulator.count > 0 ? accumulator.sum / accumulator.count : 0;
    return accumulator;
  }
});

