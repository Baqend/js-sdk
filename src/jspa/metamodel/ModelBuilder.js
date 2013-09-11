/**
 * @class jspa.metamodel.ModelBuilder
 */
jspa.metamodel.ModelBuilder = Object.inherit({
	/**
	 * @constructor
	 * @param {jspa.metamodel.Metamodel} metamodel
	 */
	initialize: function(metamodel) {
		this.metamodel = metamodel;
		this.objectType = metamodel.entity(Object);
	},
	
	/**
	 * @param {String} identifier
	 * @returns {jspa.metamodel.EntityType}
	 */
	getModel: function(identifier) {
		var model = null;
		if (identifier.indexOf('/db/_native') == 0) {
			model = this.metamodel.baseType(identifier);
		} else {
			model = this.metamodel.entity(identifier);
			if (!model && identifier in this.models) {
				model = this.models[identifier];
			}
			
			if (!model) {
				model = this.buildModel(identifier);
			}
		}
		
		if (model) {
			return model;
		} else {			
			throw new TypeError('no model available for ' + identifier);
		}		
	},
	
	/**
	 * @param {Object}
	 * @returns {jspa.metamodel.EntityType[]}
	 */
	buildModels: function(modelDescriptors) {
		this.modelDescriptors = {};
		for (var i = 0, modelDescriptor; modelDescriptor = modelDescriptors[i]; ++i) {
			this.modelDescriptors[modelDescriptor['class']] = modelDescriptor;
		}
		
		this.models = {};
		for (var identifier in this.modelDescriptors) {
			try {
				var model = this.getModel(identifier);
				model.declaredAttributes = this.buildAttributes(model);				
			} catch (e) {
				throw new jspa.error.PersistentError('Can\'t create model for entity class ' + identifier, e);
			}
		}
		
		return this.models;
	},
	
	/**
	 * @param {String} identifier
	 * @returns {jspa.metamodel.EntityType}
	 */
	buildModel: function(identifier) {
		var modelDescriptor = this.modelDescriptors[identifier];
		if (modelDescriptor) {
			var superTypeIdentifier = modelDescriptor['superClass'];
			var superType = superTypeIdentifier? this.getModel(superTypeIdentifier): this.objectType;
			
			var type = new jspa.metamodel.EntityType(identifier, superType);
			
			this.models[identifier] = type;
			return type;			
		} else {
			return null;
		}
	},
	
	/**
	 * @param {jspa.metamodel.EntityType} model
	 * @returns {jspa.metamodel.Attribute[]}
	 */
	buildAttributes: function(model) {
		if (model.identifier in this.models) {
			var fields = this.modelDescriptors[model.identifier]['fields'];
			
			var attributes = {};
			for (var name in fields) {
				if (fields.hasOwnProperty(name)) {
					attributes[name] = this.buildAttribute(model, name, fields[name]);
				}
			}
			
			return attributes;
		} else {
			return null;
		}
	},
	
	/**
	 * @param {jspa.metamodel.EntityType} model
	 * @param {String} name
	 * @param {String} identifier
	 * @returns {jspa.metamodel.Attribute}
	 */
	buildAttribute: function(model, name, identifier) {
		if (identifier.indexOf('/db/_native.collection') == 0) {
			var collectionType = identifier.substring(0, identifier.indexOf('['));
			
			var elementType = identifier.substring(identifier.indexOf('[') + 1, identifier.indexOf(']')).trim();
			switch (collectionType) {
				case '/db/_native.collection.List':
					return new jspa.metamodel.ListAttribute(model, name, util.List, this.getModel(elementType));
				case '/db/_native.collection.Set':
					return new jspa.metamodel.SetAttribute(model, name, util.Set, this.getModel(elementType));
				case '/db/_native.collection.Map':
					var keyType = elementType.substring(0, elementType.indexOf(',')).trim();
					elementType = elementType.substring(elementType.indexOf(',') + 1).trim();
					
					return new jspa.metamodel.MapAttribute(model, name, util.Map, this.getModel(keyType), this.getModel(elementType));
				default:
					throw new TypeError('no collection available for ' + identifier); 
			}
		} else {
			return new jspa.metamodel.SingularAttribute(model, name, this.getModel(identifier));
		}
	}
});