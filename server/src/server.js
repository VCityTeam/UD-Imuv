/** @format */

const commonJsThread = require('./Server/WorldThread');
const commonJsWorldDispatcher = require('./Server/WorldDispatcher');
const commonJsServiceWrapper = require('./Server/ServiceWrapper');
const commonJsApplication = require('./Server/Application');

module.exports = {
  WorldThread: commonJsThread,
  Application: commonJsApplication,
  ServiceWrapper: commonJsServiceWrapper,
  WorldDispatcher: commonJsWorldDispatcher,
};
