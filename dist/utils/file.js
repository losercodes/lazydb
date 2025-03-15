"use strict";
const fs = require('fs').promises;
const { createReadStream, createWriteStream } = require('fs');
const path = require('path');
const { lock } = require('proper-lockfile'); // Optional: for file locking
class FileUtils {
    // Read file asynchronously with locking
    static async readFile(filePath) {
        try {
            const release = await lock(filePath, { retries: 5 });
            const data = await fs.readFile(filePath, 'utf8');
            await release();
            return data;
        }
        catch (error) {
            if (error.code === 'ENOENT')
                return null; // File doesn't exist yet
            throw new Error(`Failed to read file ${filePath}: ${error.message}`);
        }
    }
    // Write file asynchronously with locking
    static async writeFile(filePath, data) {
        try {
            const release = await lock(filePath, { retries: 5 });
            await fs.writeFile(filePath, data, 'utf8');
            await release();
        }
        catch (error) {
            throw new Error(`Failed to write file ${filePath}: ${error.message}`);
        }
    }
    // Backup file by copying
    static async backupFile(sourcePath, backupPath) {
        try {
            const release = await lock(sourcePath, { retries: 5 });
            await fs.copyFile(sourcePath, backupPath);
            await release();
        }
        catch (error) {
            throw new Error(`Failed to backup file ${sourcePath}: ${error.message}`);
        }
    }
    // Check if file exists
    static async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    // Stream-based read for large files (optional enhancement)
    static streamRead(filePath) {
        return new Promise((resolve, reject) => {
            const stream = createReadStream(filePath, { encoding: 'utf8' });
            let data = '';
            stream.on('data', chunk => (data += chunk));
            stream.on('end', () => resolve(data));
            stream.on('error', reject);
        });
    }
    // Stream-based write for large files (optional enhancement)
    static streamWrite(filePath, data) {
        return new Promise((resolve, reject) => {
            const stream = createWriteStream(filePath, { encoding: 'utf8' });
            stream.write(data);
            stream.end();
            stream.on('finish', resolve);
            stream.on('error', reject);
        });
    }
}
module.exports = FileUtils;
