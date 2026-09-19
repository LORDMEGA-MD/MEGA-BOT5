'use strict';

/**
 * A Map that evicts the oldest entry when it reaches maxSize.
 * Prevents unbounded memory growth in long-running processes.
 */
class BoundedMap extends Map {
  constructor(maxSize = 10_000) {
    super();
    this.maxSize = maxSize;
  }

  set(key, value) {
    if (this.size >= this.maxSize) {
      const firstKey = this.keys().next().value;
      this.delete(firstKey);
    }
    return super.set(key, value);
  }
}

/**
 * A Set that evicts the oldest entry when it reaches maxSize.
 */
class BoundedSet extends Set {
  constructor(maxSize = 10_000) {
    super();
    this.maxSize = maxSize;
  }

  add(value) {
    if (this.size >= this.maxSize) {
      const first = this.values().next().value;
      this.delete(first);
    }
    return super.add(value);
  }
}

module.exports = { BoundedMap, BoundedSet };
