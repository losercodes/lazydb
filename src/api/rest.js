const express = require('express');
const LazyDB = require('../core/db');

const app = express();
app.use(express.json());
const db = new LazyDB();

app.get('/api/:table', (req, res) => {
  const results = db.select(req.params.table).execute();
  res.json(results);
});

app.post('/api/:table', (req, res) => {
  const id = db.insert(req.params.table, req.body);
  res.json({ id });
});

app.listen(3000, () => console.log('LazyDB REST API running on port 3000'));