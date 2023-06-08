/** @file Running the build-debug script */
const exec = require('child-process-promise').exec;

// run a build debug bundle browser
const childExecBuildDebug = exec(
  'npm run build-debug --prefix ./packages/browser'
);

childExecBuildDebug.childProcess.stdout.on('data', (data) => {
  console.log(`${data}`);
});
childExecBuildDebug.childProcess.stderr.on('data', (data) => {
  console.error('\x1b[31m', 'host' + ` ERROR :\n${data}`);
});

exec('npm run host', process.env.PORT || 8000);

// app.start({
//   folder: './packages/browser',
//   port: 8000,
//   gameObjectsFolderPath: path.resolve(
//     process.cwd(),
//     './packages/browser/assets/gameObject3D'
//   ),
//   threadProcessPath: path.resolve(
//     process.cwd(),
//     './packages/node/dist/thread/debug/bundle.js'
//   ),
// });
