/*! Jahcode v1.1.0 | jahcode.com | Copyright 2011-2013 by Florian Buecklers | MIT license */

(function(global) {
    var fakePrototype = Object.getPrototypeOf({
        constructor : String
    }) == String.prototype;

    if (!Function.prototype.extend) {
        Function.prototype.extend = function(target, props) {
            if (!props) {
                props = target;
                target = this;
            }

            for (name in props) {
                if (props.hasOwnProperty(name)) {
                    target[name] = props[name];
                }
            }

            return target;
        };
    }

    Object.extend(Function.prototype, {
        linearizedTypes : [Object],
        inherit : function() {
            var klass = function(toCast) {
                if (!(this instanceof klass)) {
                    return klass.asInstance(toCast);
                }

                if (this.initialize)
                    arguments.length ? this.initialize.apply(this, arguments) : this.initialize.call(this);
            };

            var objectDescriptor = arguments[arguments.length - 1];
            var proto = Object.createPrototypeChain(klass, this, Array.prototype.slice.call(arguments, 0, arguments.length - 1));

            var names = Object.getOwnPropertyNames(objectDescriptor);
            for ( var i = 0; i < names.length; ++i) {
                var name = names[i];
                var result = false;
                if (Object.properties.hasOwnProperty(name)) {
                    result = Object.properties[name](proto, objectDescriptor, name);
                }

                if (!result) {
                    var d = objectDescriptor[name];

                    if (d instanceof Function) {
                        if (/this\.superCall/.test(d.toString())) {
                            d = Object.createSuperCallWrapper(klass, name, d);
                        }
                    }

                    if (!d || !(d.hasOwnProperty('get') || d.hasOwnProperty('value'))) {
                        proto[name] = d;
                    } else {
                        Object.defineProperty(proto, name, d);
                    }
                }
            }

            if (klass.initialize) {
                klass.initialize();
            }

            return klass;
        },
        isInstance : function(obj) {
            if (obj === null || obj === undefined)
                return false;

            return Object(obj) instanceof this || classOf(obj).linearizedTypes.lastIndexOf(this) != -1;
        },
        asInstance : function(obj) {
            if (this.isInstance(obj)) {
                return obj;
            } else {
                return this.conv(obj);
            }
        },
        conv : function() {
            return null;
        }
    });

    Object.extend({
        properties : {},
        cloneOwnProperties : function(target, src) {
            var names = Object.getOwnPropertyNames(src);
            for ( var i = 0; i < names.length; ++i) {
                var name = names[i];
                if (name != '__proto__') {
                    var descr = Object.getOwnPropertyDescriptor(src, name);

                    Object.defineProperty(target, name, descr);
                }
            }
        },
        createPrototypeChain : function(cls, parentClass, traits) {
            var proto = parentClass.prototype;
            var linearizedTypes = parentClass.linearizedTypes.slice();
            var prototypeChain = parentClass.prototypeChain ? parentClass.prototypeChain.slice() : [proto];

            for ( var i = 0, trait; trait = traits[i]; ++i) {
                if (!(trait.prototype instanceof Trait)) {
                    throw new TypeError("Only traits can be mixed in.");
                }

                var linearizedTraitTypes = trait.linearizedTypes;
                for ( var j = 0, type; type = linearizedTraitTypes[j]; ++j) {
                    if (linearizedTypes.indexOf(type) == -1 && type != Trait) {
                        proto = Object.create(proto);
                        Object.cloneOwnProperties(proto, type.wrappedPrototype ? type.wrappedPrototype : type.prototype);

                        proto.constructor = type;

                        linearizedTypes.push(type);
                        prototypeChain.push(proto);
                    }
                }
            }

            proto = Object.create(proto);
            proto.constructor = cls;

            linearizedTypes.push(cls);
            prototypeChain.push(proto);

            if (fakePrototype) {
                cls.wrappedPrototype = proto;
                cls.prototype = Object.create(proto);
            } else {
                cls.prototype = proto;
            }

            cls.linearizedTypes = linearizedTypes;
            cls.prototypeChain = prototypeChain;

            return proto;
        },
        createSuperCallWrapper : function(declaringClass, methodName, method) {
            var superCall = function() {
                var cls = classOf(this);
                var index = cls.linearizedTypes.lastIndexOf(declaringClass);
                if (index == -1) {
                    throw new ReferenceError("superCall can't determine any super method");
                }

                var proto = cls.prototypeChain[index - 1];

                if (methodName != 'initialize' || proto[methodName])
                    return arguments.length ? proto[methodName].apply(this, arguments) : proto[methodName].call(this);
            };

            return function() {
                var current = this.superCall;
                this.superCall = superCall;

                var result = arguments.length ? method.apply(this, arguments) : method.call(this);

                if (current) {
                    this.superCall = current;
                } else {
                    // made the property invisible again
                    delete this.superCall;
                }

                return result;
            };
        }
    });

    Object.extend(Object.properties, {
        initialize : function(proto, objectDescriptor) {
            var init = objectDescriptor.initialize;
            var test = /this\.superCall/.test(init.toString());
            if (proto instanceof Trait) {
                if (test) {
                    throw new TypeError('Trait constructors can not call super constructors directly.');
                }

                objectDescriptor.initialize = function() {
                    arguments.length ? this.superCall.apply(this, arguments) : this.superCall.call(this);
                    init.call(this);
                };
            } else if (!test && classOf(proto) != Object) {
                objectDescriptor.initialize = function() {
                    this.superCall.call(this);
                    arguments.length ? init.apply(this, arguments) : init.call(this);
                };
            }
        },
        extend : function(proto, objectDescriptor) {
            Object.extend(proto.constructor, objectDescriptor.extend);
            return true;
        }
    });

    var classOf = function(object) {
        return Object.getPrototypeOf(Object(object)).constructor;
    };

    var Trait = Object.inherit({});

    var Bind = Trait.inherit({
        extend : {
            initialize : function() {
                try {
                    Object.defineProperty(this.prototype, 'bind', {
                        get : function() {
                            return this.bind = Bind.create(this);
                        },
                        set : function(val) {
                            Object.defineProperty(this, 'bind', {
                                value : val
                            });
                        },
                        configurable : true
                    });

                    this.Object = Object.inherit({
                        initialize : function(self) {
                            this.self = self;
                        }
                    });
                } catch (e) {
                    this.Object = Object.inherit({
                        initialize : function(self) {
                            this.self = self;

                            var bind = this;
                            Bind.each(self, function(name, method) {
                                bind[name] = method.bind(bind.self);
                            });
                        }
                    });
                }
            },
            create : function(obj) {
                if (!obj.constructor.Bind) {
                    try {
                        var descr = {};
                        Bind.each(obj, function(name, method) {
                            descr[name] = {
                                get : function() {
                                    return this[name] = method.bind(this.self);
                                },
                                set : function(val) {
                                    Object.defineProperty(this, name, {
                                        value : val
                                    });
                                },
                                configurable : true
                            };
                        });
                        obj.constructor.Bind = Bind.Object.inherit(descr);
                    } catch (e) {
                        obj.constructor.Bind = Bind.Object.inherit({});
                    }
                }

                return new obj.constructor.Bind(obj);
            },
            each : function(obj, callback) {
                var proto = Object.getPrototypeOf(obj);

                for ( var name in proto) {
                    var method = proto[name];
                    if (name != 'initialize' && method instanceof Function) {
                        callback(name, method);
                    }
                }
            }
        },

        initialize : function() {
            if (!('bind' in this)) {
                this.bind = Bind.create(this);
            }
        }
    });

    var nativeClasses = [Boolean, Number, String, Function, RegExp, Error];
    for ( var i = 0, cls; cls = nativeClasses[i]; ++i) {
        cls.conv = cls;
    }

    Date.conv = function(object) {
        return new Date(object);
    };

    Array.conv = function(object) {
        return Array.prototype.slice.call(object);
    };

    Array.prototype.initialize = function() {
        for ( var i = 0; i < arguments.length; ++i) {
            this[i] = arguments[i];
        }

        this.length = arguments.length;
    };

    Error.prototype.initialize = function(message) {
        this.message = message;
        this.stack = new Error().stack;
    };

    Object.extend(global, {
        classOf : classOf,
        Trait : Trait,
        Bind : Bind
    });
})(typeof window != 'undefined' ? window : global);