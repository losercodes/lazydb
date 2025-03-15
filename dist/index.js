"use strict";
let LazyDB;
// Node.js environment
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    LazyDB = require('./core/db');
}
// Browser environment (in-memory only)
else if (typeof window !== 'undefined') {
    LazyDB = class InMemoryDB extends require('./core/db') {
        constructor() {
            super(null); // Force in-memory mode
        }
    };
}
// Deno environment
else if (typeof Deno !== 'undefined') {
    const { readFileSync, writeFileSync } = Deno;
    LazyDB = class DenoDB extends require('./core/db') {
        async load() {
            try {
                this.data = this.Compressor.decompress(readFileSync(this.filePath, 'utf8'));
            }
            catch (_a) {
                this.data = {};
                await this.save();
            }
        }
        async save() {
            writeFileSync(this.filePath, this.Compressor.compress(this.data));
            if (this.backupPath)
                writeFileSync(this.backupPath, this.Compressor.compress(this.data));
        }
    };
}
else {
    throw new Error('Unsupported environment');
}
module.exports = LazyDB;
