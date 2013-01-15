var util = {};

if (typeof module !== 'undefined') {	
	module.exports = util;
}
	
util.EventTarget = Trait.inherit({
	/**
	 * @constructor
	 * @memberOf util.EventTarget
	 */
	initialize: function() {
		this.eventListeners = [{}, {}];
	},
	
	addEventListener: function(type, listener, useCapture) {
		var eventListeners = this.eventListeners[Number(!useCapture)][type];
		if (!eventListeners) {
			this.eventListeners[Number(!useCapture)][type] = [listener];
		} else if (eventListeners.indexOf(listener) == -1) {			
			eventListeners.push(listener);
		}
	},
	
	removeEventListener: function(type, listener, useCapture) {
		var eventListeners = this.eventListeners[Number(!useCapture)][type];
		if (eventListeners) {
			var index = eventListeners.indexOf(listener);
			if (index != -1) {				
				eventListeners.splice(index, 1);
			}
		}
	},
	
	/**
	 * 
	 * @param {Event} evt
	 * @returns {Boolean}
	 */
	dispatchEvent: function(evt) {
		if (!evt.isInstanceOf(util.Event))
			throw new TypeError('evt object is not an instance of util.Event');
		
		if (evt.eventPhase == util.Event.NONE) {
			evt.target = this;
			evt.eventPhase = util.Event.CAPTURING_PHASE;
			
			this.callEventListeners.apply(this, arguments);
			
			evt.eventPhase = util.Event.NONE;
		}
		
		return !evt.defaultPrevented;
	},
	
	/**
	 * 
	 * @param {Event} evt
	 * @param {Boolean} useCapture
	 * @returns {Boolean}
	 */
	callEventListeners: function(evt, args) {
		if (evt.eventPhase === util.Event.NONE)
			return; //event is not init
		
		//handle capturing phase
		if (this.parent && evt.eventPhase == util.Event.CAPTURING_PHASE)
			this.parent.callEventListeners(evt);
			
		if (!evt.propagationStopped) {	
			evt.currentTarget = this;
			
			if (evt.target == this)
				evt.eventPhase = util.Event.AT_TARGET; 
			
			if (evt.eventPhase <= util.Event.AT_TARGET) {				
				var eventListeners = this.eventListeners[0][evt.type];
				if (eventListeners) {			
					for (var i = 0, l; (l = eventListeners[i]) && !evt.propagationImmediateStopped; ++i) {				
						l.apply(this, arguments);
					}
				}
			}
			
			if (evt.eventPhase >= util.Event.AT_TARGET) {				
				var eventListeners = this.eventListeners[1][evt.type];
				if (eventListeners) {			
					for (var i = 0, l; (l = eventListeners[i]) && !evt.propagationImmediateStopped; ++i) {				
						l.apply(this, arguments);
					}
				}
			}
			
			if (evt.target == this && evt.bubbles)
				evt.eventPhase = util.Event.BUBBLING_PHASE; 
			
			evt.currentTarget = null;
			
			//handle bubble phase
			if (this.parent && evt.eventPhase == util.Event.BUBBLING_PHASE)
				this.parent.callEventListeners(evt);
		}
	},
	
	on: function(eventName, listener, useCapture) {
		this.addEventListener(eventName, listener, useCapture);
	},
	
	off: function(eventName, listener, useCapture) {
		this.removeEventListener(eventName, listener, useCapture);
	},
	
	one: function(eventName, listener, useCapture) {
		this.on(eventName, function temp() {
			this.off(eventName, temp, useCapture);
			listener.apply(this, arguments);
		}, useCapture);
	},
	
	trigger: function(eventOrName) {
		if (eventOrName.isInstanceOf(String)) {
			var evt = new util.Event();
			evt.initEvent(eventOrName, true, true);
			eventOrName = evt;
		}
		
		return this.dispatchEvent.apply(this, arguments);
	}
});

util.Event = Trait.inherit({
	extend: {
		NONE: 0,
		CAPTURING_PHASE: 1,
		AT_TARGET: 2,
		BUBBLING_PHASE: 3
	},
	
	eventPhase: 0,
	
	/**
	 * @constructor
	 * @memberOf util.Event
	 * @param {String} type
	 * @param {Boolean} bubbles
	 * @param {Boolean} cancelable
	 */
	initEvent: function(type, bubbles, cancelable) {
		if (this.eventPhase == util.Event.NONE) {			
			this.type = type;
			this.bubbles = Boolean(bubbles);
			this.cancelable = Boolean(cancelable);
			
			this.target = null;
			this.currentTarget = null;
			this.timeStamp = new Date();
			this.defaultPrevented = false;
			this.propagationStopped = false;
			this.propagationImmediateStopped = false;
			this.isTrusted = false;
		}
	},
	
	stopPropagation: function() {
		this.propagationStopped = true;
	},
	
	stopImmediatePropagation: function() {
		this.propagationStopped = true;
		this.propagationImmediateStopped = true;
	},
	
	preventDefault: function() {
		if (this.cancelable) {
			this.defaultPrevented = true;
		}
	}
});

util.StopIteration = Error.inherit({
	initialize: function() {
		this.superCall('No such element');
	}
});

util.Iterator = Trait.inherit({
	extend: {
		conv: function(obj) {
			if (obj) {
				if (obj.items && obj.items.isInstanceOf(Function)) {
					return obj.items();
				} else if (obj.isInstanceOf(Array)) {
					return new util.IndexIterator(obj.length, function(index) {
						return [index, obj[index]];
					});
				} else {
					return new util.PropertyIterator(obj);
				}
			}
		}
	},
	
	StopIteration: new util.StopIteration(),
	hasNext: false,
	
	iterator: function() {
		return this;
	},
	
	next: function() {
		throw this.StopIteration;
	}
});

util.IndexIterator = Object.inherit(util.Iterator, {
	initialize: function(length, accessor) {
		this.length = length;
		this.index = 0;
		
		this.hasNext = this.index < this.length;
		
		if (accessor)
			this.accessor = accessor;
	},
	next: function() {
		if (!this.hasNext)
			throw this.StopIteration;
		
		var value = this.accessor(this.index);
		this.hasNext = ++this.index < this.length;
		
		return value;
	}
});

util.PropertyIterator = util.IndexIterator.inherit({
	initialize: function(obj) {
		this.obj = obj;
		this.names = Object.getOwnPropertyNames(obj);
	},
	accessor: function(index) {
		if (this.names.length >= index)
			throw this.StopIteration;
		
		var name = this.names[index];
		return [name, this.object[name]];
	}
});

util.Iterable = Trait.inherit({
	forEach: function(callback, thisArg) {
	    if (!callback || !callback.isInstanceOf(Function)) {
	    	throw new TypeError(callback + ' is not a function');
	    }
	    
	    for (var iter = util.Iterator(this); iter.hasNext; ) {
	    	var item = iter.next();
	    	
	        callback.call(thisArg, item[1], item[0], this);
	    }
	},
	
	every: function(callback, thisArg) {
	    if (!callback || !callback.isInstanceOf(Function)) {
	    	throw new TypeError(callback + ' is not a function');
	    }
	    
		for (var iter = util.Iterator(this); iter.hasNext; ) {
	    	var item = iter.next();
	    	
	    	if (!callback.call(thisArg, item[1], item[0], this))
	    		return false;
	    }
	 
	    return true;
	},
	
	some: function(callback, thisArg) {
	    if (!callback || !callback.isInstanceOf(Function)) {
	    	throw new TypeError(callback + ' is not a function');
	    }
	    
		for (var iter = util.Iterator(this); iter.hasNext; ) {
	    	var item = iter.next();
	    	
	    	if (callback.call(thisArg, item[1], item[0], this))
	    		return true;
	    }
		
	    return false;
	},
	
	filter: function(callback, thisArg) {
	    if (!callback || !callback.isInstanceOf(Function)) {
	    	throw new TypeError(callback + ' is not a function');
	    }
	    
		var result = new this.constructor();
		for (var iter = util.Iterator(this); iter.hasNext; ) {
	    	var item = iter.next();
	    	
	    	if (callback.call(thisArg, item[1], item[0], this)) {	    		
	    		if (result.set) {
		    		result.set(item[0], item[1]);
		    	} else {	    		
		    		result.add(item[1]);
		    	}
	    	}
	    }
	 
	    return result;
	},
	
	map: function(callback, thisArg) {
	    if (!callback || !callback.isInstanceOf(Function)) {
	    	throw new TypeError(callback + ' is not a function');
	    }
	    
		var result = new this.constructor();
		for (var iter = util.Iterator(this); iter.hasNext; ) {
	    	var item = iter.next();
	    	
	    	item = callback.call(thisArg, item[1], item[0], this);
	    	if (result.set) {
	    		result.set(item[0], item[1]);
	    	} else {	    		
	    		result.add(item[1]);
	    	}
	    }
	 
	    return result;
	},
	
	reduce: function(callback, previousValue) {
	    if (!callback || !callback.isInstanceOf(Function)) {
	    	throw new TypeError(callback + ' is not a function');
	    }
	    
	    var iter = util.Iterator(this);
	    if (arguments.length == 1) {
	    	previousValue = iter.next()[1];
	    }
	    
		while (iter.hasNext) {
	    	item = iter.next();
	    	
	    	previousValue = callback.call(null, previousValue, item[1], item[0], this);
	    }
	 
	    return previousValue;
	}
});

util.Collection = Object.inherit(util.Iterable, {
	extend: {
		conv: function(items) {
			if (items) {
				if (items.isInstanceOf(Array)) {
					var col = new this();
					for (var i = 0, len = items.length; i < len; ++i) {
						col.add(items[i]);
					}
					
					return col;
				} else if (items.isInstanceOf(util.Collection)) {
					return new this(items);
				}
			}
			
			return null;
		}
	},
	
	size: 0,
		
	initialize: function(collection) {
		this.seq = [];
		if (collection) {
			for (var iter = collection.iterator(); iter.hasNext; ) {	
		    	this.add(iter.next());
		    }
		}
	},
	
	has: function(element) {
		return this.seq.indexOf(element) != -1;
	},
	
	add: function(element) {
		this.seq[this.size++] = element;	
	},
	
	remove: function(element) {
		var index = this.seq.indexOf(element);
		if (index > -1) {
			this.seq.splice(index, 1);
			this.size--;
		}
	},
	
	items: function() {
		var seq = this.seq;
		return new util.IndexIterator(this.size, function(index) {
			return [index, seq[index]];
		});
	},
	
	iterator: function() {
		var seq = this.seq;
		return new util.IndexIterator(this.size, function(index) {
			return seq[index];
		});
	},
	
	toString: function() {
		return this.seq.toString();
	},
	
	toJSON: function() {
		return this.seq;
	}
});

util.List = util.Collection.inherit({
	extend: {
		conv: util.Collection.conv
	},
	
	get: function(index) {
		if (index < 0) {
			index = this.size + index;
		}
		
		if (index >= 0 && index < this.size) {
			return this.seq[index];
		}
	},
	
	set: function(index, value) {
		if (index < 0) {
			index = this.size + index;
		}
		
		if (index < 0) {
			this.seq.unshift(value);
			this.size++;
		} else if (index >= this.size) {
			this.seq.push(value);
			this.size++;
		} else {
			this.seq[index] = value;			
		}
		
	},
	
	indexOf: function(value) {
		return this.seq.indexOf(value);
	},
	
	lastIndexOf: function(value) {
		return this.seq.lastIndexOf(value);
	}
});

util.Set = util.Collection.inherit({
	extend: {
		conv: util.Collection.conv
	},
	
	add: function(value) {
		var index = this.seq.indexOf(value);
		if (index < 0) {
			this.seq[this.size++] = value;
		}		
	}
});

util.Map = util.Collection.inherit({
	extend: {
		conv: function(items) {
			if (items) {
				if (items.isInstanceOf(Array)) {					
					var map = new this();
					for (var i = 0, item; item = items[i]; ++i) {
						if ('key' in item && 'value' in item) {
							map.set(item['key'], item['value']);
						} else {
							break;
						}
					}
					
					if (map.size == items.length)
						return map;
				} else if (items.isInstanceOf(util.Collection)) {
					return new this(items);
				}
			}
			
			return null;
		}
	},
	
	initialize: function(collection) {
		this.vals = [];
		
		if (collection && collection.isInstanceOf(Map)) {
			this.superCall();
			for (var iter = collection.items(); iter.hasNext; ) {
				var item = iter.next();
				this.set(item[0], item[1]);
			}
		} else {			
			this.superCall(collection);
		}
	},
	
	get: function(key) {
		var index = this.seq.indexOf(key);
		if (index > -1) {
			return this.vals[index];
		}
	},
	
	add: function(key) {
		this.set(key);
	},
	
	set: function(key, value) {
		var index = this.seq.indexOf(key);
		if (index < 0) {
			index = this.seq.length;
			this.seq[index] = key;
			this.size++;
		}
		
		this.vals[index] = value;
	},
	
	remove: function(key) {
		var index = this.seq.indexOf(key);
		if (index > -1) {
			this.seq.splice(index, 1);
			this.vals.splice(index, 1);
			this.size--;
		}
	},
	
	items: function() {
		var map = this;
		return new util.IndexIterator(this.size, function(index) {
			return [map.seq[index], map.vals[index]];
		});
	},
	
	keys: function() {
		return this.iterator();
	},
	
	values: function() {
		var map = this;
		return new util.IndexIterator(this.size, function(index) {
			return map.seq[index];
		});
	},
	
	toString: function() {
		var str = '';
		for (var i = 0, len = this.size; i < len; ++i) {
			if (str != '')
				str += ', ';
			
			str += this.seq[i];
			str += ': ';
			str += this.vals[i];
		}
		return '[' + str + ']'; 
	},
	
	toJSON: function() {
		var map = [];
		for (var i = 0, len = this.size; i < len; ++i) {
			map.push({
				key: this.seq[i],
				value: this.vals[i]
			});
		}
		return map;
	}
});
