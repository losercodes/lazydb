const LazyDB = require('./dist/index');
const db = new LazyDB(); // In-memory mode
db.createTable('users', { name: 'string', age: 'number' });
db.insert('users', { name: 'Alice', age: 25 });
console.log(db.select('users').execute());