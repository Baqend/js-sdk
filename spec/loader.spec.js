if (typeof window != "undefined") {
  xdescribe('Test sdk loader', function() {
    var testLoader, db, pageJspa, personClass;
    before(function(done) {
      testLoader = document.createElement('iframe');
      testLoader.src = '/build/test-loader.html';

      var deferred = jspa.Q.defer();
      testLoader.load = function() {
        db = testLoader.contentWindow.DB;
        pageJspa = testLoader.contentWindow.jspa;
        db.ready(function() {
          deferred.resolve();
        });
      };

      document.body.appendChild(testLoader);

      return deferred.promise.then(function() {

        db.TestAppPerson = personClass = function(name, age) {
          this.name = name;
          this.age = age;
        };
      });
    });

    after(function() {
      document.body.removeChild(testLoader);
    });

    it('should init the sdk', function() {
      expect(pageJspa).be.ok;
      expect(db instanceof pageJspa.EntityManager);
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
        var emf = new jspa.EntityManagerFactory(env.TEST_SERVER);
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