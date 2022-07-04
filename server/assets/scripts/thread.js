/** @format */

const serverConfig = require("../config/config.json");
const server = require("../../dist/server.js");
server.WorldThread.routine(serverConfig);
