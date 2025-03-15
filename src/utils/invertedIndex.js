"use strict";

class InvertedIndex {
  constructor() {
    this.index = new Map();
  }

  addToIndex(record, id) { // Renamed from index
    Object.entries(record).forEach(([field, value]) => {
      if (typeof value === 'string') {
        const words = value.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (!this.index.has(word)) this.index.set(word, new Map());
          const fieldMap = this.index.get(word);
          if (!fieldMap.has(field)) fieldMap.set(field, new Set());
          fieldMap.get(field).add(id);
        });
      }
    });
  }

  search(query, field) {
    const words = query.toLowerCase().split(/\s+/);
    const results = new Set();
    words.forEach(word => {
      const fieldMap = this.index.get(word);
      if (fieldMap && fieldMap.has(field)) {
        fieldMap.get(field).forEach(id => results.add(id));
      }
    });
    return Array.from(results);
  }
}

module.exports = InvertedIndex;