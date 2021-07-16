/** @format */

const commonJsThread = require('./Server/WorldThread');
const commonJsServer = require('./Server/Server');

module.exports = {
  Server: commonJsServer,
  WorldThread: commonJsThread,
};
