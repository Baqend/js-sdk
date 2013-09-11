/**
 * @class jspa.metamodel.Metamodel
 */
jspa.metamodel.Metamodel = Object.inherit({
	/**
	 * @constructor
	 */
	initialize: function() {
		this.baseTypes = {};
		this.entities = {};
        this.embeddables = {};
		
		this.classUtil = new jspa.binding.ClassUtil();

		this.addBaseType(new jspa.metamodel.BasicType('Boolean', Boolean));
		this.addBaseType(new jspa.metamodel.BasicType('Float', Number));
		this.addBaseType(new jspa.metamodel.BasicType('Integer', Number));
		this.addBaseType(new jspa.metamodel.BasicType('String', String));

        this.addBaseType(new jspa.metamodel.BasicType('Date', Date));
        this.addBaseType(new jspa.metamodel.BasicType('DateTime', Date));
        this.addBaseType(new jspa.metamodel.BasicType('Time', Date));
		
		var objectModel = new jspa.metamodel.EntityType('/db/_native.Object', null, Object);
		objectModel.declaredAttributes = {};
		objectModel.declaredId = new jspa.metamodel.SingularAttribute(objectModel, 'oid', this.baseType(String));
        objectModel.declaredId.isId = true;

		objectModel.declaredVersion = new jspa.metamodel.SingularAttribute(objectModel, 'version', this.baseType(String));
        objectModel.declaredVersion.isVersion = true;

		this.addEntityType(objectModel);
	},

    /**
     * @param {(Function|String)} arg
     * @return {String}
     */
    identifierArg: function(arg) {
        var identifier;
        if (String.isInstance(arg)) {
            identifier = arg;

            if (identifier.indexOf('/db/') != 0) {
                identifier = '/db/' + arg;
            }
        } else {
            identifier = this.classUtil.getIdentifier(arg);
        }

        return identifier;
    },
	
	/**
	 * @param {(Function|String)} typeConstructor
	 * @returns {jspa.metamodel.EntityType}
	 */
	entity: function(typeConstructor) {
		var identifier = this.identifierArg(typeConstructor);
		return identifier? this.entities[identifier]: null;
	},
	
	/**
	 * @param {(Function|String)} typeConstructor
	 * @returns {jspa.metamodel.BasicType}
	 */
	baseType: function(typeConstructor) {
        var identifier = this.identifierArg(typeConstructor);
		return identifier? this.baseTypes[identifier]: null;
	},

    /**
     * @param {(Function|String)} typeConstructor
     * @returns {jspa.metamodel.EmbeddableType}
     */
    embeddable: function(typeConstructor) {
        var identifier = this.identifierArg(typeConstructor);
        return identifier? this.embeddables[identifier]: null;
    },
	
	addBaseType: function(baseType) {
		if (!this.baseTypes[baseType.identifier]) {
			baseType.init(this.classUtil);
			this.baseTypes[baseType.identifier] = baseType;
		}
	},

    addEntityType: function(entityType) {
        if (!this.entities[entityType.identifier]) {
            entityType.init(this.classUtil);
            this.entities[entityType.identifier] = entityType;
        }
    },

    addEmbeddableType: function(embeddable) {
        if (!this.entities[embeddable.identifier]) {
            embeddable.init(this.classUtil);
            this.embeddables[embeddable.identifier] = embeddable;
        }
    }
});