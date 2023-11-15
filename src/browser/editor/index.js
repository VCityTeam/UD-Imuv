import { Editor } from '@ud-viz/game_editor';

import * as externalScripts from '../externalScript/externalScript';
import { gameScript } from '../../shared/shared';

import { loadJSON } from '@ud-viz/utils_browser';

import { request } from '../utils/index';

import * as proj4 from 'proj4';

import { Extent } from 'itowns';

import './style.css';

const ui = document.createElement('div');
ui.classList.add('ui');
document.body.appendChild(ui);

const editor = new Editor(externalScripts, gameScript); // load scripts needed to make works gameobject3D

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

    const selectGameObject3D = document.createElement('select');
    gameObjects3D.forEach((g) => {
      const option = document.createElement('option');
      option.innerText = g.name;
      option.value = g.uuid;
      selectGameObject3D.appendChild(option);
    });

    ui.appendChild(selectGameObject3D);

    const updateSelectedGameObject3D = async () => {
      const uuidSelected = selectGameObject3D.selectedOptions[0].value;
      await editor.load(
        extent,
        gameObjects3D.filter((el) => el.uuid == uuidSelected)[0]
      );
    };

    selectGameObject3D.onchange = updateSelectedGameObject3D;
    updateSelectedGameObject3D();
  }
};

runEditor();
