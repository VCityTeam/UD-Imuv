/** @format */

const fs = require("fs");
const JSONUtils = require("ud-viz/src/Game/Components/JSONUtils");
const Game = require("ud-viz/src/Game/Game");

//server manager load script
module.exports = class AssetsManagerServer {
  constructor() {
    this.worldScripts = {};
    this.prefabs = {};
  }

  loadFromConfig(config) {
    const worldScripts = this.worldScripts;
    const prefabs = this.prefabs;

    if (!config) throw new Error("no config");

    const toEvalCode = function (string) {
      const regexRequire = /^const.*=\W*\n*.*require.*;$/gm;
      const regexType = /^\/\*\*\W*@type.*\*\/$/gm;
      let resultRequire = string.replace(regexRequire, "");
      return resultRequire.replace(regexType, "");
    };

    const worldScriptsPromise = new Promise((resolve, reject) => {
      let count = 0;
      for (let idScript in config.worldScripts) {
        fs.readFile(config.worldScripts[idScript].path, "utf8", (err, data) => {
          if (err) {
            reject();
          }
          worldScripts[idScript] = eval(toEvalCode(data));

          count++;

          if (count == Object.keys(config.worldScripts).length) {
            // console.log('worldScripts loaded ', worldScripts);
            resolve();
          }
        });
      }
    });

    const prefabsPromise = new Promise((resolve, reject) => {
      let count = 0;
      for (let idPrefab in config.prefabs) {
        fs.readFile(config.prefabs[idPrefab].path, "utf8", (err, data) => {
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

    return Promise.all([worldScriptsPromise, prefabsPromise]);
  }

  fetchWorldScript(idScript) {
    if (!this.worldScripts[idScript])
      console.error("no world script with id ", idScript);
    return this.worldScripts[idScript];
  }

  createPrefab(idprefab) {
    if (!this.prefabs[idprefab]) console.error("no prefab with id ", idprefab);
    return new Game.GameObject(this.prefabs[idprefab]);
  }

  fetchPrefabJSON(idprefab) {
    if (!this.prefabs[idprefab]) console.error("no prefab with id ", idprefab);
    return JSON.parse(JSON.stringify(this.prefabs[idprefab]));
  }

  //TODO waiting the avatar full customization to remove !
  createAvatarJSON() {
    const json = this.fetchPrefabJSON("avatar");
    JSONUtils.parse(json, function (j, k) {
      if (k == "idRenderData") {
        const random = Math.random();

        if (random < 0.33) {
          j[k] = "avatar_petit";
        } else if (random < 0.66) {
          j[k] = "avatar_moyen";
        } else {
          j[k] = "avatar_grand";
        }
      }
    });

    return json;
  }
};
