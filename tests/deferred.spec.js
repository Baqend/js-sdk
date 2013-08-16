require('../lib/jahcode.js');
require('../lib/util.js');
require('../build/jspa.js');

describe("Deferred", function() {
    var deferred = null, done = false, fail = false;
	
	beforeEach(function() {
		deferred = new jspa.Deferred();
		done = false;
	    fail = false;
		
		deferred.done(function() {
			done = true;
		});
		
		deferred.fail(function() {
			fail = true;
		});
	});

    it("should be in pending state", function() {
        expect(deferred.state).toEqual('pending');
    });
    
    it("should call the done callbacks on resolve", function() {
        deferred.resolve();
        
        expect(deferred.state).toEqual('resolved');
        expect(done).toBeTruthy();
        expect(fail).toBeFalsy();
    });
    
    it("should call the fail callbacks on reject", function() {
        deferred.reject();
        
        expect(deferred.state).toEqual('rejected');
        expect(done).toBeFalsy();
        expect(fail).toBeTruthy();
    });
    
    it("should call the always callback on resolve", function() {
    	var called = false;
    	deferred.always(function() {
    		expect(arguments.length).toBe(0);
    		called = true;
    	});
    	
        deferred.resolve();
        
        expect(called).toBeTruthy();
    });
    
    it("should call the always callback on reject", function() {
    	var called = false;
    	deferred.always(function() {
    		expect(arguments.length).toBe(0);
    		called = true;
    	});
    	
        deferred.reject();
        
        expect(called).toBeTruthy();
    });
    
    it("should call callbacks with the provided arguments", function() {
    	var called = false;
    	
    	deferred.done(function(a, b, c) {
    		expect(a).toBe(1);
    		expect(b).toBe('test');
    		expect(c).toBe(false);
    		
    		called = true;
    	});
    	
        deferred.resolveWith(undefined, [1, 'test', false]);

        expect(called).toBeTruthy();
    });
    
    it("should call callbacks with the provided argument", function() {
    	var called = false;
    	
    	deferred.done(function(a, b, c) {
    		expect(a).toBe(1);
    		expect(b).toBe('test');
    		expect(c).toBe(false);
    		
    		called = true;
    	});
    	
        deferred.resolve(1, 'test', false);

        expect(called).toBeTruthy();
    });
    
    it("should call callbacks with the right context", function() {
    	var called = false;
    	
    	deferred.done(function() {
    		expect(this).toBe(deferred.promise);
    		
    		called = true;
    	});
    	
        deferred.resolve();

        expect(called).toBeTruthy();
    });
    
    it("should call callbacks with the provided context", function() {
    	var called = false;
    	var obj = {};
    	
    	deferred.done(function() {
    		expect(this).toBe(obj);
    		
    		called = true;
    	});
    	
        deferred.resolveWith(obj);

        expect(called).toBeTruthy();
    });
    
    it("should call callbacks with the provided context and args", function() {
    	var called = false;
    	var obj = {};
    	
    	deferred.done(function(a, b, c) {
    		expect(this).toBe(obj);
    		expect(a).toBe(1);
    		expect(b).toBe('test');
    		expect(c).toBe(false);
    		
    		called = true;
    	});
    	
        deferred.resolveWith(obj, [1, 'test', false]);

        expect(called).toBeTruthy();
    });
    
    it("should call lazy added callbacks", function() {
    	var called = false;
        
    	deferred.resolve(123);
        
        deferred.done(function(val) {
    		expect(this).toBe(deferred.promise);
    		expect(val).toBe(123);
    		called = true;
        });

        expect(called).toBeTruthy();
    });
    
    it("should call lazy added callbacks with right context", function() {
    	var called = false;
    	var obj = {};
        
    	deferred.resolveWith(obj, [123]);
        
        deferred.done(function(val) {
    		expect(this).toBe(obj);
    		expect(val).toBe(123);
    		called = true;
        });

        expect(called).toBeTruthy();
    });
    
    it("should ignore resolving after rejecting", function() {
        deferred.reject();
        
        expect(deferred.state).toEqual('rejected');
        expect(done).toBeFalsy();
        expect(fail).toBeTruthy();
        
        deferred.resolve();
        
        expect(deferred.state).toEqual('rejected');
        expect(done).toBeFalsy();
        expect(fail).toBeTruthy();
    });
    
    it("should ignore rejecting after resolving", function() {
        deferred.resolve();
        
        expect(deferred.state).toEqual('resolved');
        expect(done).toBeTruthy();
        expect(fail).toBeFalsy();
        
        deferred.reject();
        
        expect(deferred.state).toEqual('resolved');
        expect(done).toBeTruthy();
        expect(fail).toBeFalsy();
    });
    
    it("should ignore second resolving", function() {
    	var called = 0;
    	
    	deferred.done(function() {
    		called++;
    	});
    	
        deferred.resolve();
        
        expect(called).toBe(1);
        
        deferred.resolve();
        
        expect(called).toBe(1);
    });
    
    it("should ignore second rejecting", function() {
    	var called = 0;
    	
    	deferred.fail(function() {
    		called++;
    	});
    	
        deferred.reject();
        
        expect(called).toBe(1);
        
        deferred.reject();
        
        expect(called).toBe(1);
    });

    it("should provide a promise", function() {
    	var promise = deferred.promise;
    	
    	expect(promise).not.toBe(deferred);
    	
    	var called = false;
    	promise.done(function() {
    		called = true;
    	});
    	
    	deferred.resolve();
    	
    	expect(called).toBeTruthy();
    });
    
    describe('then', function() {
    	it('should forward resolve state', function() {
    		var called = false;
        	deferred.then().done(function(a, b, c) {
        		expect(a).toBe(1);
        		expect(b).toBe('test');
        		expect(c).toBe(false);
        		
        		called = true;
        	}).fail(function() {
        		expect(true).toBeFalsy();
        	});
        	
            deferred.resolve(1, 'test', false);

            expect(called).toBeTruthy();
    	});
    	
    	it('should forward reject state', function() {
    		var called = false;
        	deferred.then().done(function() {
        		expect(true).toBeFalsy();
        	}).fail(function(a, b, c) {
        		expect(a).toBe(1);
        		expect(b).toBe('test');
        		expect(c).toBe(false);
        		
        		called = true;
        	});
        	
            deferred.reject(1, 'test', false);

            expect(called).toBeTruthy();
    	});
    	
    	it('should provide an own context', function() {
    		var called = false;
        	var promise = deferred.then().done(function() {
        		expect(true).toBeFalsy();
        	}).fail(function() {
        		expect(this).toBe(promise);
        		
        		called = true;
        	});
        	
            deferred.reject();

            expect(called).toBeTruthy();
    	});
    	
    	it('should forward context', function() {
    		var deferred = new jspa.Deferred();
    		var context = {};
    		
    		var called = false;
        	deferred.then().done(function() {
        		expect(true).toBeFalsy();
        	}).fail(function() {
        		expect(this).toBe(context);
        		
        		called = true;
        	});
        	
            deferred.rejectWith(context);

            expect(called).toBeTruthy();
    	});
    	
    	it('should call resolve filter and forward origin args', function() {
    		var calledFilter = false;
    		var called = false;
        	deferred.then(function(a, b, c) {
        		expect(a).toBe(1);
        		expect(b).toBe('test');
        		expect(c).toBe(false);
        		calledFilter = true;
        	}).done(function(a, b, c) {
        		expect(a).toBe(1);
        		expect(b).toBe('test');
        		expect(c).toBe(false);
        		
        		called = true;
        	}).fail(function() {
        		expect(true).toBeFalsy();
        	});
        	
            deferred.resolve(1, 'test', false);

            expect(called).toBeTruthy();
            expect(calledFilter).toBeTruthy();
    	});
    	
    	it('should call resolve filter and forward new args', function() {
    		var called = false;
        	deferred.then(function(a, b, c) {
        		expect(a).toBe(1);
        		expect(b).toBe('test');
        		expect(c).toBe(false);
        		return [5, 'foo', true];
        	}).done(function(a, b, c) {
        		expect(a).toBe(5);
        		expect(b).toBe('foo');
        		expect(c).toBe(true);
        		
        		called = true;
        	}).fail(function() {
        		expect(true).toBeFalsy();
        	});
        	
            deferred.resolve(1, 'test', false);

            expect(called).toBeTruthy();
    	});
    	
    	it('should call resolve filter and forward fail', function() {
    		var called = false;
        	deferred.then(function(a, b, c) {
        		throw new Error();
        	}).done(function(a, b, c) {
        		expect(true).toBeFalsy();
        	}).fail(function(e) {
        		called = true;
        		expect(e.isInstanceOf(Error)).toBeTruthy();
        	});
        	
            deferred.resolve(1, 'test', false);

            expect(called).toBeTruthy();
    	});
    	
    	it('should call reject filter and forward new args', function() {
    		var called = false;
        	deferred.then(function(a, b, c) {
        		expect(true).toBeFalsy();
        	}, function() {
        		return [5, 'foo', true];
        	}).done(function(a, b, c) {
        		expect(a).toBe(5);
        		expect(b).toBe('foo');
        		expect(c).toBe(true);
        		
        		called = true;
        	}).fail(function(e) {
        		expect(true).toBeFalsy();
        	});
        	
            deferred.reject(1, 'test', false);

            expect(called).toBeTruthy();
    	});
    	
    	it('should call resolve filter and forward deferred state', function() {
    		var called = false;
        	var def = new jspa.Deferred();
    		
    		var promise = deferred.then(function(a, b, c) {
        		return def;
        	}).done(function(a, b, c) {
        		expect(a).toBe(5);
        		expect(b).toBe('foo');
        		expect(c).toBe(true);
        		
        		called = true;
        	}).fail(function(e) {
        		expect(true).toBeFalsy();
        	});
        	
            deferred.resolve();
            
            expect(promise.state).toEqual('pending');
            expect(called).toBeFalsy();
            
            def.resolve(5, 'foo', true);

            expect(called).toBeTruthy();
    	});
    	

    	it('should call resolve filter and forward promise state', function() {
    		var called = false;
        	var def = new jspa.Deferred();
    		
    		var promise = deferred.then(function(a, b, c) {
        		return def.promise;
        	}).done(function(a, b, c) {
        		expect(a).toBe(5);
        		expect(b).toBe('foo');
        		expect(c).toBe(true);
        		
        		called = true;
        	}).fail(function(e) {
        		expect(true).toBeFalsy();
        	});
        	
            deferred.resolve();
            
            expect(promise.state).toEqual('pending');
            expect(called).toBeFalsy();
            
            def.resolve(5, 'foo', true);

            expect(called).toBeTruthy();
    	});
    	
    	it('should respect returned array arg', function() {
    		var called = false;
    		
    		deferred.then(function(a, b, c) {
        		return [[a, b, c]];
        	}).then(function(arr) {
        		return [arr];
        	}).then().done(function(arr) {
        		expect(arr.length).toBe(3);
        		called = true;
        	});
        	
            deferred.resolve(1,2,3);
            expect(called).toBeTruthy();
    	});
    	
    	it('should pack returned arg', function() {
    		var called = false;
    		
    		deferred.then(function(a, b, c) {
        		return a;
        	}).then().done(function(a) {
        		expect(a).toBe(1);
        		called = true;
        	});
        	
            deferred.resolve(1);
            expect(called).toBeTruthy();
    	});
    	
    	it('should unpack returned array arg', function() {
    		var called = false;
    		
    		deferred.then(function(a, b, c) {
        		return [a, b, c];
        	}).then(function(arr) {
        		return arguments;
        	}).then().done(function(arr) {
        		expect(arguments.length).toBe(3);
        		called = true;
        	});
        	
            deferred.resolve(1,2,3);
            expect(called).toBeTruthy();
    	});
    });
    
    describe('when', function() {
    	var deferred2 = null, deferred3 = null;
    	
    	beforeEach(function() {
    		deferred2 = new jspa.Deferred();
    		deferred3 = new jspa.Deferred();
    	});
    	
    	it('should resolve when all deferreds are resolved', function() {
    		var called = false;
    		jspa.Promise.when(deferred, deferred2, deferred3).done(function() {
        		called = true;
        	}).fail(function(e) {
        		expect(true).toBeFalsy();
        	});
    		
    		deferred.resolve();
            expect(called).toBeFalsy();

    		deferred2.resolve();
            expect(called).toBeFalsy();
            
    		deferred3.resolve();
            expect(called).toBeTruthy();
    	});
    	
    	it('should resolve when one deferred is rejected', function() {
    		var called = false;
    		jspa.Promise.when(deferred, deferred2, deferred3).done(function() {
    			expect(true).toBeFalsy();
        	}).fail(function(e) {
        		called = true;
        	});
    		
    		deferred.resolve();
            expect(called).toBeFalsy();

    		deferred2.reject();
            expect(called).toBeTruthy();
            
    		deferred3.resolve();
            expect(called).toBeTruthy();
    	});
    	
    	it('should aggregate all args arguments', function() {
    		var called = false;
    		jspa.Promise.when(deferred, deferred2, deferred3).done(function(r1, r2, r3) {
        		called = true;
        		
        		expect(r1).toEqual([1,2,3]);
        		expect(r2).toEqual([4,5,6]);
        		expect(r3).toEqual([7,8,9]);
        	}).fail(function(e) {
        		expect(true).toBeFalsy();
        	});
    		
    		deferred.resolve(1, 2, 3);
            expect(called).toBeFalsy();

    		deferred2.resolve(4, 5, 6);
            expect(called).toBeFalsy();
            
    		deferred3.resolve(7, 8, 9);
            expect(called).toBeTruthy();
    	});
    	
    	it('should aggregate all arg arguments', function() {
    		var called = false;
    		jspa.Promise.when(deferred, deferred2, deferred3).done(function(r1, r2, r3) {
        		called = true;
        		
        		expect(r1).toEqual(1);
        		expect(r2).toEqual(4);
        		expect(r3).toEqual(7);
        	}).fail(function(e) {
        		expect(true).toBeFalsy();
        	});
    		
    		deferred.resolve(1);
            expect(called).toBeFalsy();

    		deferred2.resolve(4);
            expect(called).toBeFalsy();
            
    		deferred3.resolve(7);
            expect(called).toBeTruthy();
    	});
    });
});
