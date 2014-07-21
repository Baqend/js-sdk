var Collection = require('./Collection').Collection;
var State = require('../util').State;

exports.Map = Collection.inherit({
	hasKey: function(key) {
		State.readAccess(this);
		return this.superCall(key);
	},
	
	hasValue: function(value) {
		State.readAccess(this);
		return this.superCall(value);
	},
	
	get: function(key) {
		State.readAccess(this);
		return this.superCall(key);
	},
	
	set: function(key, value) {
		State.writeAccess(this);
		this.superCall(key, value);
	},
	
	removeKey: function(key) {
		State.writeAccess(this);
		this.superCall(key);
	},
	
	removeValue: function(value) {
		State.writeAccess(this);
		this.superCall(value);
	},
	
	keys: function() {
		State.readAccess(this);
		return this.superCall();
	}
});
