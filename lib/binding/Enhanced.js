var error = require('../error');
var Metadata = require('../util/Metadata').Metadata;

var Enhanced;

exports.Enhanced = Enhanced = /** @lends jspa.binding.Enhanced.prototype */ {

  _metadata: {
    get: function() {
      Object.defineProperty(this, '_metadata', {
        value: new Metadata(this),
        configurable: true
      });
      return this._metadata;
    },
    configurable: true
  },

  attach: {
    value: function(db) {
      db.addReference(this);
    }
  },

  save: {
    value: function(depth, doneCallback, failCallback) {
      return this._metadata.db.save(this, false, depth ? depth : 0, doneCallback, failCallback);
    }
  },

  saveAndRefresh: {
    value: function(depth, doneCallback, failCallback) {
      return this._metadata._db.save(this, true, depth ? depth : 0, doneCallback, failCallback);
    }
  },

  insert: {
    value: function(depth, doneCallback, failCallback) {
      return this._metadata.db.insert(this, false, depth ? depth : 0, doneCallback, failCallback);
    }
  },

  insertAndRefresh: {
    value: function(depth, doneCallback, failCallback) {
      return this._metadata.db.insert(this, true, depth ? depth : 0, doneCallback, failCallback);
    }
  },

  update: {
    value: function(depth, doneCallback, failCallback) {
      return this._metadata.db.update(this, false, depth ? depth : 0, doneCallback, failCallback);
    }
  },

  updateAndRefresh: {
    value: function(depth, doneCallback, failCallback) {
      return this._metadata.db.update(this, true, depth ? depth : 0, doneCallback, failCallback);
    }
  },

  refresh: {
    value: function(depth, doneCallback, failCallback) {
      return this._metadata.db.refresh(this, depth ? depth : 0, doneCallback, failCallback);
    }
  },

  remove: {
    value: function(depth, doneCallback, failCallback) {
      return this._metadata.db.remove(this, depth ? depth : 0, doneCallback, failCallback);
    }
  },

  attr: {
    value: function() {
      throw new Error("Attr is not yet implemented.");
    }
  }
};