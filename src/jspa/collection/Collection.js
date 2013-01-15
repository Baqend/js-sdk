jspa.collection.Collection = Trait.inherit({
	
	__jspaEntity__: null,
	
	size: {
		get: function() {
			jspa.util.State.readAccess(this.__jspaEntity__);
			return this._size;
		}, 
		set: function(value) {
			this._size = value;
		}
	},
	
	has: function(element) {
		jspa.util.State.readAccess(this.__jspaEntity__);
		return this.superCall(element);
	},
	
	add: function(element) {
		jspa.util.State.writeAccess(this.__jspaEntity__);
		this.superCall(element);
	},
	
	remove: function(element) {
		jspa.util.State.writeAccess(this.__jspaEntity__);
		this.superCall(element);
	},
	
	items: function() {
		jspa.util.State.readAccess(this.__jspaEntity__);
		return this.superCall();
	},
	
	iterator: function() {
		jspa.util.State.readAccess(this.__jspaEntity__);
		return this.superCall();
	},
	
	toString: function() {
		jspa.util.State.readAccess(this.__jspaEntity__);
		return this.superCall();
	},
	
	toJSON: function() {
		jspa.util.State.readAccess(this.__jspaEntity__);
		return this.superCall();
	}
});