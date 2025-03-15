"use strict";
class Transaction {
    constructor(db) { this.db = db; this.operations = []; }
    insert(table, record) { this.operations.push({ type: 'insert', table, record }); return this; }
    commit() { this.operations.forEach(op => this.db.insert(op.table, op.record)); }
    rollback() { this.operations = []; }
}
module.exports = Transaction;
