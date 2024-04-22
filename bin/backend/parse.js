const Parse = require('parse/node');
const jwt = require('jsonwebtoken');
const { PARSE } = require('./constant');
const PARSE_VALUE = require('../../src/shared/constant').PARSE.VALUE;
const cookie = require('cookie');

// TODO: check if Parse record if it's initialized or not
let initialized = false;
Parse.User.enableUnsafeCurrentUser();
/**
 *
 * @returns {Parse} - Parse API
 */
const connect = () => {
  if (initialized) {
    return Parse;
  }
  initialized = true;

  if (!process.env.PARSE_SERVER_URL)
    throw new Error('need process.env.PARSE_SERVER_URL');
  if (!process.env.PARSE_APP_ID)
    throw new Error('need process.env.PARSE_APP_ID');
  if (!process.env.PARSE_MASTER_KEY)
    throw new Error('need process.env.PARSE_MASTER_KEY');

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
  const imuvCookie = cookie.parse(req.headers.cookie || '').imuv;
  if (!imuvCookie || imuvCookie == '') return null;

  let result = null;
  try {
    result = JSON.parse(imuvCookie).token;
  } catch (error) {
    console.log('cookie = ', imuvCookie);
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

const isAdminMiddleware = (req, res, next) => {
  const token = readTokenFromRequest(req);
  if (!token) {
    res.sendStatus(401);
  } else {
    jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET, (err, user) => {
      if (err) {
        res.sendStatus(401);
      } else {
        if (user.role != PARSE_VALUE.ROLE_ADMIN) {
          res.sendStatus(401);
        } else {
          req.user = user;
          next();
        }
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
  isAdminMiddleware: isAdminMiddleware,
};
