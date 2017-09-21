"use strict";
const atob = require("../util/atob").atob;

/**
 * @alias caching.BloomFilter
 */
class BloomFilter {
  /**
   * @param {Object} rawBF The raw Bloom filter.
   * @param {number} rawBF.m The raw Bloom filter bits.
   * @param {number} rawBF.h The raw Bloom filter hashes.
   * @param {string} rawBF.b The Base64-encoded raw Bloom filter bytes.
   */
  constructor(rawBF) {
    /**
     * The raw bytes of this Bloom filter.
     * @type string
     */
    this.bytes = atob(rawBF.b);

    /**
     * The amount of bits.
     * @type number
     */
    this.bits = rawBF.m;

    /**
     * The amount of hashes.
     * @type number
     */
    this.hashes = rawBF.h;

    /**
     * The creation timestamp of this bloom filter.
     * @type number
     */
    this.creation = Date.now();
  }

  /**
   * Returns whether this Bloom filter contains the given element.
   *
   * @param {string} element The element to check if it is contained.
   * @return {boolean} True, if the element is contained in this Bloom filter.
   */
  contains(element) {
    for (const hash of BloomFilter._getHashes(element, this.bits, this.hashes)) {
      if (!this._isSet(hash)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Checks whether a bit is set at a given position.
   *
   * @param {number} index The position index to check.
   * @return {boolean} True, if the bit is set at the given position.
   * @private
   */
  _isSet(index) {
    const pos = Math.floor(index / 8);
    const bit = 1 << (index % 8);
    //Extract byte as int or NaN if out of range
    const byte = this.bytes.charCodeAt(pos);
    //Bit-wise AND should be non-zero (NaN always yields false)
    return (byte & bit) != 0;
  }

  /**
   * Returns the hases of a given element in the Bloom filter.
   *
   * @param {string} element The element to check.
   * @param {number} bits The amount of bits.
   * @param {number} hashes The amount of hashes.
   * @return {number[]} The hashes of an element in the Bloom filter.
   * @private
   */
  static _getHashes(element, bits, hashes) {
    const hashValues = new Array(this.hashes);
    const hash1 = BloomFilter._murmur3(0, element);
    const hash2 = BloomFilter._murmur3(hash1, element);
    for (let i = 0; i < hashes; i++) {
      hashValues[i] = (hash1 + i * hash2) % bits;
    }
    return hashValues;
  }

  /**
   * Calculate a Murmur3 hash.
   *
   * @param {number} seed A seed to use for the hashing.
   * @param {string} key A key to check.
   * @return {number} A hashed value of key.
   * @private
   */
  static _murmur3(seed, key) {
    const remainder = key.length & 3;
    const bytes = key.length - remainder;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;
    let h1, k1, i;
    h1 = seed;
    i = 0;

    while (i < bytes) {
      k1 =
          ((key.charCodeAt(i++) & 0xff) <<  0) |
          ((key.charCodeAt(i++) & 0xff) <<  8) |
          ((key.charCodeAt(i++) & 0xff) << 16) |
          ((key.charCodeAt(i++) & 0xff) << 24);

      k1 = (k1 * c1) & 0xffffffff;
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = (k1 * c2) & 0xffffffff;

      h1 ^= k1;
      h1 = (h1 << 13) | (h1 >>> 19);
      h1 = (h1 * 5 + 0xe6546b64) & 0xffffffff;
    }

    k1 = 0;

    switch (remainder) {
      case 3:
        k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
      case 2:
        k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
      case 1:
        k1 ^= (key.charCodeAt(i) & 0xff);

        k1 = (k1 * c1) & 0xffffffff;
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = (k1 * c2) & 0xffffffff;
        h1 ^= k1;
    }

    h1 ^= key.length;

    h1 ^= h1 >>> 16;
    h1 = (h1 * 0x85ebca6b) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = (h1 * 0xc2b2ae35) & 0xffffffff;
    h1 ^= h1 >>> 16;

    return h1 >>> 0;
  }

}

module.exports = BloomFilter;
