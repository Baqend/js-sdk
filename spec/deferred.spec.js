if (typeof jspa == 'undefined') {
  expect = require('chai').expect;
  jspa = require('../lib');
}

var Deferred = jspa.promise.Deferred;
var Promise = jspa.promise.Promise;

describe("Deferred", function () {
  var deferred = null, done = false, fail = false;

  beforeEach(function () {
    deferred = new Deferred();
    done = false;
    fail = false;

    deferred.done(function () {
      done = true;
    });

    deferred.fail(function () {
      fail = true;
    });
  });

  it("should be in pending state", function () {
    expect(deferred.state).equal('pending');
  });

  it("should call the done callbacks on resolve", function () {
    deferred.resolve();

    expect(deferred.state).equal('resolved');
    expect(done).be.true;
    expect(fail).be.false;
  });

  it("should call the fail callbacks on reject", function () {
    deferred.reject();

    expect(deferred.state).equal('rejected');
    expect(done).be.false;
    expect(fail).be.true;
  });

  it("should call the always callback on resolve", function () {
    var called = false;
    deferred.always(function () {
      expect(arguments.length).equal(0);
      called = true;
    });

    deferred.resolve();

    expect(called).be.true;
  });

  it("should call the always callback on reject", function () {
    var called = false;
    deferred.always(function () {
      expect(arguments).length(0);
      called = true;
    });

    deferred.reject();

    expect(called).true;
  });

  it("should call callbacks with the provided arguments", function () {
    var called = false;

    deferred.done(function (a, b, c) {
      expect(a).equal(1);
      expect(b).equal('test');
      expect(c).equal(false);

      called = true;
    });

    deferred.resolveWith(undefined, [1, 'test', false]);

    expect(called).be.true;
  });

  it("should call callbacks with the provided argument", function () {
    var called = false;

    deferred.done(function (a, b, c) {
      expect(a).equal(1);
      expect(b).equal('test');
      expect(c).equal(false);

      called = true;
    });

    deferred.resolve(1, 'test', false);

    expect(called).be.true;
  });

  it("should call callbacks with the right context", function () {
    var called = false;

    deferred.done(function () {
      expect(this).equal(deferred.promise());

      called = true;
    });

    deferred.resolve();

    expect(called).be.true;
  });

  it("should call callbacks with the provided context", function () {
    var called = false;
    var obj = {};

    deferred.done(function () {
      expect(this).equal(obj);

      called = true;
    });

    deferred.resolveWith(obj);

    expect(called).be.true;
  });

  it("should call callbacks with the provided context and args", function () {
    var called = false;
    var obj = {};

    deferred.done(function (a, b, c) {
      expect(this).equal(obj);
      expect(a).equal(1);
      expect(b).equal('test');
      expect(c).equal(false);

      called = true;
    });

    deferred.resolveWith(obj, [1, 'test', false]);

    expect(called).be.true;
  });

  it("should call lazy added callbacks", function () {
    var called = false;

    deferred.resolve(123);

    deferred.done(function (val) {
      expect(this).equal(deferred.promise());
      expect(val).equal(123);
      called = true;
    });

    expect(called).be.true;
  });

  it("should call lazy added callbacks with right context", function () {
    var called = false;
    var obj = {};

    deferred.resolveWith(obj, [123]);

    deferred.done(function (val) {
      expect(this).equal(obj);
      expect(val).equal(123);
      called = true;
    });

    expect(called).be.true;
  });

  it("should ignore resolving after rejecting", function () {
    deferred.reject();

    expect(deferred.state).equal('rejected');
    expect(done).be.false;
    expect(fail).be.true;

    deferred.resolve();

    expect(deferred.state).equal('rejected');
    expect(done).be.false;
    expect(fail).be.true;
  });

  it("should ignore rejecting after resolving", function () {
    deferred.resolve();

    expect(deferred.state).equal('resolved');
    expect(done).be.true;
    expect(fail).be.false;

    deferred.reject();

    expect(deferred.state).equal('resolved');
    expect(done).be.true;
    expect(fail).be.false;
  });

  it("should ignore second resolving", function () {
    var called = 0;

    deferred.done(function () {
      called++;
    });

    deferred.resolve();
    expect(called).equal(1);

    deferred.resolve();
    expect(called).equal(1);
  });

  it("should ignore second rejecting", function () {
    var called = 0;

    deferred.fail(function () {
      called++;
    });

    deferred.reject();
    expect(called).equal(1);

    deferred.reject();
    expect(called).equal(1);
  });

  it("should provide a promise", function () {
    var promise = deferred.promise();

    expect(promise).not.equal(deferred);

    var called = false;
    promise.done(function () {
      called = true;
    });

    deferred.resolve();

    expect(called).be.true;
  });

  describe('then', function () {
    it('should forward resolve state', function () {
      var called = false;
      deferred.then().done(function (a, b, c) {
        expect(a).equal(1);
        expect(b).equal('test');
        expect(c).equal(false);

        called = true;
      }).fail(function () {
        expect(true).be.false;
      });

      deferred.resolve(1, 'test', false);

      expect(called).be.true;
    });

    it('should forward reject state', function () {
      var called = false;
      deferred.then().done(function () {
        expect(true).be.false;
      }).fail(function (a, b, c) {
        expect(a).equal(1);
        expect(b).equal('test');
        expect(c).equal(false);

        called = true;
      });

      deferred.reject(1, 'test', false);

      expect(called).be.true;
    });

    it('should provide an own context', function () {
      var called = false;
      var promise = deferred.then().done(function () {
        expect(true).be.false;
      }).fail(function () {
        expect(this).equal(promise);

        called = true;
      });

      deferred.reject();

      expect(called).be.true;
    });

    it('should forward context', function () {
      var deferred = new Deferred();
      var context = {};

      var called = false;
      deferred.then().done(function () {
        expect(true).be.false;
      }).fail(function () {
        expect(this).equal(context);

        called = true;
      });

      deferred.rejectWith(context);

      expect(called).be.true;
    });

    it('should call resolve filter and forward origin args', function () {
      var calledFilter = false;
      var called = false;
      deferred.then(function (a, b, c) {
        expect(a).equal(1);
        expect(b).equal('test');
        expect(c).equal(false);
        calledFilter = true;
      }).done(function (a, b, c) {
        expect(a).equal(1);
        expect(b).equal('test');
        expect(c).equal(false);

        called = true;
      }).fail(function () {
        expect(true).be.false;
      });

      deferred.resolve(1, 'test', false);

      expect(called).be.true;
      expect(calledFilter).be.true;
    });

    it('should call resolve filter and forward new args', function () {
      var called = false;
      deferred.then(function (a, b, c) {
        expect(a).equal(1);
        expect(b).equal('test');
        expect(c).equal(false);
        return [5, 'foo', true];
      }).done(function (a, b, c) {
        expect(a).equal(5);
        expect(b).equal('foo');
        expect(c).equal(true);

        called = true;
      }).fail(function () {
        expect(true).be.false;
      });

      deferred.resolve(1, 'test', false);

      expect(called).be.true;
    });

    it('should call resolve filter and forward fail', function () {
      var called = false;
      deferred.then(function (a, b, c) {
        throw new Error();
      }).done(function (a, b, c) {
        expect(true).be.false;
      }).fail(function (e) {
        called = true;
        expect(Error.isInstance(e)).be.true;
      });

      deferred.resolve(1, 'test', false);

      expect(called).be.true;
    });

    it('should call reject filter and forward new args', function () {
      var called = false;
      deferred.then(function (a, b, c) {
        expect(true).be.false;
      }, function () {
        return [5, 'foo', true];
      }).done(function (a, b, c) {
        expect(a).equal(5);
        expect(b).equal('foo');
        expect(c).equal(true);

        called = true;
      }).fail(function (e) {
        expect(true).be.false;
      });

      deferred.reject(1, 'test', false);

      expect(called).be.true;
    });

    it('should call resolve filter and forward deferred state', function () {
      var called = false;
      var def = new Deferred();

      var promise = deferred.then(function (a, b, c) {
        return def;
      }).done(function (a, b, c) {
        expect(a).equal(5);
        expect(b).equal('foo');
        expect(c).equal(true);

        called = true;
      }).fail(function (e) {
        expect(true).be.false;
      });

      deferred.resolve();

      expect(promise.state).equal('pending');
      expect(called).be.false;

      def.resolve(5, 'foo', true);

      expect(called).be.true;
    });


    it('should call resolve filter and forward promise state', function () {
      var called = false;
      var def = new Deferred();

      var promise = deferred.then(function (a, b, c) {
        return def.promise();
      }).done(function (a, b, c) {
        expect(a).equal(5);
        expect(b).equal('foo');
        expect(c).equal(true);

        called = true;
      }).fail(function (e) {
        expect(true).be.false;
      });

      deferred.resolve();

      expect(promise.state).equal('pending');
      expect(called).be.false;

      def.resolve(5, 'foo', true);

      expect(called).be.true;
    });

    it('should respect returned array arg', function () {
      var called = false;

      deferred.then(function (a, b, c) {
        return [
          [a, b, c]
        ];
      }).then(function (arr) {
        return [arr];
      }).then().done(function (arr) {
        expect(arr.length).equal(3);
        called = true;
      });

      deferred.resolve(1, 2, 3);
      expect(called).be.true;
    });

    it('should pack returned arg', function () {
      var called = false;

      deferred.then(function (a, b, c) {
        return a;
      }).then().done(function (a) {
        expect(a).equal(1);
        called = true;
      });

      deferred.resolve(1);
      expect(called).be.true;
    });

    it('should unpack returned array arg', function () {
      var called = false;

      deferred.then(function (a, b, c) {
        return [a, b, c];
      }).then(function (arr) {
        return arguments;
      }).then().done(function (arr) {
        expect(arguments.length).equal(3);
        called = true;
      });

      deferred.resolve(1, 2, 3);
      expect(called).be.true;
    });
  });

  describe('when', function () {
    var deferred2 = null, deferred3 = null;

    beforeEach(function () {
      deferred2 = new Deferred();
      deferred3 = new Deferred();
    });

    it('should resolve when all deferreds are resolved', function () {
      var called = false;
      Promise.when(deferred, deferred2, deferred3).done(function () {
        called = true;
      }).fail(function (e) {
        expect(true).be.false;
      });

      deferred.resolve();
      expect(called).be.false;

      deferred2.resolve();
      expect(called).be.false;

      deferred3.resolve();
      expect(called).be.true;
    });

    it('should resolve when one deferred is rejected', function () {
      var called = false;
      Promise.when(deferred, deferred2, deferred3).done(function () {
        expect(true).be.false;
      }).fail(function (e) {
        called = true;
      });

      deferred.resolve();
      expect(called).be.false;

      deferred2.reject();
      expect(called).be.true;

      deferred3.resolve();
      expect(called).be.true;
    });

    it('should aggregate all args arguments', function () {
      var called = false;
      Promise.when(deferred, deferred2, deferred3).done(function (r1, r2, r3) {
        called = true;

        expect(r1).eql([1, 2, 3]);
        expect(r2).eql([4, 5, 6]);
        expect(r3).eql([7, 8, 9]);
      }).fail(function (e) {
        expect(true).be.false;
      });

      deferred.resolve(1, 2, 3);
      expect(called).be.false;

      deferred2.resolve(4, 5, 6);
      expect(called).be.false;

      deferred3.resolve(7, 8, 9);
      expect(called).be.true;
    });

    it('should aggregate all arg arguments', function () {
      var called = false;
      Promise.when(deferred, deferred2, deferred3).done(function (r1, r2, r3) {
        called = true;

        expect(r1).equal(1);
        expect(r2).equal(4);
        expect(r3).equal(7);
      }).fail(function (e) {
        expect(true).be.false;
      });

      deferred.resolve(1);
      expect(called).be.false;

      deferred2.resolve(4);
      expect(called).be.false;

      deferred3.resolve(7);
      expect(called).be.true;
    });
  });
});
