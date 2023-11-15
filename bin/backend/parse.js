const Parse = require('parse/node');
const jwt = require('jsonwebtoken');
const { PARSE } = require('./constant');

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

const computeUserMiddleware = (req, res, next) => {
  const token = readTokenFromRequest(req);

  if (!token) {
    next();
  } else {
    jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET, (err, user) => {
      if (err) {
        res.sendStatus(401);
      } else {
        req.user = user;
        next();
      }
    });
  }
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
  connect: connect,
  createUser: createUser,
  computeUserMiddleware: computeUserMiddleware,
};
