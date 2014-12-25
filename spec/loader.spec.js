if (typeof window != "undefined") {
  xdescribe('Test sdk loader', function() {
    var testLoader, db, pageJspa, personClass;
    before(function() {
      var basePath = document.querySelector('script[src*="/baqend."]').src;
      basePath = basePath.substring(0, basePath.lastIndexOf('/') + 1);

      var emf = new baqend.EntityManagerFactory(env.TEST_SERVER);
      var metamodel = emf.metamodel;
      metamodel.init();

      var TestAppPerson = new baqend.metamodel.EntityType("TestAppPerson", metamodel.entity(Object));
      TestAppPerson.addAttribute(new baqend.metamodel.SingularAttribute("name", metamodel.baseType(String)));
      TestAppPerson.addAttribute(new baqend.metamodel.SingularAttribute("age", metamodel.baseType(Number)));
      metamodel.addType(TestAppPerson);

      return metamodel.save().then(function() {
        testLoader = document.createElement('iframe');
        testLoader.src = basePath + 'test-loader.html';

        var promise = new Promise(function(resolve) {
          testLoader.onload = function() {
            expect(testLoader.contentWindow.baqend).be.undefined;
            db = testLoader.contentWindow.DB;
            db.connect(env.TEST_SERVER);
            db.ready(function() {
              pageJspa = testLoader.contentWindow.baqend;
              db = testLoader.contentWindow.DB;
              resolve();
            });
          };
        });

        document.body.appendChild(testLoader);

        return promise.then(function() {
          db.TestAppPerson = personClass = function(name, age) {
            this.name = name;
            this.age = age;
          };
        });
      });
    });

    after(function() {
      document.body.removeChild(testLoader);
    });

    it('should init the sdk', function() {
      expect(pageJspa).be.ok;
      expect(db instanceof pageJspa.EntityManager).be.true;
      expect(db.TestAppPerson).be.ok;
    });

    it('should add a test class', function() {
      var person = new db.TestAppPerson("Alice", 34);

      expect(pageJspa.binding.Entity.isInstance(person)).be.true;
      expect(person.name).equals('Alice');
      expect(person.age).equals(34);
    });

    it('should communicate with the server', function() {
      var person = new db.TestAppPerson("Alice", 34);
      return person.insert().then(function() {
        person.name = 'Bob';

        return person.save();
      }).then(function() {
        var emf = new baqend.EntityManagerFactory(env.TEST_SERVER);
        return emf.createEntityManager().then(function(db) {
          return db.find(person._metadata.ref).then(function(obj) {
            expect(person.name).equals('Bob');
            expect(person.age).equals(34);
          })
        });
      });
    })


  });
}