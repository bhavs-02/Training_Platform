const crypto = require('crypto');

// Generate a secure random key
const secretKey = crypto.randomBytes(32).toString('hex');

console.log(secretKey);
