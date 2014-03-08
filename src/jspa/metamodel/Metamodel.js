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

		this.addType(new jspa.metamodel.BasicType('Boolean', Boolean));

		this.addType(new jspa.metamodel.BasicType('Float', Number));
		this.addType(new jspa.metamodel.BasicType('Integer', Number));
		this.addType(new jspa.metamodel.BasicType('String', String));

        this.addType(new (jspa.metamodel.BasicType.inherit({
            toDatabaseValue: function(state, currentValue) {
                var value = this.superCall(state, currentValue);
                if (value) {
                    value = value.toISOString();
                    value = value.substring(0, value.indexOf('T'));
                }
                return value;
            }
        }))('Date', Date));

        this.addType(new (jspa.metamodel.BasicType.inherit({
            toDatabaseValue: function(state, currentValue) {
                var value = this.superCall(state, currentValue);
                if (value) {
                    value = value.toISOString();
                    value = value.substring(value.indexOf('T') + 1);
                }
                return value;
            },
            fromDatabaseValue: function(state, currentValue, json) {
                return this.superCall(state, currentValue, json? '1970-01-01T' + json: json);
            }
        }))('Time', Date));

        this.addType(new jspa.metamodel.BasicType('DateTime', Date));
		
		var objectModel = new jspa.metamodel.EntityType('/db/_native.Object', null, Object);
		objectModel.declaredAttributes = [];
		objectModel.declaredId = new jspa.metamodel.SingularAttribute(objectModel, 'oid', this.baseType(String));
        objectModel.declaredId.isId = true;

		objectModel.declaredVersion = new jspa.metamodel.SingularAttribute(objectModel, 'version', this.baseType(String));
        objectModel.declaredVersion.isVersion = true;

		this.addType(objectModel);
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
     * Return the metamodel entity type representing the entity.
     *
	 * @param {(Function|String)} typeConstructor - the type of the represented entity
     * @returns {jspa.metamodel.EntityType} the metamodel entity type
     */
	entity: function(typeConstructor) {
		var identifier = this.identifierArg(typeConstructor);
		return identifier? this.entities[identifier]: null;
	},
	
	/**
     * Return the metamodel basic type representing the native class.
     * @param {(Function|String)} typeConstructor - the type of the represented native class
	 * @returns {jspa.metamodel.BasicType} the metamodel basic type
     */
	baseType: function(typeConstructor) {
        if (String.isInstance(typeConstructor) && typeConstructor.indexOf('_native.') == -1)
            typeConstructor = '/db/_native.' + typeConstructor;

        var identifier = this.identifierArg(typeConstructor);
		return identifier? this.baseTypes[identifier]: null;
	},

    /**
     * Return the metamodel embeddable type representing the embeddable class.
     * @param {(Function|String)} typeConstructor - the type of the represented embeddable class
     * @returns {jspa.metamodel.EmbeddableType} the metamodel embeddable type
     */
    embeddable: function(typeConstructor) {
        var identifier = this.identifierArg(typeConstructor);
        return identifier? this.embeddables[identifier]: null;
    },

    /**
     * Return the metamodel managed type representing the entity, mapped superclass, or embeddable class.
     *
     * @param {(Function|String)} typeConstructor - the type of the represented managed class
     * @returns {jspa.metamodel.Type} the metamodel managed type
     */
    managedType: function(typeConstructor) {
        return this.baseType(typeConstructor) || this.entity(typeConstructor) || this.embeddable(typeConstructor);
    },
	
	addType: function(type) {
        var types;

        if (type.isBasic) {
            types = this.baseTypes;
        } else if (type.isEmbeddable) {
            types = this.embeddables;
        } else if (type.isEntity) {
            types = this.entities;
        }

        if (!(type.identifier in types)) {
            type.init(this.classUtil);
            types[type.identifier] = type;
        }
	}
});