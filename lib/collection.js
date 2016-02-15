///**
// * @namespace baqend.collection
// */
//
//var Metadata = require('./util/Metadata');
//var Iterator, IndexIterator, PropertyIterator, Iterable, Collection, List, Set, Map;
//var ITERATOR = '@@iterator';
//
///**
// * @typedef {Object} baqend.collection.Iterator.Item
// * @property {Boolean} done Indicates if the iterator has no more elements
// * @property {*} value Tha actual iterated element
// */
//
///**
// * @class baqend.collection.Iterator
// */
//exports.Iterator = Iterator = Trait.inherit( /** @lends baqend.collection.Iterator.prototype */ {
//  /** @lends baqend.collection.Iterator */
//  extend: {
//    /**
//     * @type baqend.collection.Iterator.Item
//     */
//    DONE: {done: true}
//  }
//
//  constructor Iterator(obj) {
//    if (obj) {
//      if (obj[ITERATOR] && Function.isInstance(obj[ITERATOR])) {
//        return obj[ITERATOR]();
//      } else if (Array.isInstance(obj)) {
//        return new IndexIterator(obj.length, function(index) {
//          return obj[index];
//        });
//      } else {
//        return new PropertyIterator(obj);
//      }
//    }
//  }
//
//  /**
//   * Gets the next item
//   * @return {Object} item The next iterating item
//   * @return {Boolean} item.done <code>true</code> if there are no more elements to iterate
//   * @return {*} item.value The current iterating value
//   */
//  next() {
//    return Iterator.DONE;
//  }
//});
//
///**
// * @class baqend.collection.IndexIterator
// * @extends baqend.collection.Iterator
// */
//exports.IndexIterator = IndexIterator = Object.inherit(Iterator, /** @lends baqend.collection.IndexIterator.prototype */ {
//  length: 0,
//  index: 0,
//
//  constructor collection(length, accessor) {
//    this.length = length;
//
//    if (accessor)
//      this.accessor = accessor;
//  }
//
//  /**
//   * Returns the element for an index
//   * @param {Number} index
//   */
//  accessor(index) {
//    return index;
//  }
//
//  /**
//   * @inheritDoc
//   */
//  next() {
//    if (this.index < this.length) {
//      var result = { done: false, value: this.accessor(this.index) };
//      this.index++;
//      return result;
//    } else {
//      return Iterator.DONE;
//    }
//  }
//});
//
///**
// * @class baqend.collection.PropertyIterator
// * @extends baqend.collection.Iterator
// */
//exports.PropertyIterator = PropertyIterator = Iterator.inherit(/** baqend.collection.PropertyIterator.prototype */ {
//  index: 0,
//
//  constructor PropertyIterator(object) {
//    this.object = object;
//    this.names = Object.getOwnPropertyNames(object);
//  }
//
//  next() {
//    if (this.names.length < this.index) {
//      var name = this.names[this.index++];
//      return {done: false, value: [name, this.object[name]]};
//    } else {
//      return Iterator.DONE;
//    }
//  }
//});
//
///**
// * @class baqend.collection.Iterable
// */
//exports.Iterable = Iterable = Trait.inherit( /** @lends baqend.collection.Iterable.prototype */ {
//  /**
//   * Returns an iterator over the entries of this collection
//   * @return {Iterator<Array<*>>} An iterator where each entry is a key - value pair
//   */
//  entries() {
//    return null;
//  }
//
//  /**
//   * Executes a provided function once per array element.
//   * @param {Function} callback Function to execute for each element.
//   * @param {*} thisArg Value to use as this when executing callback.
//   */
//  forEach(callback, thisArg) {
//    if (!callback || !Function.isInstance(callback)) {
//      throw new TypeError(callback + ' is not a function');
//    }
//
//    for (var iter = this.entries(), item; !(item = iter.next()).done; ) {
//      callback.call(thisArg, item.value[1], item.value[0], this);
//    }
//  }
//
//  /**
//   * Tests whether all elements in the array pass the test implemented by the provided function.
//   * @param {Function} callback Function to test for each element.
//   * @param {*} thisArg Value to use as this when executing callback.
//   * @returns {boolean} true if all elements in the array pass the test
//   */
//  every(callback, thisArg) {
//    if (!callback || !Function.isInstance(callback)) {
//      throw new TypeError(callback + ' is not a function');
//    }
//
//    for (var iter = this.entries(), item; !(item = iter.next()).done; ) {
//      if (!callback.call(thisArg, item.value[1], item.value[0], this))
//        return false;
//    }
//
//    return true;
//  }
//
//  /**
//   * Tests whether some element in the array passes the test implemented by the provided function.
//   * @param {Function} callback Function to test for each element.
//   * @param {*} thisArg Value to use as this when executing callback.
//   * @returns {boolean} true if some element in the array passes the test
//   */
//  some(callback, thisArg) {
//    if (!Function.isInstance(callback)) {
//      throw new TypeError(callback + ' is not a function');
//    }
//
//    for (var iter = this.entries(), item; !(item = iter.next()).done; ) {
//      if (callback.call(thisArg, item.value[1], item.value[0], this))
//        return true;
//    }
//
//    return false;
//  }
//
//  /**
//   * Creates a new instance of this object with all elements that pass the test implemented by the provided function.
//   * @param {Function} callback Function to test each element of the array.
//   * @param {*} thisArg Value to use as this when executing callback.
//   * @returns {*} A new instance of this object with all elements that pass the test
//   */
//  filter(callback, thisArg) {
//    if (!Function.isInstance(callback)) {
//      throw new TypeError(callback + ' is not a function');
//    }
//
//    var result = new this.constructor();
//    for (var iter = this.entries(), item; !(item = iter.next()).done; ) {
//      if (callback.call(thisArg, item.value[1], item.value[0], this)) {
//        if (result.set) {
//          result.set(item.value[0], item.value[1]);
//        } else {
//          result.add(item.value[1]);
//        }
//      }
//    }
//
//    return result;
//  }
//
//  /**
//   * Creates a new instance of this object with the results of calling a provided function on every element in this array.
//   * @param {Function} callback Function that produces an element of the new object
//   * @param {*} thisArg Value to use as this when executing callback.
//   * @returns {*} A new instance of this object with the results
//   */
//  map(callback, thisArg) {
//    if (!Function.isInstance(callback)) {
//      throw new TypeError(callback + ' is not a function');
//    }
//
//    var result = new this.constructor();
//    for (var iter = this.entries(), item; !(item = iter.next()).done; ) {
//      var value = callback.call(thisArg, item.value[1], item.value[0], this);
//      if (result.set) {
//        result.set(item.value[0], value);
//      } else {
//        result.add(value);
//      }
//    }
//
//    return result;
//  }
//
//  /**
//   * Applies a function against an accumulator and each element
//   * (from left-to-right) has to reduce it to a single value.
//   * @param {Function} callback Function to execute on each element
//   * @param {*} previousValue Object to use as the first argument to the first call of the callback.
//   * @returns {*}
//   */
//  reduce(callback, previousValue) {
//    if (!Function.isInstance(callback)) {
//      throw new TypeError(callback + ' is not a function');
//    }
//
//    var iter = this.entries();
//    if (arguments.length == 1) {
//      previousValue = iter.next().value;
//    }
//
//    var item;
//    while (!(item = iter.next()).done) {
//      previousValue = callback.call(null, previousValue, item.value[1], item.value[0], this);
//    }
//
//    return previousValue;
//  }
//});
//
///**
// * @class baqend.collection.Collection
// * @extends baqend.collection.Iterable
// *
// * @param {Array|baqend.collection.Collection=} collection
// */
//exports.Collection = Collection = Object.inherit(Iterable, /** @lends baqend.collection.Collection.prototype */ {
//
//  /**
//   * The collection backed array
//   * @type Array.<*>
//   */
//  array: null,
//
//  get size() {
//    return this.array.length;
//  }
//
//  constructor Collection(iterable) {
//    this.array = [];
//
//    var iter = Iterator(iterable);
//    if (iter) {
//      var item;
//      while(!(item = iter.next()).done) {
//        this.add(item.value);
//      }
//    }
//  }
//
//  /**
//   * Indicates if this collection contains the element
//   * @param element The element to test
//   * @returns {boolean} true if the collection contains the element
//   */
//  has(element) {
//    return this.array.indexOf(element) != -1;
//  }
//
//  /**
//   * Clears the collection by removing all elements
//   */
//  clear: function() {
//    Metadata.writeAccess(this);
//    this.array = [];
//  }
//
//  /**
//   * Add a alement to the collection
//   * @param element The element to add
//   */
//  add(element) {
//    Metadata.writeAccess(this);
//    this.array.push(element);
//  }
//
//  /**
//   * Removes teh element form the collection
//   * @param element The element to remove
//   */
//  'delete'(element) {
//    Metadata.writeAccess(this);
//    var index = this.array.indexOf(element);
//    if (index > -1) {
//      this.array.splice(index, 1);
//    }
//  }
//
//  /**
//   * Gets an iterator over the entries of the collection
//   * @returns {baqend.collection.Iterator.<Array<*>>} An iterator over the entries of the collection
//   */
//  entries() {
//    var array = this.array;
//    return new IndexIterator(this.size, function(index) {
//      return [index, array[index]];
//    });
//  }
//
//  /**
//   * Gets an iterator over the keys of the collection
//   * @returns {baqend.collection.Iterator.<Number>} An iterator over the keys of the collection
//   */
//  keys() {
//    return new IndexIterator(this.size);
//  }
//
//  /**
//   * Gets an iterator over the values of the collection
//   * @returns {baqend.collection.Iterator.<*>} An iterator over the values of the collection
//   */
//  values() {
//    var array = this.array;
//    return new IndexIterator(this.size, function(index) {
//      return array[index];
//    });
//  }
//
//  toString() {
//    return this.array.toString();
//  }
//
//  toJSON() {
//    return this.array;
//  }
//});
//
//var Arr = Array.prototype;
//
///**
// * Creates a new List instance
// * @class baqend.collection.List
// * @extends baqend.collection.Collection
// *
// * @param {Array|baqend.collection.Collection=} collection
// */
//exports.List = List = Collection.inherit(/** @lends baqend.collection.List.prototype */ {
//
//  constructor List(iterable) {
//    Collection.call(this, iterable);
//  }
//
//  /**
//   * Get the value by index
//   * @param index The index
//   * @returns {*} The value of the index
//   */
//  get(index) {
//    if (index < 0) {
//      index = this.size + index;
//    }
//
//    if (index >= 0 && index < this.size) {
//      return this.array[index];
//    }
//  }
//
//  /**
//   * @inheritDoc
//   */
//  add(element) {
//    Metadata.writeAccess(this);
//    this.array.push(element);
//  }
//
//  /**
//   * Sets the value at index
//   * @param index The index
//   * @param value The new value
//   */
//  set(index, value) {
//    Metadata.writeAccess(this);
//    if (index < 0) {
//      index = this.size + index;
//    }
//
//    if (index < 0) {
//      this.array.unshift(value);
//    } else if (index >= this.size) {
//      this.array.push(value);
//    } else {
//      this.array[index] = value;
//    }
//  }
//
//  concat() {
//    var args = Arr.map.call(arguments, function(arg) {
//      if (List.isInstance(arg)) {
//        return arg.array;
//      } else {
//        return arg;
//      }
//    });
//
//    return new List(Arr.concat.apply(this.array, args));
//  }
//
//  /**
//   * Gets the index of an value
//   * @param value The value to search
//   * @returns {*} The index of the value, or -1 if the value was not found
//   */
//  indexOf(value) {
//    return this.seq.indexOf(value);
//  }
//
//  /**
//   * Gets the last index of the value
//   * @param value The value to search
//   * @returns {*} The last index of the value, or -1 if teh value was not found
//   */
//  lastIndexOf(value) {
//    return this.seq.lastIndexOf(value);
//  }
//
//  join(seperator) {
//    return this.array.join(seperator);
//  }
//
//  pop() {
//    Metadata.writeAccess(this);
//    return this.array.pop();
//  }
//
//  push() {
//    Metadata.writeAccess(this);
//    return Arr.push.apply(this.array, arguments);
//  }
//
//  reverse() {
//    Metadata.writeAccess(this);
//    this.array.reverse();
//  }
//
//  shift() {
//    Metadata.writeAccess(this);
//    return this.array.shift();
//  }
//
//  slice(begin, end) {
//    return new List(this.array.slice(begin, end));
//  }
//
//  sort(compareFunction) {
//    Metadata.writeAccess(this);
//    this.array.sort(compareFunction);
//  }
//
//  splice() {
//    Metadata.writeAccess(this);
//    return Arr.splice.apply(this.array, arguments);
//  }
//
//  unshift() {
//    Metadata.writeAccess(this);
//    return Arr.unshift.apply(this.array, arguments);
//  }
//});
//
//List.prototype[ITERATOR] = List.prototype.values;
//
///**
// * @class baqend.collection.Set
// * @extends baqend.collection.Collection
// *
// * @param {Array|baqend.collection.Collection=} collection
// */
//exports.Set = Set = Collection.inherit(/** @lends baqend.collection.Set.prototype */ {
//
//  constructor Set(iterable) {
//    Collection.call(this, iterable);
//  }
//
//  /**
//   * Adds the element ot the collection, if the collection doesn't contain the element
//   * @param value The value to add
//   */
//  add(value) {
//    var index = this.array.indexOf(value);
//    if (index < 0) {
//      this.array.push(value);
//      Metadata.writeAccess(this);
//    }
//  }
//
//  /**
//   * @inheritDoc
//   */
//  entries() {
//    var array = this.array;
//    return new IndexIterator(this.size, function(index) {
//      return [array[index], array[index]];
//    });
//  }
//});
//
//Set.prototype.keys = Set.prototype.values;
//Set.prototype[ITERATOR] = Set.prototype.values;
//
///**
// * @class baqend.collection.Map
// * @extends baqend.collection.Collection
// *
// * @param {Array|baqend.collection.Collection=} collection
// */
//exports.Map = Map = Collection.inherit(/** @lends baqend.collection.Map.prototype */ {
//
//  constructor Map(iterable) {
//    this.array = [];
//    this.vals = [];
//
//    //dates can't be compared with the == nor they can be looked up with indexOf, therefore we cache
//    //the actual date instances used as keys to ensure that we always use the same date identity as key
//    this._dateCache = {};
//
//    var iter = Iterator(iterable);
//    if (iter) {
//      var item;
//      while (!(item = iter.next()).done) {
//        if (!Array.isInstance(item.value) || item.value.length != 2) {
//          throw new Error('No key value pair in entry ' + item.value);
//        }
//
//        this.set(item.value[0], item.value[1]);
//      }
//    }
//  }
//
//  /**
//   * @inheritDoc
//   */
//  clear() {
//    Metadata.writeAccess(this);
//    this.array = [];
//    this.vals = [];
//    this._dateCache = {};
//  },
//
//  /**
//   * Indicates if this collection contains the element
//   * @param key The element to test
//   * @returns {boolean} true if the collection contains the element
//   */
//  has(key) {
//    if (key instanceof Date)
//      key = this._dateCache[key.getTime()] || key;
//
//    return this.array.indexOf(key) != -1;
//  }
//
//  /**
//   * Gets the associated value of the key
//   * @param key The key
//   * @returns {*} The associated value
//   */
//  get(key) {
//    var index = this.array.indexOf(key);
//    if (index > -1) {
//      return this.vals[index];
//    }
//  }
//
//  /**
//   * Adds the given key, without an value
//   * @param key The key to add
//   */
//  add(key) {
//    Metadata.writeAccess(this);
//    this.set(key, key);
//  }
//
//  /**
//   * Sets the value of an key
//   * @param key The key
//   * @param value The new value
//   */
//  set(key, value) {
//    Metadata.writeAccess(this);
//
//    if (key instanceof Date) {
//      var time = key.getTime();
//      key = this._dateCache[time] || key;
//      this._dateCache[time] = key;
//    }
//
//    var index = this.array.indexOf(key);
//    if (index == -1) {
//      index = this.array.length;
//      this.array[index] = key;
//    }
//
//    this.vals[index] = value;
//  }
//
//  /**
//   * Removes the key and the associated value
//   * @param key The key to remove
//   */
//  delete(key) {
//    Metadata.writeAccess(this);
//
//    if (key instanceof Date) {
//      var time = key.getTime();
//      key = this._dateCache[time] || key;
//      delete this._dateCache[time];
//    }
//
//    var index = this.array.indexOf(key);
//    if (index > -1) {
//      this.array.splice(index, 1);
//      this.vals.splice(index, 1);
//    }
//  }
//
//  /**
//   * Gets an iterator over the entries of the map
//   * @returns {baqend.collection.Iterator.<Array<*>>} An iterator over the key value pairs of the map
//   */
//  entries() {
//    var keys = this.array;
//    var vals = this.vals;
//    return new IndexIterator(this.size, function(index) {
//      return [keys[index], vals[index]];
//    });
//  }
//
//  /**
//   * Gets a iterator over the keys
//   * @returns {baqend.collection.Iterator.<*>} A key iterator
//   */
//  keys() {
//    var keys = this.array;
//    return new IndexIterator(this.size, function(index) {
//      return keys[index];
//    });
//  }
//
//  /**
//   * Gets a iterator over the values
//   * @returns {baqend.collection.Iterator.<*>} A value iterator
//   */
//  values() {
//    var vals = this.vals;
//    return new IndexIterator(this.size, function(index) {
//      return vals[index];
//    });
//  }
//
//  toString() {
//    var str = '';
//    for (var i = 0, len = this.size; i < len; ++i) {
//      if (str != '')
//        str += ', ';
//
//      str += this.array[i];
//      str += ' => ';
//      str += this.vals[i];
//    }
//    return '{' + str + '}';
//  }
//
//  toJSON() {
//    var map = [];
//    for (var i = 0, len = this.size; i < len; ++i) {
//      map.push({
//        key: this.array[i],
//        value: this.vals[i]
//      });
//    }
//    return map;
//  }
//});
//
//Map.prototype[ITERATOR] = Map.prototype.entries;

module.exports = {
  Map: Map,
  List: Array,
  Set: Set
};
