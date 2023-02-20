const fs = require('fs');
const worldsJSON = require('../assets/worlds/worlds.json');
const Game = require('ud-viz/src/Game/Game');

Game.Components.JSONUtils.parse(worldsJSON, function (json, key) {
  if (key == 'name' && json[key].includes('Portal')) {
    json.components.LocalScript.idScripts = [
      'rotate',
      'local_interactions',
      'portal_sweep',
    ];
    json.components.WorldScript.idScripts = ['portal', 'interaction_zone'];
    json.components.LocalScript.conf = { speed: 0.001 };
    // console.log(
    //   json.components.LocalScript,
    //   json.components.WorldScript,
    //   json.components
    // );
    // console.log(json.components.LocalScript.conf);
    console.log(json.components);
  }
});

const save = function () {
  fs.writeFile(
    './assets/worlds/worlds.json',
    JSON.stringify(worldsJSON),
    {
      encoding: 'utf8',
      flag: 'w',
      mode: 0o666,
    },
    function (err) {
      if (err) console.error(err);

      console.log('parse worlds');
    }
  );
};

// save();
