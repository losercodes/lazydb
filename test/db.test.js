const LazyDB = require('../dist/index');

describe('LazyDB', () => {
  let db;

  beforeEach(() => {
    db = new LazyDB(); // In-memory mode for tests
    db.createTable('users', { name: 'string', age: 'number' });
    db.createTable('orders', { userId: 'number', amount: 'number' });
  });

  test('inserts and selects data', () => {
    db.insert('users', { name: 'Alice', age: 25 });
    const results = db.select('users').execute();
    expect(results).toEqual([{ id: 0, name: 'Alice', age: 25 }]);
  });

  test('performs joins', () => {
    db.insert('users', { name: 'Alice', age: 25 });
    db.insert('orders', { userId: 0, amount: 100 });
    const results = db.select('users').join('orders', 'id', 'userId').execute();
    expect(results).toEqual([
      { id: 0, name: 'Alice', age: 25, orders: { id: 0, userId: 0, amount: 100 } },
    ]);
  });

  test('computes aggregations', () => {
    db.insert('users', { name: 'Alice', age: 25 });
    db.insert('users', { name: 'Bob', age: 35 });
    const avgAge = db.select('users').aggregate('age', 'avg').execute(); // Add .execute()
    expect(avgAge).toBe(30);
  });

  test('supports full-text search', () => {
    db.insert('users', { name: 'Alice Smith', age: 25 });
    const results = db.select('users').search('name', 'Smith').execute();
    expect(results).toEqual([{ id: 0, name: 'Alice Smith', age: 25 }]);
  });

  test('emits events on insert', (done) => {
    db.on('insert', (table, record) => {
      expect(table).toBe('users');
      expect(record).toEqual({ id: 0, name: 'Alice', age: 25 });
      done();
    });
    db.insert('users', { name: 'Alice', age: 25 });
  });
});