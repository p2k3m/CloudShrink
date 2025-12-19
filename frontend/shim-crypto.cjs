const crypto = require('crypto');
if (!global.crypto) {
    global.crypto = {};
}
if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = (arr) => {
        return crypto.randomFillSync(arr);
    };
}
console.log('Crypto shim loaded');
