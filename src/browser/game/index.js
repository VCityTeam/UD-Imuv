import { loadJSON } from '@ud-viz/utils_browser';
import {
  AssetManager,
  MultiPlanarProcess,
  SocketIOWrapper,
  InputManager,
} from '@ud-viz/game_browser';
import * as proj4 from 'proj4';
import * as itowns from 'itowns';

import * as externalScript from '../component/externalScript/externalScript';

const run = async () => {
  const config = await loadJSON('./assets/config/config.json');
  const assetManager = new AssetManager();
  await assetManager.loadFromConfig(config.assetManager);
  const socketIOWrapper = new SocketIOWrapper();
  await socketIOWrapper.connectToServer();

  proj4.default.defs(
    config['extent'].crs,
    '+proj=lcc +lat_1=45.25 +lat_2=46.75' +
      ' +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
  );

  const extent = new itowns.Extent(
    config['extent'].crs,
    parseInt(config['extent'].west),
    parseInt(config['extent'].east),
    parseInt(config['extent'].south),
    parseInt(config['extent'].north)
  );

  const game = new MultiPlanarProcess(
    socketIOWrapper,
    extent,
    assetManager,
    new InputManager(),
    {
      sceneConfig: config.scene,
      externalGameScriptClass: externalScript,
      gameOrigin: {
        x: extent.center().x,
        y: extent.center().y,
        z: 300,
      },
      frame3DPlanarOptions: {
        domElementClass: 'full_screen',
        hasItownsControls: false,
      },
    }
  );

  // TODO : external scripts depend of this value that should not be the case
  // set global variables for external scripts
  game.externalGameContext.userData.firstGameObject = false;
  game.externalGameContext.userData.extent = extent;

  game.start();
};

run();
