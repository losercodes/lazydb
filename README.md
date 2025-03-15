# Lazyydb


A lightweight, zero-setup JSON database with SQL-like queries, perfect for rapid development. LazyDB mimics SQLite’s functionality but works directly with JSON files or in-memory, requiring no installation.

## Features
- **File-Based or In-Memory Storage**: Use `database.json` or run in-memory.
- **SQL-like Queries**: `db.select('users').where('age', '>', 20).join('orders', 'id', 'userId')`.
- **Advanced Features**: Joins, aggregations (`count`, `sum`, `avg`, `min`, `max`), full-text search.
- **Indexing**: B-tree for speed, inverted index for text search.
- **Zero-Config**: `new LazyDB()` for in-memory mode.
- **Event-Driven**: React to inserts, updates, and deletes.
- **CLI**: `npx lazydb "SELECT * FROM users WHERE age > 20"`.
- **REST API**: Integrate with Express.js.
- **Cross-Platform**: Works in Node.js, browsers, and Deno.

## Installation
```bash
npm install lazyydb