/**
 * @class jspa.EntityManagerFactory
 */
jspa.EntityManagerFactory = Object.inherit({
	extend: {
        /**
         * @param {Error} e
         */
		onError: function(e) {	
			console.log(e);
			
			throw e;
		}
	},
	
	isDefining: false,
	
	/**
	 * @constructor
	 * @param {String} host 
	 * @param {Number} [port]  
	 */
	initialize: function(host, port) { 
		this.connector = jspa.connector.Connector.create(host, port);
		this.metamodel = new jspa.metamodel.Metamodel();
		this.persistenceUnitUtil = new jspa.PersistenceUnitUtil(this.metamodel);
		
		this.pendingQueues = [];
		
		var msg = new jspa.message.GetAllSchemas(this.metamodel);
		this.connector.send(this, msg).then(function(msg) {
			return this.ready(msg.models);
		}).done(function() {
			for (var i = 0, queue; queue = this.pendingQueues[i]; ++i) {
				queue.start();
			}
			
			this.pendingQueues = null;
		}).fail(function(e) {
			jspa.EntityManagerFactory.onError(e);
		});
	},
	
	ready: function(models) {
		if (this.newModel) {
			var toStore = this.newModel.filter(function(el, i){
				return !(el["class"] in models);
			});
			this.newModel = null;
			
			if(toStore.length > 0) {
				var msg = new jspa.message.PostAllSchemas(this.metamodel, toStore);
				return this.connector.send(this, msg).then(function(msg) {
					this.ready(msg.models);
				});
			}
		}
		
		for (var identifier in models) {
            var type = models[identifier];
            this.metamodel.addType(type);
		}
	},
	
	/**
	 * Create a new application-managed EntityManager. This method returns a new EntityManager 
	 * instance each time it is invoked. The isOpen method will return true on the returned instance.
	 * 
	 * @returns {jspa.EntityManager} entity manager instance
	 */
	createEntityManager: function() {
		var entityManager = new jspa.EntityManager(this);
		
		if (this.pendingQueues) {
			var queue = entityManager.queue;
			queue.wait();
			this.pendingQueues.push(queue);
		}
		
		return entityManager;
	},
	
	define: function(model) {
		this.newModel = model;
	}
});