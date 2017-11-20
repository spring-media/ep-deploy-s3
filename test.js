const path = require('path');

const rootFolder = '/a/b/c/';
const fileName = 'd.js';

console.log(path.join('', fileName));
console.log(path.join('x/y/z', fileName));
console.log(path.join('x/y/z', ''));
