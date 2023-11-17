import { Editor } from '@ud-viz/game_editor';

import { addAllImuvLayers } from '../externalScript/component/imuvLayers';

import * as externalScript from '../externalScript/externalScript';
import { Map } from '@ud-viz/game_browser_template';

import { gameScript } from '../../shared/shared';

import { loadJSON } from '@ud-viz/utils_browser';

import { request } from '../utils/index';

import * as proj4 from 'proj4';

import { Extent } from 'itowns';

import './style.css';
import {
  AssetManager,
  InputManager,
  SinglePlanarProcess,
} from '@ud-viz/game_browser/src';
import { Object3D } from '@ud-viz/game_shared/src';
import { Planar } from '@ud-viz/frame3d';
import { avatar } from '../../shared/prefabFactory';

const runEditor = async () => {
  const user = await request(window.origin + '/verify_admin_token');
  if (!user) {
    alert('only admin can access editor');
  } else {
    const gameObjects3D = await request(window.origin + '/pull_gameobjects3D');
    console.log('pull_gameobjects3D ', gameObjects3D);

    const config = await loadJSON('./assets/config/config.json');

    proj4.default.defs(
      config['extent'].crs,
      '+proj=lcc +lat_1=45.25 +lat_2=46.75' +
        ' +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
    );

    const extent = new Extent(
      config['extent'].crs,
      parseInt(config['extent'].west),
      parseInt(config['extent'].east),
      parseInt(config['extent'].south),
      parseInt(config['extent'].north)
    );

    /** @type {Planar} */
    const frame3D = new Planar(extent, {
      hasItownsControls: false,
      domElementClass: 'full_screen',
    });

    // add layers
    addAllImuvLayers(frame3D.itownsView, extent);

    const assetManager = new AssetManager();
    const editor = new Editor(frame3D, assetManager); // load scripts needed to make works gameobject3D
    editor.leftPan.classList.add('readable');

    const buttonRunningGame = document.createElement('button');
    buttonRunningGame.innerText = 'Run';
    editor.toolsDomElement.appendChild(buttonRunningGame);
    buttonRunningGame.onclick = () => {
      editor.process.pause = true;
      editor.frame3D.domElement.remove();

      const avatarGO = avatar('editor_avatar');
      const gameObject3D = editor.currentGameObject3D.clone();
      gameObject3D.add(avatarGO);

      const singlePlanarProcess = new SinglePlanarProcess(
        gameObject3D,
        new Planar(extent, {
          hasItownsControls: false,
          domElementClass: 'full_screen',
          sceneConfig: config.scene,
        }),
        assetManager,
        new InputManager(),
        {
          gameScriptClass: { gameScript: gameScript, Map: Map },
          externalGameScriptClass: externalScript,
        }
      );

      singlePlanarProcess.externalGameContext.userData.avatar =
        avatarGO.toJSON();
      singlePlanarProcess.externalGameContext.userData.extent = extent;
      singlePlanarProcess.externalGameContext.userData.settings = {};
      singlePlanarProcess.externalGameContext.userData.user = {
        role: 'editor',
      };

      singlePlanarProcess.start();
    };

    await assetManager.loadFromConfig(config.assetManager);

    const selectGameObject3D = document.createElement('select');
    selectGameObject3D.classList.add('top_right');
    selectGameObject3D.classList.add('readable');

    gameObjects3D.forEach((g) => {
      const option = document.createElement('option');
      option.innerText = g.name;
      option.value = g.uuid;
      selectGameObject3D.appendChild(option);
    });

    document.body.appendChild(selectGameObject3D);

    const updateSelectedGameObject3D = async () => {
      const uuidSelected = selectGameObject3D.selectedOptions[0].value;
      editor.setCurrentGameObject3D(
        new Object3D(gameObjects3D.filter((el) => el.uuid == uuidSelected)[0])
      );
    };

    selectGameObject3D.onchange = updateSelectedGameObject3D;
    updateSelectedGameObject3D();
  }
};

runEditor();
