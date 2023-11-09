const Parse = require('parse/node');
// eslint-disable-next-line no-unused-vars
const { application } = require('express');
const jwt = require('jsonwebtoken');
const { PARSE } = require('./constant');
const PARSE_VALUE = require('../../src/shared/constant').PARSE.VALUE;

// TODO: check if Parse record if it's initialized or not
let initialized = false;

/**
 *
 * @returns {Parse} - Parse API
 */
const connect = () => {
  if (initialized) return Parse;
  initialized = true;

  // eslint-disable-next-line no-undef
  Parse.serverURL = process.env.PARSE_SERVER_URL; // This is your Server URL
  Parse.initialize(
    // eslint-disable-next-line no-undef
    process.env.PARSE_APP_ID, // This is your Application ID
    null, // Javascript Key is not required with a self-hosted Parse Server
    // eslint-disable-next-line no-undef
    process.env.PARSE_MASTER_KEY // This is your Master key (never use it in the frontend)
  );
  return Parse;
};

/**
 *
 * @param {application} app
 */
const useParseEndPoint = (app) => {
  const Parse = connect();

  /**
   * know how to read cookie to return token
   *
   * @param {Request} req
   * @returns {string} - token
   */
  const readTokenFromRequest = (req) => {
    const cookie = req.headers.cookie;
    if (!cookie || cookie == '') return null;

    let result = null;
    try {
      result = JSON.parse(cookie).token;
    } catch (error) {
      console.log('cookie = ', cookie);
      console.info('Error reading cookie ', error);
    }

    return result;
  };

  app.use('/sign_in', async (req, res) => {
    try {
      const user = await Parse.User.logIn(req.body.name, req.body.password);

      const tokenContent = {
        name: await user.get(PARSE.KEY.NAME),
        id: await user.id,
        role: await user.get(PARSE.KEY.ROLE),
      };

      console.log(tokenContent);

      res.send(jwt.sign(tokenContent, process.env.JSON_WEB_TOKEN_SECRET));
    } catch (error) {
      res.status(401).send(error);
    }
  });

  app.use('/sign_up', async (req, res) => {
    try {
      const user = await createUser(
        req.body.name,
        req.body.password,
        PARSE_VALUE.ROLE_DEFAULT
      );

      res.send(
        jwt.sign(
          {
            name: await user.get(PARSE.KEY.NAME),
            id: await user.id,
            role: await user.get(PARSE.KEY.ROLE),
          },
          process.env.JSON_WEB_TOKEN_SECRET
        )
      );
    } catch (error) {
      console.error(error);
      res.status(400).send(error);
    }
  });

  app.use('/verify_token', (req, res) => {
    const token = readTokenFromRequest(req);
    if (!token) res.send();

    jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET, (err, user) => {
      if (err) return res.send();
      res.send(user);
    });
  });
};

const createUser = async (name, password, role) => {
  const Parse = connect();
  const user = new Parse.User();
  user.set(PARSE.KEY.NAME, name);

  user.set(PARSE.KEY.PASSWORD, password);

  user.set(PARSE.KEY.ROLE, role);

  console.log('creating user ', name, role);

  await user.signUp();

  return user;
};

module.exports = {
  useParseEndPoint: useParseEndPoint,
  connect: connect,
  createUser: createUser,
};
