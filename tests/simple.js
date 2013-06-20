eval("var PersClass = Object.inherit({ \
	initialize: function(ref, value, persRef) {\
		this.ref = ref;\
		this.value = value;\
		this.persRef = persRef;\
	}\
});\
\
var factory = new jspa.EntityManagerFactory('http://localhost/');\
var pu = factory.persistenceUnitUtil;\
var em = factory.createEntityManager();\
\
var id;\
em.addNext(function() {\
	var ref = new PersClass(null, 202, null);\
	var p1 = new PersClass(null, 101, ref);\
	\
	em.persist(p1);\
	em.flush(function() {\
		id = pu.getIdentifier(p1);\
	});\
});\
\
em.clear();\
\
em.addNext(function() {\
	em.find(id, function(obj) {\
		console.log(obj.ref.value);\
	});\
});");