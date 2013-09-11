jspa.collection.List = jspa.collection.Collection.inherit({
	get: function(index) {
		jspa.util.State.readAccess(this);
		return this.superCall(index);
	},
	
	set: function(index, value) {
		jspa.util.State.writeAccess(this);
		this.superCall(index, value);
	},
	
	indexOf: function(value) {
		jspa.util.State.readAccess(this);
		return this.superCall(value);
	},
	
	lastIndexOf: function(value) {
		jspa.util.State.readAccess(this);
		return this.superCall(value);
	}
});