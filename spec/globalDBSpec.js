if (typeof window != "undefined") {

  describe('Global DB', function() {
    before(function() {
      expect(DB).be.ok;

      return DB.connect(env.TEST_SERVER, function(localDb) {
        expect(localDb).equal(DB);
        expect(localDb).instanceof(jspa.EntityManager);
      });
    });

    it('should allow to add an callback to global DB object', function() {
      return DB.ready(function(localDb) {
        expect(localDb).equal(DB);
        expect(localDb).instanceof(jspa.EntityManager);
      });
    });

    it('should only create one instance', function() {
      expect(function() {
        DB.connect(env.TEST_SERVER);
      }).throw(Error);
    });
  })
}