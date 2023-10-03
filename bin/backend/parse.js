const Parse = require('parse/node');
// eslint-disable-next-line no-unused-vars
const { application } = require('express');

/**
 *
 * @param {application} app
 */
module.exports = (app) => {
  // eslint-disable-next-line no-undef
  Parse.serverURL = process.env.PARSE_SERVER_URL; // This is your Server URL
  Parse.initialize(
    // eslint-disable-next-line no-undef
    process.env.PARSE_APP_ID, // This is your Application ID
    null, // Javascript Key is not required with a self-hosted Parse Server
    // eslint-disable-next-line no-undef
    process.env.PARSE_MASTER_KEY // This is your Master key (never use it in the frontend)
  );

  app.use('/sign_in', (req, res) => {
    console.log('bonjour');
  });
};
