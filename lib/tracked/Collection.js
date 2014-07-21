var State = require('../util').State;

exports.Collection = Trait.inherit({
    size: {
        get: function() {
            State.readAccess(this);
            return this._size;
        },
        set: function(value) {
            this._size = value;
        }
    },

    has: function(element) {
        State.readAccess(this);
        return this.superCall(element);
    },

    add: function(element) {
        State.writeAccess(this);
        this.superCall(element);
    },

    remove: function(element) {
        State.writeAccess(this);
        this.superCall(element);
    },

    items: function() {
        State.readAccess(this);
        return this.superCall();
    },

    iterator: function() {
        State.readAccess(this);
        return this.superCall();
    },

    toString: function() {
        State.readAccess(this);
        return this.superCall();
    },

    toJSON: function() {
        State.readAccess(this);
        return this.superCall();
    }
});