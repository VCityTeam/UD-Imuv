const Parse = require('parse/node');
const { PARSE } = require('./constant');
const { createUser } = require('./parse');

const run = async () => {
  // eslint-disable-next-line no-undef
  Parse.serverURL = process.env.PARSE_SERVER_URL; // This is your Server URL
  Parse.initialize(
    // eslint-disable-next-line no-undef
    process.env.PARSE_APP_ID, // This is your Application ID
    null, // Javascript Key is not required with a self-hosted Parse Server
    // eslint-disable-next-line no-undef
    process.env.PARSE_MASTER_KEY // This is your Master key (never use it in the frontend)
  );

  const name = process.argv[2];
  if (!name) {
    throw new Error('no name ');
  }
  const password = process.argv[3];
  if (!password) {
    throw new Error('no password ');
  }

  createUser(name, password, PARSE.VALUE.ROLE_ADMIN);

  console.log('create admin ', name, password);
};

run();
