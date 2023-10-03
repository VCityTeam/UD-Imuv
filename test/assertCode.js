const exec = require('child-process-promise').exec;

const main = async function () {
  // Build 3 bundle packages
  console.info('\nBuild bundle of @ud-imuv/shared');
  const sharedBundleBuildResult = await exec('npm run build-shared');
  console.info(sharedBundleBuildResult.stdout);

  console.info('\nBuild bundle of @ud-imuv/browser');
  const browserBundleBuildResult = await exec('npm run build-browser');
  console.info(browserBundleBuildResult.stdout);

  console.info('\nBuild bundle of @ud-imuv/node');
  const nodeBundleBuildResult = await exec('npm run build-node');
  console.info(nodeBundleBuildResult.stdout);
};

main();
