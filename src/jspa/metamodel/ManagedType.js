/**
 * @class jspa.metamodel.ManagedType
 * @extends jspa.metamodel.Type
 */
jspa.metamodel.ManagedType = jspa.metamodel.Type.inherit({
	AttributeIterator: Object.inherit(util.Iterator, {
		nextAttr: null,

        initialize: function(type) {
			this.type = type;

            this.initAttr();
            this.next();
		},
		
		initAttr: function() {
            this.index = 0;
            this.names = Object.getOwnPropertyNames(this.type.declaredAttributes);
		},

        /**
         * @return {jspa.metamodel.Attribute}
         */
		next: function() {
			var attr = this.nextAttr;

            while (this.names.length == this.index && (this.type = this.type.supertype)) {
                this.initAttr();
            }
			
			this.hasNext = this.type != null;
            if (this.hasNext) {
                this.nextAttr = this.type.declaredAttributes[this.names[this.index++]];
            }

			return attr;
		}
	}),

    /**
     * @type {jspa.metamodel.Attribute[]}
     */
	declaredAttributes: null,
	
	/**
	 * @param {jspa.binding.ClassUtil} classUtil
	 */
	init: function(classUtil) {
		if (!this.typeConstructor) {
			this.typeConstructor = classUtil.loadClass(this);

			this.superCall(classUtil);
			this.classUtil.enhance(this, this.typeConstructor);
		} else {
			this.superCall(classUtil);
		}
	},

    /**
     * @return {jspa.metamodel.ManagedType.AttributeIterator}
     */
	attributes: function() {
		return new this.AttributeIterator(this);
	},
	
	/**
	 * @param {!String} name
	 * @returns {jspa.metamodel.Attribute}
	 */
	getAttribute: function(name) {
		if (name in this.declaredAttributes) {			
			return this.declaredAttributes[name];
		} else if (this.supertype) {
			return this.supertype.getAttribute(name);
		} else {
			return null;
		}
	},
	
	/**
	 * @param {String} name
	 * @returns {jspa.metamodel.Attribute}
	 */
	getDeclaredAttribute: function(name) {
        return this.declaredAttributes[name] || null;
	},

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @param {Object} value
     * @return {*}
     */
    fromDatabaseValue: function(state, obj, value) {
        if (value && value._objectInfo['class'] == this.identifier) {
            for (var iter = this.attributes(); iter.hasNext; ) {
                var attribute = iter.next();

                attribute.setDatabaseValue(state, obj, value[attribute.name]);
            }
        } else {
            obj = null;
        }

        return obj;
    },

    /**
     * @param {jspa.util.State} state
     * @param {*} obj
     * @return {Object}
     */
    toDatabaseValue: function(state, obj) {
        var value = null;

        if (obj) {
            value = {
                _objectInfo: {
                    'class': this.identifier
                }
            };

            for (var iter = this.attributes(); iter.hasNext; ) {
                var attribute = iter.next();

                value[attribute.name] = attribute.getDatabaseValue(state, obj);
            }
        }

        return value;
    }
});