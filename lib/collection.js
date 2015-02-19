/**
 * @namespace baqend.collection
 */

var Metadata = require('./util/Metadata');
var Iterator, IndexIterator, PropertyIterator, Iterable, Collection, List, Set, Map;

/**
 * @typedef {Object} baqend.collection.Iterator.Item
 * @property {Boolean} done Indicates if the iterator has no more elements
 * @property {*} value Tha actual iterated element
 */

/**
 * @mixin baqend.collection.Iterator
 */
exports.Iterator = Iterator = Trait.inherit( /** @lends baqend.collection.Iterator.prototype */ {
  /** @lends baqend.collection.Iterator */
  extend: {
    conv: function(obj) {
      if (obj) {
        if (obj.iterator && Function.isInstance(obj.iterator)) {
          return obj.iterator();
        } else if (Array.isInstance(obj)) {
          return new IndexIterator(obj.length, function(index) {
            return [index, obj[index]];
          });
        } else {
          return new PropertyIterator(obj);
        }
      }
    },

    /**
     * @type baqend.collection.Iterator.Item
     */
    DONE: {done: true}
  },

  /**
   * Returns this instance
   * @returns {baqend.collection.Iterator} this iterator instance
   */
  iterator: function() {
    return this;
  },

  /**
   * Gets the next item or throws a StopIteration error if there are no more elements left
   * @return {baqend.collection.Iterator.Item} The next item
   */
  next: function() {
    return Iterator.DONE;
  }
});

/**
 * @class baqend.collection.IndexIterator
 * @mixes baqend.collection.Iterator
 */
exports.IndexIterator = IndexIterator = Object.inherit(Iterator, /** @lends baqend.collection.IndexIterator.prototype */ {
  length: 0,
  index: 0,

  /**
   * @type Function
   */
  accessor: null,

  initialize: function(length, accessor) {
    this.length = length;

    if (accessor)
      this.accessor = accessor;
  },

  /**
   * Gets the next item
   * @return {baqend.collection.Iterator.Item} The next item
   */
  next: function() {
    if (this.index < this.length) {
      var result = {done: false, index: this.index, value: this.accessor(this.index)}
      this.index++;
      return result;
    } else {
      return Iterator.DONE;
    }
  }
});

/**
 * @class baqend.collection.PropertyIterator
 * @mixes baqend.collection.Iterator
 */
exports.PropertyIterator = PropertyIterator = Iterator.inherit(/** baqend.collection.PropertyIterator.prototype */ {
  names: null,
  object: null,
  index: 0,

  initialize: function(object) {
    this.object = object;
    this.names = Object.getOwnPropertyNames(object);
  },

  next: function() {
    if (this.names.length < this.index) {
      var name = this.names[this.index++];
      return {done: false, index: name, value: this.object[name]};
    } else {
      return Iterator.DONE;
    }
  }
});

/**
 * @mixin baqend.collection.Iterable
 */
exports.Iterable = Iterable = Trait.inherit( /** @lends baqend.collection.Iterable.prototype */ {
  /**
   * Executes a provided function once per array element.
   * @param {Function} callback Function to execute for each element.
   * @param {*} thisArg Value to use as this when executing callback.
   */
  forEach: function(callback, thisArg) {
    if (!callback || !Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    for (var iter = Iterator(this), item = iter.next(); !item.done; item = iter.next()) {
      callback.call(thisArg, item.value, item.index, this);
    }
  },

  /**
   * Tests whether all elements in the array pass the test implemented by the provided function.
   * @param {Function} callback Function to test for each element.
   * @param {*} thisArg Value to use as this when executing callback.
   * @returns {boolean} true if all elements in the array pass the test
   */
  every: function(callback, thisArg) {
    if (!callback || !Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    for (var iter = Iterator(this), item = iter.next(); !item.done; item = iter.next()) {
      if (!callback.call(thisArg, item.value, item.index, this))
        return false;
    }

    return true;
  },

  /**
   * Tests whether some element in the array passes the test implemented by the provided function.
   * @param {Function} callback Function to test for each element.
   * @param {*} thisArg Value to use as this when executing callback.
   * @returns {boolean} true if some element in the array passes the test
   */
  some: function(callback, thisArg) {
    if (!Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    for (var iter = Iterator(this), item = iter.next(); !item.done; item = iter.next()) {
      if (callback.call(thisArg, item.value, item.index, this))
        return true;
    }

    return false;
  },

  /**
   * Creates a new instance of this object with all elements that pass the test implemented by the provided function.
   * @param {Function} callback Function to test each element of the array.
   * @param {*} thisArg Value to use as this when executing callback.
   * @returns {*} A new instance of this object with all elements that pass the test
   */
  filter: function(callback, thisArg) {
    if (!Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    var result = new this.constructor();
    for (var iter = Iterator(this), item = iter.next(); !item.done; item = iter.next()) {
      if (callback.call(thisArg, item.value, item.index, this)) {
        if (result.set) {
          result.set(item.index, item.value);
        } else {
          result.add(item.value);
        }
      }
    }

    return result;
  },

  /**
   * Creates a new instance of this object with the results of calling a provided function on every element in this array.
   * @param {Function} callback Function that produces an element of the new object
   * @param {*} thisArg Value to use as this when executing callback.
   * @returns {*} A new instance of this object with the results
   */
  map: function(callback, thisArg) {
    if (!Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    var result = new this.constructor();
    for (var iter = Iterator(this), item = iter.next(); !item.done; item = iter.next()) {
      item = callback.call(thisArg, item.value, item.index, this);
      if (result.set) {
        result.set(item.index, item.value);
      } else {
        result.add(item.value);
      }
    }

    return result;
  },

  /**
   * Applies a function against an accumulator and each element
   * (from left-to-right) has to reduce it to a single value.
   * @param {Function} callback Function to execute on each element
   * @param {*} previousValue Object to use as the first argument to the first call of the callback.
   * @returns {*}
   */
  reduce: function(callback, previousValue) {
    if (!Function.isInstance(callback)) {
      throw new TypeError(callback + ' is not a function');
    }

    var iter = Iterator(this);
    if (arguments.length == 1) {
      previousValue = iter.next().value;
    }

    var item;
    while (!(item = iter.next()).done) {
      previousValue = callback.call(null, previousValue, item.value, item.index, this);
    }

    return previousValue;
  }
});

/**
 * @class baqend.collection.Collection
 * @extends baqend.collection.Iterable
 *
 * @param {Array|baqend.collection.Collection=} collection
 */
exports.Collection = Collection = Object.inherit(Iterable, /** @lends baqend.collection.Collection.prototype */ {
  size: 0,
  seq: [],

  extend: {
    conv: function(collection) {
      if (Array.isInstance(collection) || Collection.isInstance(collection)) {
        return new this(collection);
      }

      return null;
    }
  },

  initialize: function(collection) {
    this.seq = [];
    this.size = 0;

    if (Array.isInstance(collection)) {
      for (var i = 0, len = collection.length; i < len; ++i) {
        this.add(collection[i]);
      }
    } else if (Collection.isInstance(collection)) {
      for (var iter = collection.iterator(), item = iter.next(); !item.done; item = iter.next()) {
        this.add(item.value);
      }
    }
  },

  /**
   * Indicates if this collection contains the element
   * @param element The element to test
   * @returns {boolean} true if the collection contains the element
   */
  has: function(element) {
    Metadata.readAccess(this);
    return this.seq.indexOf(element) != -1;
  },

  /**
   * Add a alement to the collection
   * @param element The element to add
   */
  add: function(element) {
    Metadata.writeAccess(this);
    this.seq[this.size++] = element;
  },

  /**
   * Removes teh element form the collection
   * @param element The element to remove
   */
  remove: function(element) {
    Metadata.writeAccess(this);
    var index = this.seq.indexOf(element);
    if (index > -1) {
      this.seq.splice(index, 1);
      this.size--;
    }
  },

  /**
   * Gets an iterator over the elements of the collection
   * @returns {baqend.collection.IndexIterator} An iterator over the elements
   */
  items: function() {
    Metadata.readAccess(this);
    var seq = this.seq;
    return new IndexIterator(this.size, function(index) {
      return seq[index];
    });
  },

  /**
   * Gets an iterator over the elements of the collection
   * @returns {baqend.collection.IndexIterator} An iterator over the elements
   */
  iterator: function() {
    Metadata.readAccess(this);
    return this.items();
  },

  toString: function() {
    Metadata.readAccess(this);
    return this.seq.toString();
  },

  toJSON: function() {
    Metadata.readAccess(this);
    return this.seq;
  }
});

/**
 * Creates a new List instance
 * @class baqend.collection.List
 * @extends baqend.collection.Collection
 *
 * @param {Array|baqend.collection.Collection=} collection
 */
exports.List = List = Collection.inherit(/** @lends baqend.collection.List.prototype */ {
  extend: {
    conv: Collection.conv
  },

  /**
   * Get the value by index
   * @param index The index
   * @returns {*} The value of the index
   */
  get: function(index) {
    Metadata.readAccess(this);
    if (index < 0) {
      index = this.size + index;
    }

    if (index >= 0 && index < this.size) {
      return this.seq[index];
    }
  },

  /**
   * Sets the value at index
   * @param index The index
   * @param value The new value
   */
  set: function(index, value) {
    Metadata.writeAccess(this);
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

  /**
   * Gets the index of an value
   * @param value The value to search
   * @returns {*} The index of the value, or -1 if the value was not found
   */
  indexOf: function(value) {
    Metadata.readAccess(this);
    return this.seq.indexOf(value);
  },

  /**
   * Gets the last index of the value
   * @param value The value to search
   * @returns {*} The last index of the value, or -1 if teh value was not found
   */
  lastIndexOf: function(value) {
    Metadata.readAccess(this);
    return this.seq.lastIndexOf(value);
  }
});

/**
 * @class baqend.collection.Set
 * @extends baqend.collection.Collection
 *
 * @param {Array|baqend.collection.Collection=} collection
 */
exports.Set = Set = Collection.inherit(/** @lends baqend.collection.Set.prototype */ {
  extend: {
    conv: Collection.conv
  },

  /**
   * Adds the element ot the collection, if the collection doesn't contain the element
   * @param value The value to add
   */
  add: function(value) {
    Metadata.readAccess(this);
    var index = this.seq.indexOf(value);
    if (index < 0) {
      this.seq[this.size++] = value;
    }
  }
});

/**
 * @class baqend.collection.Map
 * @extends baqend.collection.Collection
 *
 * @param {Array|baqend.collection.Collection=} collection
 */
exports.Map = Map = Collection.inherit(/** @lends baqend.collection.Map.prototype */ {
  /** @lends baqend.collection.Map */
  extend: {
    /**
     * @class baqend.collection.Map.Iterator
     * @mixes baqend.collection.Iterator
     */
    Iterator: Object.inherit(Iterator, /** @lends baqend.collection.Map.Iterator.prototype */ {
      index: 0,
      map: null,

      initialize: function(map) {
        this.map = map;
      },

      next: function() {
        if (this.index < this.map.size) {
          var index = this.index++;
          return {done: false, index: this.map.seq[index], value: this.map.vals[index]};
        } else {
          return Iterator.DONE;
        }
      }
    }),

    conv: Collection.conv
  },

  initialize: function(collection) {
    this.vals = [];

    if (Array.isInstance(collection)) {
      for (var i = 0, item; item = collection[i]; ++i) {
        if ('key' in item && 'value' in item) {
          this.set(item['key'], item['value']);
        } else {
          throw new Error('No key value pair at index ' + i);
        }
      }
    } else if (Collection.isInstance(collection)) {
      for (var iter = collection.items(), item = iter.next(); !item.done; item = iter.next()) {
        this.set(item.index, item.value);
      }
    }
  },

  /**
   * Gets the associated value of the key
   * @param key The key
   * @returns {*} The associated value
   */
  get: function(key) {
    Metadata.readAccess(this);
    var index = this.seq.indexOf(key);
    if (index > -1) {
      return this.vals[index];
    }
  },

  /**
   * Adds the given key, without an value
   * @param key The key to add
   */
  add: function(key) {
    Metadata.writeAccess(this);
    this.set(key);
  },

  /**
   * Sets the value of an key
   * @param key The key
   * @param value The new value
   */
  set: function(key, value) {
    Metadata.writeAccess(this);
    var index = this.seq.indexOf(key);
    if (index == -1) {
      index = this.seq.length;
      this.seq[index] = key;
      this.size++;
    }

    this.vals[index] = value;
  },

  /**
   * Removes the key and the associated value
   * @param key The key to remove
   */
  remove: function(key) {
    Metadata.writeAccess(this);
    var index = this.seq.indexOf(key);
    if (index > -1) {
      this.seq.splice(index, 1);
      this.vals.splice(index, 1);
      this.size--;
    }
  },

  /**
   * Returns an map iterator
   * @returns {baqend.collection.Map.Iterator} A iterator to traverse the key value mapping
   */
  items: function() {
    Metadata.readAccess(this);
    return new Map.Iterator(this);
  },

  /**
   * Gets a iterator over the keys
   * @returns {*} A key iterator
   */
  keys: function() {
    Metadata.readAccess(this);
    return this.iterator();
  },

  /**
   * Gets a iterator over the values
   * @returns {*} A value iterator
   */
  values: function() {
    Metadata.readAccess(this);
    var map = this;
    return new IndexIterator(this.size, function(index) {
      return map.seq[index];
    });
  },

  toString: function() {
    Metadata.readAccess(this);
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
    Metadata.readAccess(this);
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
