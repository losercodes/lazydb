"use strict";
const fs = require('fs').promises;
const EventEmitter = require('events');
const BTree = require('./btree');
const QueryCache = require('./cache');
const Compressor = require('./compressor');
const Transaction = require('./transaction');
const SchemaValidator = require('../utils/schema');
const InvertedIndex = require('../utils/invertedIndex');
class LazyDB extends EventEmitter {
    constructor(filePath = null) {
        super();
        this.filePath = filePath;
        this.backupPath = filePath ? './backup.json' : null;
        this.data = filePath ? {} : {}; // In-memory if no filePath
        this.indexes = new Map(); // B-tree indexes for fast lookups
        this.textIndexes = new Map(); // Inverted indexes for full-text search
        this.cache = new QueryCache();
        this.schema = new SchemaValidator();
        if (filePath)
            this.load(); // Only load from file if filePath is provided
    }
    async load() {
        try {
            const compressed = await fs.readFile(this.filePath, 'utf8');
            this.data = Compressor.decompress(compressed);
            Object.keys(this.data).forEach(table => {
                this.indexes.set(table, new BTree());
                this.textIndexes.set(table, new InvertedIndex());
                this.data[table].forEach((record, id) => {
                    if (record) {
                        this.indexes.get(table).insert(id, record);
                        this.textIndexes.get(table).addToIndex(record, id);
                    }
                });
            });
        }
        catch (e) {
            this.data = {};
            if (this.filePath)
                await this.save();
        }
    }
    async save() {
        if (!this.filePath)
            return; // Skip save in in-memory mode
        const compressed = Compressor.compress(this.data);
        await fs.writeFile(this.filePath, compressed);
        if (this.backupPath)
            await fs.writeFile(this.backupPath, compressed);
    }
    createTable(table, schema) {
        if (!this.data[table]) {
            this.data[table] = [];
            this.indexes.set(table, new BTree());
            this.textIndexes.set(table, new InvertedIndex());
            this.schema.setSchema(table, schema);
            this.emit('tableCreated', table, schema);
        }
    }
    insert(table, record) {
        if (!this.data[table])
            throw new Error(`Table ${table} does not exist`);
        this.schema.validate(table, record);
        const id = this.data[table].length;
        const fullRecord = { id, ...record };
        this.data[table].push(fullRecord);
        this.indexes.get(table).insert(id, fullRecord);
        this.textIndexes.get(table).addToIndex(fullRecord, id);
        if (this.filePath)
            this.save();
        this.emit('insert', table, fullRecord);
        return id;
    }
    update(table, id, updates) {
        if (!this.data[table] || !this.data[table][id])
            throw new Error('Record not found');
        const record = this.data[table][id];
        Object.assign(record, updates);
        this.indexes.get(table).insert(id, record);
        this.textIndexes.get(table).addToIndex(record, id);
        if (this.filePath)
            this.save();
        this.emit('update', table, record);
    }
    delete(table, id) {
        if (!this.data[table] || !this.data[table][id])
            throw new Error('Record not found');
        this.data[table][id] = null; // Soft delete
        if (this.filePath)
            this.save();
        this.emit('delete', table, id);
    }
    select(table) {
        if (!this.data[table])
            throw new Error(`Table ${table} does not exist`);
        return new QueryBuilder(this, table);
    }
    transaction() {
        return new Transaction(this);
    }
}
class QueryBuilder {
    constructor(db, table) {
        this.db = db;
        this.table = table;
        this.conditions = [];
        this.order = null;
        this.limitNum = null;
        this.joins = [];
        this.aggregation = null;
        this.searchQuery = null;
    }
    join(joinTable, leftKey, rightKey) {
        if (!this.db.data[joinTable])
            throw new Error(`Join table ${joinTable} does not exist`);
        this.joins.push({ table: joinTable, leftKey, rightKey });
        return this;
    }
    where(field, op, value) {
        this.conditions.push({ field, op, value });
        return this;
    }
    orderBy(field) {
        this.order = field;
        return this;
    }
    limit(num) {
        this.limitNum = num;
        return this;
    }
    aggregate(field, type) {
        this.aggregation = { field, type };
        return this;
    }
    search(field, query) {
        this.searchQuery = { field, query };
        return this;
    }
    execute() {
        const cacheKey = `${this.table}:${JSON.stringify(this.conditions)}:${this.order}:${this.limitNum}:${JSON.stringify(this.joins)}:${JSON.stringify(this.aggregation)}:${JSON.stringify(this.searchQuery)}`;
        const cached = this.db.cache.get(cacheKey);
        if (cached !== undefined)
            return cached;
        let results = this.db.data[this.table].filter(r => r !== null);
        if (this.searchQuery) {
            const { field, query } = this.searchQuery;
            const textIndex = this.db.textIndexes.get(this.table);
            results = textIndex.search(query, field).map(id => this.db.data[this.table][id]);
        }
        else {
            results = results.filter(r => this.matches(r));
        }
        this.joins.forEach(({ table, leftKey, rightKey }) => {
            const joinData = this.db.data[table].filter(r => r !== null);
            results = results.flatMap(left => {
                const matches = joinData
                    .filter(right => left[leftKey] === right[rightKey])
                    .map(right => ({ ...left, [table]: right }));
                return matches.length ? matches : [left];
            });
        });
        if (this.aggregation) {
            const { field, type } = this.aggregation;
            switch (type) {
                case 'count':
                    return results.length;
                case 'sum':
                    return results.reduce((acc, r) => acc + (r[field] || 0), 0);
                case 'avg':
                    const sum = results.reduce((acc, r) => acc + (r[field] || 0), 0);
                    return sum / (results.length || 1); // Fixed: Compute sum directly
                case 'min':
                    return Math.min(...results.map(r => r[field] || Infinity));
                case 'max':
                    return Math.max(...results.map(r => r[field] || -Infinity));
                default:
                    throw new Error(`Unsupported aggregation type: ${type}`);
            }
        }
        if (this.order) {
            results.sort((a, b) => {
                var _a, _b;
                const aVal = (_a = a[this.order]) !== null && _a !== void 0 ? _a : '';
                const bVal = (_b = b[this.order]) !== null && _b !== void 0 ? _b : '';
                return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
            });
        }
        if (this.limitNum)
            results = results.slice(0, this.limitNum);
        this.db.cache.set(cacheKey, results);
        return results;
    }
    matches(record) {
        return this.conditions.every(({ field, op, value }) => {
            const recordValue = record[field];
            switch (op) {
                case '>': return recordValue > value;
                case '<': return recordValue < value;
                case '=': return recordValue === value;
                case '>=': return recordValue >= value;
                case '<=': return recordValue <= value;
                default: throw new Error(`Unsupported operator: ${op}`);
            }
        });
    }
}
module.exports = LazyDB;
