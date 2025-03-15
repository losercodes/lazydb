"use strict";
class SchemaValidator {
  constructor() { this.schemas = new Map(); }
  setSchema(table, schema) { this.schemas.set(table, schema); }
  validate(table, record) {
    const schema = this.schemas.get(table);
    if (!schema) return;
    Object.keys(schema).forEach(key => {
      if (!(key in record)) throw new Error(`Missing required field: ${key}`);
      if (typeof record[key] !== schema[key]) throw new Error(`Invalid type for ${key}`);
    });
  }
}
module.exports = SchemaValidator;