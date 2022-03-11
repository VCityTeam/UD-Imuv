/** @format */

const exec = require("child-process-promise").exec;

const printExec = function (result) {
  console.log("stdout: \n", result.stdout);
  console.log("stderr: \n", result.stderr);
};

console.log("Build Imuv client");

exec("npm run build-debug").then(printExec);
