if (typeof require !== 'undefined') {
    var jspa = require('../dist/jspa.js');
}

(function(global) {
    var TEST_BUCKET = 'test.bucket.Value';
    var EMBEDDED_BUCKET = 'test.type.Embeddable';

    global.test = global.test || {};

    Object.extend(global.test, {
        bucket: {
            Value: function() {}
        },
        type: {
            Embeddable: function() {}
        }
    });

    var o1 = new test.bucket.Value();
    var o2 = new test.bucket.Value();
    var o3 = new test.bucket.Value();

    var data = {
        "Boolean": [false, true, 'Boolean'],
        "Float": [0.0, 42.42, 'Float'],
        "Integer": [0, 42, 'Integer'],
        "String": [ "", "Test String", 'String'],
        "Time": [ new Date(0), new Date("1970-01-01T17:33:14"), 'Time'],
        "Date": [ new Date(0), new Date("2013-11-22"), 'Date'],
        "DateTime": [ new Date(0), new Date(), 'DateTime'],

        "Reference": [ new test.bucket.Value(), o1, TEST_BUCKET],
        "Embedded": [ new test.type.Embeddable(), embeddableValue(), EMBEDDED_BUCKET],

        "SimpleList": [ new jspa.List(), jspa.List([1.1, 2.2, 3.3]),
            jspa.metamodel.PluralAttribute.CollectionType.LIST, 'Float'],
        "RefList": [ new jspa.List(), jspa.List([o1, o2, o3]),
            jspa.metamodel.PluralAttribute.CollectionType.LIST, TEST_BUCKET],

        "SimpleSet": [ new jspa.Set(), jspa.Set(['Test', 'String', '123']),
            jspa.metamodel.PluralAttribute.CollectionType.SET, 'String'],
        "RefSet": [ new jspa.Set(), jspa.Set([o1, o2, o3]),
            jspa.metamodel.PluralAttribute.CollectionType.SET, TEST_BUCKET],

        "SimpleMap": [ new jspa.Map(), simpleMap(),
            jspa.metamodel.PluralAttribute.CollectionType.MAP, 'String', 'Boolean'],
        "SimpleRefMap": [ new jspa.Map(), simpleRefMap(),
            jspa.metamodel.PluralAttribute.CollectionType.MAP, 'String', TEST_BUCKET ],
        "RefSimpleMap": [ new jspa.Map(), refSimpleMap(),
            jspa.metamodel.PluralAttribute.CollectionType.MAP, TEST_BUCKET, 'Boolean' ],
        "RefMap": [ new jspa.Map(), refMap(),
            jspa.metamodel.PluralAttribute.CollectionType.MAP, TEST_BUCKET, TEST_BUCKET ]
    };

    function embeddableValue() {
        var emb = new test.type.Embeddable();
        emb._ref = o1;
        emb._string = "Test String";
        return emb;
    }

    function refMap() {
        return jspa.Map([
            {key: o1, value: o2},
            {key: o2, value: o3},
            {key: o3, value: o1}
        ]);
    }

    function refSimpleMap() {
        return jspa.Map([
            {key: o1, value: true},
            {key: o2, value: false},
            {key: o3, value: true}
        ]);
    }

    function simpleRefMap() {
        return jspa.Map([
            {key: "Test", value: o2},
            {key: "String", value: o3},
            {key: "123", value: o1}
        ]);
    }

    function simpleMap() {
        return jspa.Map([
            {key: "Test", value: true},
            {key: "String", value: false},
            {key: "123", value: true}
        ]);
    }

    function collectionComperator(a, b) {
        if (jspa.Collection.isInstance(a) && jspa.Collection.isInstance(b)) {
            if (a.size !== b.size)
                return false;

            var colIter = b.items();
            for (var iter = a.items(); iter.hasNext; ) {
                var aItem = iter.next();
                var bItem = colIter.next();

                if (!jasmine.matchersUtil.equals(aItem, bItem))
                    return false;
            }

            return true;
        }
    }

    describe('Test entity type', function() {
        beforeEach(function() {
            jasmine.addCustomEqualityTester(collectionComperator);
        });

        var emf = new jspa.EntityManagerFactory('http://localhost:8080');
        var schema = emf.metamodel;
        var em = emf.createEntityManager();

        em.persist(o1);
        em.persist(o2);
        em.persist(o3);
        em.flush();

        function getType(name) {
            if (name == TEST_BUCKET) {
                return em.metamodel.entity(name);
            } else if (name == EMBEDDED_BUCKET) {
                return em.metamodel.embeddable(name);
            } else {
                return em.metamodel.baseType(name);
            }
        }

        it('should persist sample models', function(done) {
            var promise = em.yield();

            promise.always(function() {
                expect(o1._objectInfo.state.isPersistent).toBeTruthy();
                expect(o2._objectInfo.state.isPersistent).toBeTruthy();
                expect(o3._objectInfo.state.isPersistent).toBeTruthy();

                done();
            });
        });

        it('should init schemas', function(done) {
            em.yield(function() {
                for (var name in data) {
                    var def = data[name];
                    if (Number.isInstance(def[2])) {
                        //collections
                        for (var i = 3; i < def.length; ++i) {
                            expect(getType(def[i])).not.toBeNull();
                        }
                    } else {
                        // entities
                        expect(getType(def[2])).not.toBeNull();
                    }
                }

                done();
            });
        });

        for (var name in data) {
            describe(" " + name, function(name) {
                var type, defaultValue, value, attr, constr, isCollection, collectionType, collectionTypes, valueType;

                defaultValue = data[name][0];
                value = data[name][1];
                isCollection = Number.isInstance(data[name][2]);

                beforeEach(function() {
                    if (isCollection) {
                        collectionType = data[name][2];
                        collectionTypes = data[name].slice(3).map(getType);
                    } else {
                        valueType = getType(data[name][2]);
                    }

                    type = schema.entity('test.type.' + name);
                    attr = type.getDeclaredAttribute('value');
                    constr = type.typeConstructor;
                });

                it('should has a valid schema', function() {
                    expect(type.isEntity).toBeTruthy();
                    expect(type.identifier).toBe('/db/test.type.' + name);
                    expect(type.id.isId).toBeTruthy();
                    expect(type.version.isVersion).toBeTruthy();
                    expect(type.declaredAttributes.length).toBe(1);

                    expect(type.typeConstructor).toBeDefined();
                    expect(type.getAttribute('value')).toBe(attr);

                    for (var i = 0, iter = type.attributes(); iter.hasNext; ++i) {
                        expect(iter.next()).toBe(attr);
                    }

                    expect(i).toBe(1);

                    expect(attr.isId).toBeFalsy();
                    expect(attr.isVersion).toBeFalsy();
                    expect(attr.name).toBe('value');

                    if (isCollection) {
                        expect(attr.persistentAttributeType).toBe(1);
                        expect(jspa.metamodel.PluralAttribute.isInstance(attr)).toBeTruthy();

                        if (collectionType == jspa.metamodel.PluralAttribute.CollectionType.MAP) {
                            expect(attr.collectionType).toBe(2);
                            expect(jspa.metamodel.MapAttribute.isInstance(attr)).toBeTruthy();
                            expect(attr.keyType).toBe(collectionTypes[0]);
                        } else if (collectionType == jspa.metamodel.PluralAttribute.CollectionType.SET) {
                            expect(attr.collectionType).toBe(3);
                            expect(jspa.metamodel.SetAttribute.isInstance(attr)).toBeTruthy();
                        } else {
                            expect(attr.collectionType).toBe(1);
                            expect(jspa.metamodel.ListAttribute.isInstance(attr)).toBeTruthy();
                        }

                        expect(attr.elementType).toBe(collectionTypes[collectionTypes.length - 1]);
                    } else {
                        if (valueType.isEntity) {
                            expect(attr.persistentAttributeType).toBe(5);
                        } else if (valueType.isBasic) {
                            expect(attr.persistentAttributeType).toBe(0);
                        } else if (valueType.isEmbeddable) {
                            expect(attr.persistentAttributeType).toBe(2);
                        }

                        expect(jspa.metamodel.SingularAttribute.isInstance(attr)).toBeTruthy();
                        expect(attr.type).toBe(valueType);
                    }
                });

                it('should persist as empty object', function(done) {
                    var obj = new constr();
                    em.persist(obj);

                    var promise = em.flush(function() {
                        expect(obj._objectInfo.oid).toBeDefined();
                        expect(obj._objectInfo.version).toBeDefined();
                        expect(obj._objectInfo.state.isPersistent).toBeTruthy();
                        expect(obj.value).toBeNull();

                        done();
                    });
                });

                it('should persist', function(done) {
                    var obj = new constr();
                    em.persist(obj);
                    obj.value = value;

                    var promise = em.flush().always(function() {
                        expect(obj._objectInfo.oid).toBeDefined();
                        expect(obj._objectInfo.version).toBeDefined();
                        expect(obj._objectInfo.state.isPersistent).toBeTruthy();
                        expect(obj.value).toEqual(value);

                        done();
                    });
                });

                it('should persist and load', function(done) {
                    var obj = new constr();
                    em.persist(obj);
                    obj.value = value;

                    var loaded;
                    var promise = em.flush().then(function() {
                        em.detach(obj);

                        return em.find(obj._objectInfo.oid).done(function(o) {
                            loaded = o;
                        });
                    }).always(function() {
                        expect(loaded).not.toBe(obj);

                        expect(loaded._objectInfo.oid).toBeDefined();
                        expect(loaded._objectInfo.version).toBeDefined();
                        expect(loaded._objectInfo.state.isPersistent).toBeTruthy();
                        expect(loaded.value).toEqual(value);

                        done();
                    });
                });

                it('should persist and load null', function(done) {
                    var obj = new constr();
                    em.persist(obj);
                    obj.value = null;

                    var loaded;
                    var promise = em.flush().then(function() {
                        em.detach(obj);

                        return em.find(obj._objectInfo.oid).done(function(o) {
                            loaded = o;
                        });
                    }).always(function() {
                        expect(loaded).not.toBe(obj);

                        expect(loaded._objectInfo.oid).toBeDefined();
                        expect(loaded._objectInfo.version).toBeDefined();
                        expect(loaded._objectInfo.state.isPersistent).toBeTruthy();
                        expect(loaded.value).toBeNull();

                        done();
                    });
                });

                it('should persist and load default value', function(done) {
                    var obj = new constr();
                    em.persist(obj);
                    obj.value = defaultValue;

                    var loaded;
                    var promise = em.flush().then(function() {
                        em.detach(obj);

                        return em.find(obj._objectInfo.oid).done(function(o) {
                            loaded = o;
                        });
                    }).always(function() {
                        expect(loaded).not.toBe(obj);

                        expect(loaded._objectInfo.oid).toBeDefined();
                        expect(loaded._objectInfo.version).toBeDefined();
                        expect(loaded._objectInfo.state.isPersistent).toBeTruthy();
                        expect(loaded.value).toEqual(defaultValue);

                        done();
                    });
                });

                it('should persist and be editable', function(done) {
                    var obj = new constr();
                    em.persist(obj);
                    obj.value = defaultValue;

                    var promise = em.flush().then(function() {
                        obj.value = value;

                        return em.flush();
                    }).always(function() {
                        expect(obj._objectInfo.oid).toBeDefined();
                        expect(obj._objectInfo.version).toBeDefined();
                        expect(obj._objectInfo.state.isPersistent).toBeTruthy();
                        expect(obj.value).toEqual(value);

                        done();
                    });
                });

                if (!isCollection) {
                    it('should be usable in lists', function(done) {
                        var listConstr = schema.entity('test.type.' + name + 'List').typeConstructor;

                        var obj = new listConstr();
                        var val = obj.value = jspa.List([null, value, defaultValue, value]);

                        em.persist(obj);
                        var loaded;
                        var promise = em.flush().then(function() {
                            em.detach(obj);

                            return em.find(obj._objectInfo.oid).done(function(o) {
                                loaded = o;
                            });
                        }).always(function() {
                            expect(obj._objectInfo.oid).toBeDefined();
                            expect(obj._objectInfo.version).toBeDefined();
                            expect(obj.value).toEqual(val);

                            expect(loaded._objectInfo.oid).toBeDefined();
                            expect(loaded._objectInfo.version).toBeDefined();
                            expect(loaded._objectInfo.state.isPersistent).toBeTruthy();
                            expect(loaded.value).toEqual(val);

                            done();
                        });
                    });

                    it('should be usable in sets', function(done) {
                        var setConstr = schema.entity('test.type.' + name + 'Set').typeConstructor;

                        var obj = new setConstr();
                        var val = obj.value = jspa.Set([null, value, defaultValue]);

                        em.persist(obj);
                        var loaded;
                        var promise = em.flush().then(function() {
                            em.detach(obj);

                            return em.find(obj._objectInfo.oid).done(function(o) {
                                loaded = o;
                            });
                        }).always(function() {
                            expect(obj._objectInfo.oid).toBeDefined();
                            expect(obj._objectInfo.version).toBeDefined();
                            expect(obj.value).toEqual(val);

                            expect(loaded._objectInfo.oid).toBeDefined();
                            expect(loaded._objectInfo.version).toBeDefined();
                            expect(loaded._objectInfo.state.isPersistent).toBeTruthy();
                            expect(loaded.value).toEqual(val);

                            done();
                        });
                    });

                    it('should be usable as map values', function(done) {
                        var mapConstr = schema.entity('test.type.' + name + 'AsMapValues').typeConstructor;

                        var obj = new mapConstr();
                        var val = obj.value = jspa.Map([
                            { key: "test1", value: value },
                            { key: "test2", value: defaultValue },
                            { key: "test3", value: null }
                        ]);

                        em.persist(obj);
                        var loaded;
                        var promise = em.flush().then(function() {
                            em.detach(obj);

                            return em.find(obj._objectInfo.oid).done(function(o) {
                                loaded = o;
                            });
                        }).always(function() {
                            expect(obj._objectInfo.oid).toBeDefined();
                            expect(obj._objectInfo.version).toBeDefined();
                            expect(obj.value).toEqual(val);

                            expect(loaded._objectInfo.oid).toBeDefined();
                            expect(loaded._objectInfo.version).toBeDefined();
                            expect(loaded._objectInfo.state.isPersistent).toBeTruthy();
                            expect(loaded.value).toEqual(val);

                            done();
                        });
                    });

                    it('should be usable as map keys', function(done) {
                        var mapConstr = schema.entity('test.type.' + name + 'AsMapKeys').typeConstructor;

                        var obj = new mapConstr();
                        var val = obj.value = jspa.Map([
                            { key: value, value: "test1" },
                            { key: defaultValue, value: "test2" },
                            { key: null, value: "test3" }
                        ]);

                        em.persist(obj);
                        var loaded;
                        var promise = em.flush().then(function() {
                            em.detach(obj);

                            return em.find(obj._objectInfo.oid).done(function(o) {
                                loaded = o;
                            });
                        }).always(function() {
                            expect(obj._objectInfo.oid).toBeDefined();
                            expect(obj._objectInfo.version).toBeDefined();
                            expect(obj.value).toEqual(val);

                            expect(loaded._objectInfo.oid).toBeDefined();
                            expect(loaded._objectInfo.version).toBeDefined();
                            expect(loaded._objectInfo.state.isPersistent).toBeTruthy();
                            expect(loaded.value).toEqual(val);

                            done();
                        });
                    });
                }

                it('should be usable as embedded value', function(done) {
                    var wrapper = schema.entity('test.type.' + name + 'EmbeddedWrapper').typeConstructor;
                    var embedded = schema.embeddable('test.type.' + name + 'Embedded').typeConstructor;

                    var obj = new wrapper();
                    var val = new embedded();
                    val.value = value;
                    obj.embedded = val;

                    em.persist(obj);
                    var loaded;
                    var promise = em.flush().then(function() {
                        em.detach(obj);

                        return em.find(obj._objectInfo.oid).done(function(o) {
                            loaded = o;
                        });
                    }).always(function() {
                        expect(obj._objectInfo.oid).toBeDefined();
                        expect(obj._objectInfo.version).toBeDefined();
                        expect(obj.embedded).toEqual(val);

                        expect(loaded._objectInfo.oid).toBeDefined();
                        expect(loaded._objectInfo.version).toBeDefined();
                        expect(loaded._objectInfo.state.isPersistent).toBeTruthy();
                        expect(loaded.embedded).toEqual(val);

                        done();
                    });
                });

            }.bind(null, name));
        }
    });
})(typeof global !== 'undefined'? global: window);
