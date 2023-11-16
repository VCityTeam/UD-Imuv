import { loadJSON } from '@ud-viz/utils_browser';
import {
  eulerArrayFromURIComponent,
  vector3ArrayFromURIComponent,
} from '@ud-viz/utils_shared';
import {
  AssetManager,
  MultiPlanarProcess,
  SocketIOWrapper,
  InputManager,
} from '@ud-viz/game_browser';
import * as proj4 from 'proj4';
import * as itowns from 'itowns';
import { URL_PARAMETER } from '../../shared/constant';
import * as externalScript from '../externalScript/externalScript';

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
      computeBandWidth: DEBUG,
    }
  );

  // TODO : external scripts depend of this value that should not be the case
  // set global variables for external scripts
  game.externalGameContext.userData.extent = extent;

  // Compute readyForGameSocketServiceParams
  const readyForGameSocketServiceParams = {};

  const paramsUrl = new URLSearchParams(window.location.search);
  if (paramsUrl.has(URL_PARAMETER.ID_KEY)) {
    const id = paramsUrl.get(URL_PARAMETER.ID_KEY);
    let event = null;
    let wrongParams = false;
    const params = {};

    switch (id) {
      case URL_PARAMETER.EVENT.TELEPORT_AVATAR_GAMEOBJECT3D.ID_VALUE:
        event = URL_PARAMETER.EVENT.TELEPORT_AVATAR_GAMEOBJECT3D;
        // get params
        for (const key in event.PARAMS_KEY) {
          const paramsKey = encodeURI(event.PARAMS_KEY[key]);
          if (!paramsUrl.has(paramsKey)) {
            wrongParams = true;
          } else {
            params[paramsKey] = decodeURIComponent(paramsUrl.get(paramsKey));
          }
        }

        if (!wrongParams) {
          params[event.PARAMS_KEY.POSITION] = vector3ArrayFromURIComponent(
            params[event.PARAMS_KEY.POSITION]
          );
          params[event.PARAMS_KEY.ROTATION] = eulerArrayFromURIComponent(
            params[event.PARAMS_KEY.ROTATION]
          );
          readyForGameSocketServiceParams.entryGameObject3DUUID =
            params[event.PARAMS_KEY.GAMEOBJECT3DUUID];
          readyForGameSocketServiceParams.userData = {
            position: params[event.PARAMS_KEY.POSITION],
            rotation: params[event.PARAMS_KEY.ROTATION],
          };
        }

        break;
      default:
        console.warn('URL_PARAMETER ID not handle ', id);
    }
  }

  game.start(readyForGameSocketServiceParams);

  if (DEBUG) {
    window.addEventListener('keydown', (event) => {
      if (event.key == 'p') console.log(game);
    });
  }
};

run();
