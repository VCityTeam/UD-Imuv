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

const SESSION_STORAGE_GAMEOBJECT3D_KEY = 'session_storage_gameobjects3D_key';

export const app = async () => {
  const user = await request(window.origin + '/verify_admin_token');
  if (!user) {
    alert('only admin can access editor');
  } else {
    let gameObjects3D = await request(window.origin + '/pull_gameobjects3D');
    console.log('pull_gameobjects3D ', gameObjects3D);

    const config = await loadJSON('./assets/config/config.json');
    const assetManager = new AssetManager();
    await assetManager.loadFromConfig(config.assetManager);

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
    frame3D.enableItownsViewRendering(false);

    // add layers
    addAllImuvLayers(frame3D.itownsView, extent);

    const editor = new Editor(frame3D, assetManager);
    editor.leftPan.classList.add('readable');

    window.addEventListener('keydown', (event) => {
      if (event.key == 'p') console.log(editor);
    });

    const buttonRunningGame = document.createElement('button');
    buttonRunningGame.innerText = 'Run';
    editor.toolsDomElement.appendChild(buttonRunningGame);
    buttonRunningGame.onclick = () => {
      // sessionStorage is used to send current gameobjects3D to editor_play.html
      sessionStorage.setItem(
        SESSION_STORAGE_GAMEOBJECT3D_KEY,
        JSON.stringify(editor.currentGameObject3D.toJSON())
      );
      window.open(window.origin + '/editor_play.html', '_blank').focus();
    };

    const ui = document.createElement('div');
    ui.classList.add('top_right');
    ui.classList.add('readable');
    document.body.appendChild(ui);

    // select a gameObject3D
    const selectGameObject3D = document.createElement('select');
    ui.appendChild(selectGameObject3D);

    gameObjects3D.forEach((g) => {
      const option = document.createElement('option');
      option.innerText = g.object.name;
      option.value = g.object.uuid;
      selectGameObject3D.appendChild(option);
    });

    const updateSelectedGameObject3D = () => {
      const uuidSelected = selectGameObject3D.selectedOptions[0].value;
      editor.setCurrentGameObject3D(
        new Object3D(
          gameObjects3D.filter((el) => el.object.uuid == uuidSelected)[0]
        )
      );
    };

    selectGameObject3D.onchange = () => {
      if (
        editor.currentGameObject3D &&
        confirm(
          'Sauvegarder en local ' + editor.currentGameObject3D.name + ' ?'
        )
      ) {
        gameObjects3D = gameObjects3D.map((el) => {
          if (el.object.uuid == editor.currentGameObject3D.uuid) {
            return editor.currentGameObject3D.toJSON(true, true);
          } else {
            return el;
          }
        });
      }
      updateSelectedGameObject3D();
    };
    updateSelectedGameObject3D();

    // save gameobject3D
    const saveButton = document.createElement('button');
    saveButton.innerText = 'Sauvegarder';
    ui.appendChild(saveButton);

    saveButton.onclick = async () => {
      if (confirm('Sauvegarder sur le serveur ?')) {
        await request(
          window.origin + '/save_gameObject3D',
          editor.currentGameObject3D.toJSON(true, true) // with metadata
        );
        alert('done');
      }
    };
  }
};

export const play = async () => {
  const user = await request(window.origin + '/verify_admin_token');
  if (!user) {
    alert('Only admin can access editor play');
  } else {
    let gameObject3DJSON = null;
    try {
      gameObject3DJSON = JSON.parse(
        sessionStorage.getItem(SESSION_STORAGE_GAMEOBJECT3D_KEY)
      );
    } catch {
      throw new Error('no gameobjects in sessionStorage');
    }

    const config = await loadJSON('./assets/config/config.json');
    const assetManager = new AssetManager();
    await assetManager.loadFromConfig(config.assetManager);

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

    const gameObject3D = new Object3D(gameObject3DJSON);

    const avatarGO = avatar('editor_avatar');
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

    singlePlanarProcess.externalGameContext.userData.avatar = avatarGO.toJSON();
    singlePlanarProcess.externalGameContext.userData.extent = extent;
    singlePlanarProcess.externalGameContext.userData.settings = {};
    singlePlanarProcess.externalGameContext.userData.user = {};

    singlePlanarProcess.start();
  }
};
