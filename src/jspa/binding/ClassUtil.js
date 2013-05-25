jspa.binding.ClassUtil = Object.inherit({
	extend: {
		classLoaders: [],
		
		initialize: function() {
			this.addClassLoader(this.proxyLoader);
			this.addClassLoader(this.globalLoader);
			this.addClassLoader(this.moduleLoader);
		},
		
		loadClass: function(model) {
			var el = /\/db\/([\w\.]*)\.(\w*)/.exec(model.identifier);

			var namespace = el[1];
			var className = el[2];
			
			for (var i = this.classLoaders.length - 1, loader; loader = this.classLoaders[i]; --i) {
				try {
					return loader(model, namespace, className);
				} catch (e) {}
			}
			
			throw new TypeError('The class for ' + model.identifier + ' was not found!');
		},
		
		addClassLoader: function(classLoader) {
			this.classLoaders.push(classLoader);
		},
		
		removeClassLoader: function(classLoader) {
			var index = this.classLoaders.indexOf(classLoaders);
			if (index != -1) {
				this.classLoaders.splice(index, 1);
			}
		},
		
		globalLoader: function(model, namespace, className) {
			var context = typeof window != 'undefined'? window: global;
			var fragments = namespace.split('.');
			
			var n = context;
			for (var i = 0, fragment; n && (fragment = fragments[i]); ++i) {
				n = n[fragment];
			}
			
			var cls = n && n[className] || context[className];
			
			if (cls) {
				return cls;
			} else {
				throw new TypeError('The class was not found in the global context');
			}
		},
		
		moduleLoader: function(model, namespace, name) {
			var mod = module;
			while (mod = mod.parent) {
				if (name in mod) {
					return name[mod];
				}
			}
			
			throw TypeError('The class was not found in the parent modules');
		},
		
		proxyLoader: function(model) {
			console.log('Initialize proxy class for ' + model.identifier);
			return model.supertype.typeConstructor.inherit({});
		}
	},
	
	/**
	 * @memberOf jspa.binding.ClassUtil
	 * @param {Function} typeConstructor
	 * @returns {String}
	 */
	getIdentifier: function(typeConstructor) {
		return typeConstructor.__jspaId__;
	},
	
	/**
	 * @param {Function}
	 * @param {String} identifier
	 */
	setIdentifier: function(typeConstructor, identifier) {
		typeConstructor.__jspaId__ = identifier;
	},
	
	/**
	 * @param {jspa.metamodel.EntityType} type
	 * @returns {Object}
	 */
	create: function(type) {
		return Object.create(type.typeConstructor.prototype);
	},
	
	/**
	 * @param {jspa.metamodel.EntityType} type
	 * @returns {Object}
	 */
	conv: function(model, object) {
		if (object === null || object === undefined) {
			return null;
		}
		
		if (object.isInstanceOf && object.isInstanceOf(model.typeConstructor)) {
			return object;
		} else {			
			return model.typeConstructor.conv(object);
		}
	},
	
	/**
	 * @param {String} type
	 * @returns {Function}
	 */
	loadClass: function(model) {
		return jspa.binding.ClassUtil.loadClass(model);
	},
	
	/**
	 * @param {jspa.metamodel.EntityType} type
	 * @param {Function} typeConstructor
	 */
	enhance: function(type, typeConstructor) {
		for (var name in type.declaredAttributes) {
			this.enhanceProperty(type, type.declaredAttributes[name], typeConstructor);
		}
	},
	
	/**
	 * @param {jspa.metamodel.EntityType} type
	 * @param {jspa.metamodel.Attribute} attribute
	 * @param {Function} typeConstructor
	 */
	enhanceProperty: function(type, attribute, typeConstructor) {
		var name = '_' + attribute.name;
		Object.defineProperty(typeConstructor.prototype, attribute.name, {
			get: function() {
				jspa.util.State.readAccess(this);
				return this[name];
			},
			set: function(value) {
				jspa.util.State.writeAccess(this);
				this[name] = value;
			}
		});
	}
});

