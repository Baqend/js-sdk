var context;
if (!jspa) {
	var jspa = require('../build/jspa.js');
	context = global;
} else {
	context = window;
}

context.PersClass = Object.inherit({
	initialize : function(ref, value, persRef) {
		this.ref = ref;
		this.value = value;
		this.persRef = persRef;
	}
});

context.ChildPersClass = PersClass.inherit({
	initialize : function(ref, value, persRef, name) {
		this.superCall(ref, value, persRef);

		this.name = name;
	}
});

context.OtherPersClass = Object.inherit({
	initialize : function(value) {
		this.value = value;
	}
});

var schema = [ {
	"class" : "/db/test.persistent.Coffee",
	"fields" : {
		"caffeine" : "/db/_native.Float",
		"name" : "/db/_native.String",
		"countryCode" : "/db/_native.Integer",
		"parent" : "/db/test.persistent.Coffee"
	}
}, {
	"class" : "/db/test.persistent.TestClass",
	"fields" : {
		"testString" : "/db/_native.String",
		"testBoolean" : "/db/_native.Boolean",
		"testLong" : "/db/_native.Long"
	}
}, {
	"class" : "/db/test.persistent.TestChildClass",
	"superClass" : "/db/test.persistent.TestClass",
	"fields" : {
		"testDouble" : "/db/_native.Double",
		"testByte" : "/db/_native.Byte",
		"testInteger" : "/db/_native.Integer",
		"testFloat" : "/db/_native.Float",
		"testRef" : "/db/test.persistent.TestClass"
	}
} ];

var factory = new jspa.EntityManagerFactory('http://localhost:80');
//factory.define(schema);

var pu = factory.persistenceUnitUtil;
var em = factory.createEntityManager();

var id;
em.yield(function() {
	var ref = new PersClass(null, 202, null);
	var p1 = new PersClass(null, 101, ref);

	em.persist(p1);
	em.flush(function() {
		id = pu.getIdentifier(p1);
		console.log(id);
	});

	em.refresh(p1, function() {
		console.log(ref == p1.persRef);
		p1.value = 303;
		em.flush();
	});
});

em.clear();

em.transaction.begin(function() {
	em.find(PersClass, id, function(e, obj) {
		console.log(obj.value);
		em.refresh(obj, function() {
			console.log(obj.value);
		});
	});
	em.transaction.commit();
});

em.transaction.begin(function() {
	var ref = new PersClass(null, 202, null);
	var p1 = new PersClass(null, 101, ref);

	em.persist(p1);
	em.flush();

	em.refresh(p1, function() {
		console.log(ref == p1.persRef);
		id = pu.getIdentifier(p1);
		console.log(id);
	});
});
em.transaction.commit();

em.clear();

em.yield(function() {
	console.log('ID:' + id);
	em.find(PersClass, id, function(e, obj) {
		console.log(obj.value);

		if (!pu.isLoaded(obj, 'persRef')) {
			em.refresh(obj.persRef, function() {
				var ref = obj.persRef;
				console.log(ref.value);

				ref.name = 'buh';
			});
		} else {
			var ref = obj.persRef;
			console.log(ref.value);

			ref.name = 'buh';
		}
	});
});

em.yield(function() {
	var query = em.createQuery(null, PersClass);
	query.getResultList(function(e, result) {
		for ( var i = 0, pers; pers = result[i]; ++i) {
			console.log('ID: ' + pu.getIdentifier(pers) + ': ' + pers.value);
		}
	});
});

em.yield(function() {
	var query = em.createQuery(null, PersClass);
	query.maxResults = 3;
	query.getResultList(function(e, result) {
		console.log('first 3 Persons:');
		for ( var i = 0, pers; pers = result[i]; ++i) {
			console.log('ID: ' + pu.getIdentifier(pers) + ': ' + pers.value);
		}
	});
});

em.yield(function() {
	var cls = new PersClass(null, 100, null);

	em.persist(cls);
	em.flush(function() {
		id = pu.getIdentifier(cls);
		em.detach(cls);
		em.find(PersClass, id, function(e, entity) {
			console.log(cls != entity);
			cls.value = 200;
			em.merge(cls, function(e, merged) {
				console.log(merged == entity);
				console.log(merged.value == 200);
				em.flush();
			});
		});
	});
});

em.yield(function() {
	var query = em.createQuery(null, PersClass);
	query.getResultList(function(e, result) {
		for ( var i = 0, pers; pers = result[i]; ++i) {
			em.remove(pers);
		}
		em.flush();
	});
});