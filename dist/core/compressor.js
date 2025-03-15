"use strict";
const zlib = require('zlib'); // Use built-in Node.js zlib
class Compressor {
    static compress(data) {
        return zlib.deflateSync(JSON.stringify(data)).toString('base64');
    }
    static decompress(compressed) {
        return JSON.parse(zlib.inflateSync(Buffer.from(compressed, 'base64')).toString());
    }
}
module.exports = Compressor;
