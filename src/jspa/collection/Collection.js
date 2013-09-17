jspa.collection.Collection = Trait.inherit({

    size: {
        get: function() {
            jspa.util.State.readAccess(this);
            return this._size;
        },
        set: function(value) {
            this._size = value;
        }
    },

    has: function(element) {
        jspa.util.State.readAccess(this);
        return this.superCall(element);
    },

    add: function(element) {
        jspa.util.State.writeAccess(this);
        this.superCall(element);
    },

    remove: function(element) {
        jspa.util.State.writeAccess(this);
        this.superCall(element);
    },

    items: function() {
        jspa.util.State.readAccess(this);
        return this.superCall();
    },

    iterator: function() {
        jspa.util.State.readAccess(this);
        return this.superCall();
    },

    toString: function() {
        jspa.util.State.readAccess(this);
        return this.superCall();
    },

    toJSON: function() {
        jspa.util.State.readAccess(this);
        return this.superCall();
    }
});