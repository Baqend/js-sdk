var Collection = require('./Collection').Collection;
var State = require('../util').State;

exports.List = Collection.inherit({
	get: function(index) {
		State.readAccess(this);
		return this.superCall(index);
	},
	
	set: function(index, value) {
		State.writeAccess(this);
		this.superCall(index, value);
	},
	
	indexOf: function(value) {
		State.readAccess(this);
		return this.superCall(value);
	},
	
	lastIndexOf: function(value) {
		State.readAccess(this);
		return this.superCall(value);
	}
});