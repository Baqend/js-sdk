jspa.util.State = Object.inherit({
	
	extend: {
		Type: {
			TEMPORARY: 0,
			PERSISTENT: 1,
			DIRTY: 2,
			DELETED: 3
		},
		
		readAccess: function(entity) {
			var state = entity.__jspaState__;					
			if (state) {
				state.makeAvailable();
			}

			if (entity.__jspaNotAvailable__) {
				throw new jspa.error.PersistentError('Object state can not be initialized.');
			}
		},
		
		writeAccess: function(entity) {
			var state = entity.__jspaState__;
			if (state) {
				state.makeDirty();
			}

			if (entity.__jspaNotAvailable__) {
				throw new jspa.error.PersistentError('Object state can not be initialized.');
			}
		}
	},
	
	/**
	 * @returns {Boolean}
	 */
	isTemporary: {
		get: function() {
			return this.state == jspa.util.State.Type.TEMPORARY;
		}
	},
	
	/**
	 * @returns {Boolean}
	 */
	isPersistent: {
		get: function() {
			return this.state == jspa.util.State.Type.PERSISTENT;
		}
	},
	
	/**
	 * @returns {Boolean}
	 */
	isDeleted: {
		get: function() {
			return this.state == jspa.util.State.Type.DELETED;
		}
	},
	
	/**
	 * @memberOf jspa.util.State
	 * @param entityManager
	 * @param {jspa.metamodel.EntityType} type
	 * @param {Object} entity
	 */
	initialize: function(entityManager, type, entity) {
		this.entityManager = entityManager;
		this.type = type;
		this.entity = entity;
		this.entity.__jspaState__ = this;
		this.entity.__jspaNotAvailable__ = true;
		
		this.isDirty = false;
		this.state = jspa.util.State.Type.PERSISTENT;
		
		this.enabled = true;
	},
	
	setTemporary: function() {
		if (this.entity.__jspaNotAvailable__) {
			this.entity.__jspaNotAvailable__ = false;
			this.state = jspa.util.State.Type.TEMPORARY;
			this.isDirty = true;
		}
	},
	
	setPersistent: function() {
		if (this.isDeleted)
			this.isDirty = true;
		
		this.state = jspa.util.State.Type.PERSISTENT;
	},
	
	setDeleted: function() {
		this.state = jspa.util.State.Type.DELETED;
		this.isDirty = true;
	},
	
	enable: function() {
		this.enabled = true;
	},

	disable: function() {
		this.enabled = false;
	},

	/**
	 * 
	 * @param {String} fieldName
	 */
	makeDirty: function() {
		if (this.enabled) {
			if (this.entity.__jspaNotAvailable__) {
				this.makeAvailable();
			}
			
			if (!this.isDeleted) {				
				this.isDirty = true;
			}
		}
	},
	
	makeAvailable: function() {
		if (this.enabled && this.entity.__jspaNotAvailable__) {
			try {				
				this.entityManager.findBlocked(this);
			} catch (e) {}
		}
	},
	
	getIdentifier: function() {
		return this.type.id.getDatabaseValue(this);
	},
	
	getVersion: function() {
		return this.type.version.getDatabaseValue(this);
	},
	
	getReference: function() {
		var value = this.type.id.getDatabaseValue(this);
		
		if (this.isTemporary) {
			var transaction = this.entityManager.transaction;
			if (transaction.isActive) {
				value = '/transaction/' + transaction.tid + value;			
			} else {
				value = null;
			}
		}
		
		return value;
	},
	
	getDatabaseObjectInfo: function() {
		var info = {
			'class': this.type.identifier
		};
		
		var oid = this.getReference();
		if (oid) {
			info['oid'] = oid;
		}
		
		var version = this.type.version.getDatabaseValue(this);
		if (version) {
			info['version'] = version;
		}
		
		var transaction = this.entityManager.transaction;
		if (transaction.isActive) {
			info['transaction'] = '/transaction/' + transaction.tid;
		}
		
		return info;
	},
	
	setDatabaseObjectInfo: function(json) {
		if (this.isTemporary)
			this.type.id.setDatabaseValue(this, json['oid']);
		
		this.type.version.setDatabaseValue(this, json['version']);
	},

	getDatabaseObject: function() {
		var json = {
			'_objectInfo': this.getDatabaseObjectInfo()
		};
		
		this.disable();
		
		var type = this.type;
		
		this.isDirty = false;
		do {
			var attributes = type.declaredAttributes;
			var values = null;
			
			for (var name in attributes) {
				if (!values) 
					values = {};
				
				values[name] = attributes[name].getDatabaseValue(this); 
			}
			
			if (values)
				json[type.identifier] = values;
		} while (type = type.supertype);
		
		this.enable();
		return json;
	},
	
	setDatabaseObject: function(json) {
		this.setDatabaseObjectInfo(json['_objectInfo']);

		this.disable();
		this.entity.__jspaNotAvailable__ = false;
		
		var type = this.type;
		do {
			var attributes = type.declaredAttributes;
			var values = json[type.identifier];
			
			for (var name in attributes) {
				attributes[name].setDatabaseValue(this, values[name]);
			}
		} while (type = type.supertype);
		
		this.enable();

		this.isDirty = false;
	}
});