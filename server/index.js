/** @format */

try {
  const fs = require('fs');
  const gameServer = require('./dist/server.js');
  const config = require('./assets/config/config.json');

  if (fs.existsSync('./env.json')) {
    //to develop locally
    console.log('use local env.json as config.ENV');
    config.ENV = require('./env.json');
  } else {
    //to deploy
    console.log('use parameters cli as config.ENV');
    config.ENV = {
      //folder and port
      FOLDER: process.argv[2],
      PORT: process.argv[3],

      //BBB params
      BBB_URL: process.argv[4],
      BBB_SECRET: process.argv[5],

      //FIREBASE
      FIREBASE_API_KEY: process.argv[6],
      FIREBASE_AUTH_DOMAIN: process.argv[7],
      FIREBASE_PROJECT_ID: process.argv[8],
      FIREBASE_STORAGE_BUCKET: process.argv[9],
      FIREBASE_MESSAGING_SENDER_ID: process.argv[10],
      FIREBASE_APP_ID: process.argv[11],
      FIREBASE_MEASUREMENT_ID: process.argv[12],
    };
  }

  console.log('environement', config.ENV);

  console.log('server version ', require('./package.json').version);

  const app = new gameServer.Application(config);
  app.start();
} catch (e) {
  console.error(e);
}
