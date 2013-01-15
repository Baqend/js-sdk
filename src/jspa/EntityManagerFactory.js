jspa.EntityManagerFactory = Object.inherit(util.EventTarget, {
	extend: {
		onError: function(e) {
			if (!e.defaultPrevented) {				
				console.error(e);
			}
		}
	},
	
	/**
	 * @constructor
	 * @memberOf jspa.EntityManagerFactory
	 * @param host
	 */
	initialize: function(host, port) {
		if (!host && typeof window !== 'undefined') {
			host = window.location.host;
			port = window.location.port;
		}
		
		this.connector = jspa.connector.Connector.create(host, port);
		this.metamodel = new jspa.metamodel.Metamodel();
		this.persistenceUnitUtil = new jspa.PersistenceUnitUtil(this.metamodel);
		
		this.pendingQueues = [];
		
		this.on('error', jspa.EntityManagerFactory.onError);
		
		var msg = new jspa.message.GetAllSchemas(this.metamodel);
		
		var self = this;
		msg.on('receive', function() {
			self.ready(msg.models);
		});
		
		msg.on('error', function(e) {
			jspa.EntityManagerFactory.onError(e);
		});
		
		if (msg.send())
			this.connector.send(msg);
	},
	
	ready: function(models) {
		for (var identifier in models) {			
			this.metamodel.addEntityType(models[identifier]);
		}
			
		if (this.trigger('ready')) {
			for (var i = 0, queue; queue = this.pendingQueues[i]; ++i) {
				queue.resume();
			}
			
			this.pendingQueues = null;
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
	}
});