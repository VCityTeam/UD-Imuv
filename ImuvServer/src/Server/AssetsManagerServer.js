/** @format */

const fs = require('fs');
const Shared = require('ud-viz/src/Game/Shared/Shared');

//server manager load script
module.exports = class AssetsManagerServer {
  constructor() {
    this.scripts = {};
    this.prefabs = {};
  }

  loadFromConfig(config) {
    const scripts = this.scripts;
    const prefabs = this.prefabs;

    const scriptsPromise = new Promise((resolve, reject) => {
      let count = 0;
      for (let idScript in config.scripts) {
        fs.readFile(config.scripts[idScript].path, 'utf8', (err, data) => {
          if (err) {
            reject();
          }
          scripts[idScript] = eval(data);

          count++;

          if (count == Object.keys(config.scripts).length) {
            // console.log('Scripts loaded ', scripts);
            resolve();
          }
        });
      }
    });

    const prefabsPromise = new Promise((resolve, reject) => {
      let count = 0;
      for (let idPrefab in config.prefabs) {
        fs.readFile(config.prefabs[idPrefab].path, 'utf8', (err, data) => {
          if (err) {
            reject();
          }
          prefabs[idPrefab] = JSON.parse(data);

          count++;

          if (count == Object.keys(config.prefabs).length) {
            // console.log('Prefabs loaded ', prefabs);
            resolve();
          }
        });
      }
    });

    return Promise.all([scriptsPromise, prefabsPromise]);
  }

  fetchScript(idScript) {
    if (!this.scripts[idScript]) console.error('no script with id ', idScript);
    return this.scripts[idScript];
  }

  fetchPrefab(idprefab) {
    if (!this.prefabs[idprefab]) console.error('no prefab with id ', idprefab);
    return new Shared.GameObject(this.prefabs[idprefab]);
  }

  fetchPrefabJSON(idprefab) {
    if (!this.prefabs[idprefab]) console.error('no prefab with id ', idprefab);
    return JSON.parse(JSON.stringify(this.prefabs[idprefab]));
  }
};
