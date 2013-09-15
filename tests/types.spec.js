var data = {
    "Boolean": null,
    "Float": null,
    "Integer": null,
    "String": null,
    "Time": null,
    "Date": null,
    "DateTime": null,
    "Reference": null,
    "Embedded": null,
    "SimpleList": null,
    "RefList": null,
    "SimpleSet": null,
    "RefSet": null,
    "SimpleMap": null,
    "SimpleRefMap": null,
    "RefSimpleMap": null,
    "RefMap": null
};

jspa.Collection.prototype.jasmineMatches = function(other) {
    if (this.size !== other.size)
        return false;

    var env = jasmine.getEnv();

    var colIter = other.items();
    for (var iter = this.items(); iter.hasNext; ) {
        var a = iter.next();
        var b = colIter.next();

        return env.equals_(a, b);
    }
};

describe('Test entity type', function() {
    var emf = new jspa.EntityManagerFactory('http://localhost:8080');
    var schema = emf.metamodel;
    var em = emf.createEntityManager();

    var TEST_SCHEMA;
    var o1, o2, o3;

    it('should persist sample models', function() {
        runs(function() {
            em.yield().done(function() {
                TEST_SCHEMA = schema.entity("test.bucket.Value");
            });
        });

        waitsFor(function() {
            return Boolean(TEST_SCHEMA);
        });

        var done = false;
        runs(function() {
            em.persist(o1 = new TEST_SCHEMA.typeConstructor());
            em.persist(o2 = new TEST_SCHEMA.typeConstructor());
            em.persist(o3 = new TEST_SCHEMA.typeConstructor());

            em.flush().done(function() {
                done = true;
            });
        });

        waitsFor(function() {
            return done;
        });

        runs(function() {
            expect(o1._objectInfo.state.isPersistent).toBeTruthy();
            expect(o2._objectInfo.state.isPersistent).toBeTruthy();
            expect(o3._objectInfo.state.isPersistent).toBeTruthy();
        })
    });

    it('should init sample data', function() {
        runs(function() {
            var EMBEDDED_SCHEMA = schema.embeddable('test.type.Embeddedable');

            Object.extend(data, {
                "Boolean": [false, true, schema.baseType('Boolean')],
                "Float": [0.0, 42.42, schema.baseType('Float')],
                "Integer": [0, 42, schema.baseType('Integer')],
                "String": [ "", "Test String", schema.baseType('String')],
                "Time": [ new Date(0), new Date("T17:33:14"), schema.baseType('Time')],
                "Date": [ new Date(0), new Date("2013-11-22"), schema.baseType('Date')],
                "DateTime": [ new Date(0), new Date(), schema.baseType('DateTime')],

                "Reference": [ new TEST_SCHEMA.typeConstructor(), o1, TEST_SCHEMA],
                "Embedded": [ new EMBEDDED_SCHEMA.typeConstructor(), embeddableValue(), EMBEDDED_SCHEMA],

                "SimpleList": [ new jspa.List(), jspa.List([1.1, 2.2, 3.3]),
                    jspa.metamodel.PluralAttribute.CollectionType.LIST, schema.baseType('Float')],
                "RefList": [ new jspa.List(), jspa.List([o1, o2, o3]),
                    jspa.metamodel.PluralAttribute.CollectionType.LIST, TEST_SCHEMA],

                "SimpleSet": [ new jspa.Set(), jspa.Set(['Test', 'String', '123']),
                    jspa.metamodel.PluralAttribute.CollectionType.SET, schema.baseType('String')],
                "RefSet": [ new jspa.Set(), jspa.Set([o1, o2, o3]),
                    jspa.metamodel.PluralAttribute.CollectionType.SET, TEST_SCHEMA],

                "SimpleMap": [ new jspa.Map(), simpleMap(),
                    jspa.metamodel.PluralAttribute.CollectionType.MAP, schema.baseType('String'), schema.baseType('Boolean') ],
                "SimpleRefMap": [ new jspa.Map(), simpleRefMap(),
                    jspa.metamodel.PluralAttribute.CollectionType.MAP, schema.baseType('String'), TEST_SCHEMA ],
                "RefSimpleMap": [ new jspa.Map(), refSimpleMap(),
                    jspa.metamodel.PluralAttribute.CollectionType.MAP, TEST_SCHEMA, schema.baseType('Boolean') ],
                "RefMap": [ new jspa.Map(), refMap(),
                    jspa.metamodel.PluralAttribute.CollectionType.MAP, TEST_SCHEMA, TEST_SCHEMA ]
            });

            function embeddableValue() {
                var emb = new EMBEDDED_SCHEMA.typeConstructor();
                emb.ref = o1;
                emb.string = "Test String";
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
        });

        waitsFor(function() {
            return Boolean(data);
        });

        runs(function() {
            for (var name in data) {
                var def = data[name];
                if (Number.isInstance(def[2])) {
                    //collections
                    for (var i = 3; i < def.length; ++i) {
                        expect(def[i]).not.toBeNull();
                    }
                } else {
                    // entities
                    expect(def[2]).not.toBeNull();
                }
            }
        });
    });

    for (var name in data) {
        describe(" " + name, function(name) {
            var type, defaultValue, value, attr, constr, isCollection, collectionType, collectionTypes, valueType;

            beforeEach(function() {
                type = schema.entity('test.type.' + name);
                defaultValue = data[name][0];
                value = data[name][1];
                attr = type.getDeclaredAttribute('value');
                constr = type.typeConstructor;
                isCollection = Number.isInstance(data[name][2]);

                if (isCollection) {
                    collectionType = data[name][2];
                    collectionTypes = data[name].slice(3);
                } else {
                    valueType = data[name][2];
                }
            });

            it('should has a valid schema', function() {
                expect(type.isEntity).toBeTruthy();
                expect(type.identifier).toBe('/db/test.type.' + name);
                expect(type.id.isId).toBeTruthy();
                expect(type.version.isVersion).toBeTruthy();
                expect(Object.getOwnPropertyNames(type.declaredAttributes).length).toBe(1);

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

            it('should persist as empty object', function() {
                var obj = new constr();
                em.persist(obj);

                var promise = em.flush();

                waitsFor(function() {
                    return promise.state == "resolved";
                });

                runs(function() {
                    expect(obj._objectInfo.oid).toBeDefined();
                    expect(obj._objectInfo.version).toBeDefined();
                    expect(obj._objectInfo.state.isPersistent).toBeTruthy();
                    expect(obj.value).toBeNull();
                });
            });

            it('should persist', function() {
                var obj = new constr();
                em.persist(obj);
                obj.value = value;

                var promise = em.flush();

                waitsFor(function() {
                    return promise.state == "resolved";
                });

                runs(function() {
                    expect(obj._objectInfo.oid).toBeDefined();
                    expect(obj._objectInfo.version).toBeDefined();
                    expect(obj._objectInfo.state.isPersistent).toBeTruthy();

                    if (valueType && valueType.isEmbeddable && obj.value) {
                        expect(obj.value.ref).toEqual(value.ref);
                        expect(obj.value.string).toEqual(value.string);
                    } else {
                        expect(obj.value).toEqual(value);
                    }
                });
            });

            it('should persist and load', function() {
                var obj = new constr();
                em.persist(obj);
                obj.value = value;

                var loaded;
                var promise = em.flush().then(function() {
                    em.detach(obj);

                    return em.find(obj._objectInfo.oid).done(function(o) {
                        loaded = o;
                    });
                });

                waitsFor(function() {
                    return promise.state == "resolved";
                });

                runs(function() {
                    expect(loaded).not.toBe(obj);

                    expect(loaded._objectInfo.oid).toBeDefined();
                    expect(loaded._objectInfo.version).toBeDefined();
                    expect(loaded._objectInfo.state.isPersistent).toBeTruthy();

                    if (valueType && valueType.isEmbeddable && obj.value) {
                        expect(loaded.value.ref).toEqual(value.ref);
                        expect(loaded.value.string).toEqual(value.string);
                    } else {
                        expect(loaded.value).toEqual(value);
                    }
                });
            });

        }.bind(null, name));
    }
});

/*


    @Test
    public void testStoreAndLoadNull() throws Exception {
        OrestesClass cls = (OrestesClass) schema.get(holder.getBucket());

        OrestesObject object = provider.newObject(cls.getBucket());

        object.setValue(cls.getField("value"), null);

        object = client.store(object);
        OrestesObject loaded = client.load(object.getId());

        assertNull(loaded.getValue(cls.getField("value")));
    }

    @Test
    public void testStoreAndModifyObject() throws Exception {
        OrestesClass cls = (OrestesClass) schema.get(holder.getBucket());

        OrestesObject object = provider.newObject(cls.getBucket());

        object.setValue(cls.getField("value"), defaultValue);
        object = client.store(object);

        object.setValue(cls.getField("value"), value);
        OrestesObject stored = client.store(object);

        assertEquals(value, stored.getValue(cls.getField("value")));
    }

    @Test
    public void testAsListValue() throws BucketNotFound, SchemaNotCompatible {
        //collections in collections arn't supported
        if (genericArgs.length > 0)
            return;

        ClassHolder list = new ClassHolder(new Bucket(holder.getBucket().getName() + "List"), false);

        list.init(new ClassFieldHolder[] {
            new ClassFieldHolder("value", ClassMapping.LIST, fieldType)
        });

        OrestesClass cls = (OrestesClass) schema.add(list);
        OrestesObject object = new OrestesObject(cls);

        List<?> val = new ArrayList<>(Arrays.asList(value, defaultValue, value));
        object.setValue(cls.getField("value"), val);

        object = client.store(object);
        assertEquals(val, object.getValue(cls.getField("value")));

        object = client.load(object.getId());
        assertEquals(val, object.getValue(cls.getField("value")));
    }

    @Test
    public void testAsSetValue() throws BucketNotFound, SchemaNotCompatible {
        // collections in collections arn't supported
        if (genericArgs.length > 0)
            return;

        ClassHolder set = new ClassHolder(new Bucket(holder.getBucket().getName() + "Set"), false);

        set.init(new ClassFieldHolder[] {
            new ClassFieldHolder("value", ClassMapping.SET, fieldType)
        });

        OrestesClass cls = (OrestesClass) schema.add(set);
        OrestesObject object = new OrestesObject(cls);

        Set<?> val = new HashSet<>(Arrays.asList(value, defaultValue));
        object.setValue(cls.getField("value"), val);

        object = client.store(object);
        assertEquals(val, object.getValue(cls.getField("value")));

        object = client.load(object.getId());
        assertEquals(val, object.getValue(cls.getField("value")));
    }

    @Test
    public void testAsMapValue() throws BucketNotFound, SchemaNotCompatible {
        // collections in collections arn't supported
        if (genericArgs.length > 0)
            return;

        ClassHolder map = new ClassHolder(new Bucket(holder.getBucket().getName() + "AsMapValues"), false);

        map.init(new ClassFieldHolder[] {
            new ClassFieldHolder("value", ClassMapping.MAP, ClassMapping.STRING, fieldType)
        });

        OrestesClass cls = (OrestesClass) schema.add(map);
        OrestesObject object = new OrestesObject(cls);

        Map<String, Object> val = new HashMap<>();
        val.put("test1", value);
        val.put("test2", defaultValue);
        val.put("test3", value);

        object.setValue(cls.getField("value"), val);

        object = client.store(object);
        assertEquals(val, object.getValue(cls.getField("value")));

        object = client.load(object.getId());
        assertEquals(val, object.getValue(cls.getField("value")));
    }

    @Test
    public void testAsMapKey() throws BucketNotFound, SchemaNotCompatible {
        // collections in collections arn't supported
        if (genericArgs.length > 0)
            return;

        ClassHolder map = new ClassHolder(new Bucket(holder.getBucket().getName() + "AsMapKeys"), false);

        map.init(new ClassFieldHolder[] {
            new ClassFieldHolder("value", ClassMapping.MAP, fieldType, ClassMapping.STRING)
        });

        OrestesClass cls = (OrestesClass) schema.add(map);
        OrestesObject object = new OrestesObject(cls);

        Map<Object, String> val = new HashMap<>();
        val.put(value, "test1");
        val.put(defaultValue, "test2");
        val.put(value, "test3");

        object.setValue(cls.getField("value"), val);

        object = client.store(object);
        assertEquals(val, object.getValue(cls.getField("value")));

        object = client.load(object.getId());
        assertEquals(val, object.getValue(cls.getField("value")));
    }

    @Test
    public void testAsEmbeddedValue() throws BucketNotFound, SchemaNotCompatible {
        ClassHolder wrapper = new ClassHolder(new Bucket(holder.getBucket().getName() + "EmbeddedWrapper"), false);
        ClassHolder embedded = new ClassHolder(new Bucket(holder.getBucket().getName() + "Embedded"), true);

        wrapper.init(new ClassFieldHolder[] {
            new ClassFieldHolder("embedded", embedded.getBucket())
        });

        embedded.init(new ClassFieldHolder[] {
            new ClassFieldHolder("value", fieldType, genericArgs)
        });

        schema.addAll(Arrays.asList(wrapper, embedded));
        OrestesClass w = (OrestesClass) schema.get(wrapper.getBucket());
        OrestesClass e = (OrestesClass) schema.get(embedded.getBucket());

        OrestesObject object = new OrestesObject(w);
        OrestesObject val = new OrestesObject(e);
        val.setValue(e.getField("value"), value);
        object.setValue(w.getField("embedded"), val);

        object = client.store(object);

        val = (OrestesObject) object.getValue(w.getField("embedded"));
        assertNotNull(val);
        assertEquals(value, val.getValue(e.getField("value")));

        object = client.load(object.getId());

        val = (OrestesObject) object.getValue(w.getField("embedded"));
        assertNotNull(val);
        assertEquals(value, val.getValue(e.getField("value")));
    }

    private void assertFieldEquals(DBClassField field, Bucket type, Bucket... genericParamaters)
    throws BucketNotFound {
        assertSame(schema.get(type), field.getTypeSchema());

        assertEquals(field.getGenericParamaterSchemas().length, genericParamaters.length);

        int count = 0;
        for (Bucket param : genericParamaters) {
            assertSame(schema.get(param), field.getGenericParamaterSchemas()[count++]);
        }
    }
}*/
