/** @format */

const commonJsThread = require('./Server/WorldThread');
const commonJsServer = require('./Server/ServerOld');
const commonJsWorldDispatcher = require('./Server/WorldDispatcher');
const commonJsServiceWrapper = require('./Server/ServiceWrapper');
const commonJsApplication = require('./Server/Application');

module.exports = {
  Server: commonJsServer,
  WorldThread: commonJsThread,
  Application: commonJsApplication,
  ServiceWrapper: commonJsServiceWrapper,
  WorldDispatcher: commonJsWorldDispatcher,
};
