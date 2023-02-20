/** @format */

try {
  // const udImuvNode = require('./src/index');
  const udvizNode = require('@ud-viz/node');
  const config = require('./assets/config/config.json');

  // const app = new udImuvNode.Application(config);
  // app.start(config);

  const expressAppWrapper = new udvizNode.ExpressAppWrapper();
  expressAppWrapper.start({
    folder: '../browser',
    port: 8000,
    withDefaultGameSocketService: false,
  });
} catch (e) {
  console.error(e);
}
