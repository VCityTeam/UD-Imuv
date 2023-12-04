const fs = require('fs');
const path = require('path');
const { gameScript } = require('../src/shared/shared');
const { Context, Object3D } = require('@ud-viz/game_shared');
const { Map } = require('@ud-viz/game_node_template');

const debug = () => {
  const gameObjectsFolderPath = path.resolve(
    __dirname,
    '../public/assets/gameObject3D'
  );

  const indexWorldsJSON = JSON.parse(
    fs.readFileSync(gameObjectsFolderPath + '/index.json')
  );

  const gameObjects3D = [];
  for (const uuid in indexWorldsJSON) {
    const json = JSON.parse(
      fs.readFileSync(gameObjectsFolderPath + '/' + indexWorldsJSON[uuid])
    );

    gameObjects3D.push(json);
  }

  const c = new Context(
    { ...gameScript, Map: Map },
    new Object3D(gameObjects3D[0])
  );
  c.load();
};

debug();
