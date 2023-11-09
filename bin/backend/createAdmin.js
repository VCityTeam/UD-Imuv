const { PARSE } = require('../../src/shared/constant');
const { createUser } = require('./parse');

const name = process.argv[2];
if (!name) {
  throw new Error('no name');
}
const password = process.argv[3];
if (!password) {
  throw new Error('no password');
}

createUser(name, password, PARSE.VALUE.ROLE_ADMIN);

console.log('create admin', name, password);
