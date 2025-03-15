class SQLParser {
    static parse(query, db) {
      const match = query.match(/SELECT \* FROM (\w+)( WHERE (.+))?/i);
      if (!match) throw new Error('Invalid query');
      const [, table, , where] = match;
      let q = db.select(table);
      if (where) {
        const [field, op, value] = where.split(' ');
        q = q.where(field, op, parseInt(value) || value);
      }
      return q.execute();
    }
  }
  
  module.exports = SQLParser;