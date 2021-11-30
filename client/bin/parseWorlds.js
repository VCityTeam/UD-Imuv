const fs = require('fs');
const worldsJSON = require('../assets/worlds/worlds.json');
const Shared = require('../node_modules/ud-viz/src/Game/Shared/Shared');

Shared.Components.JSONUtils.parse(worldsJSON, function (json, key) {
  if (key == 'name' && json[key].includes('Butterfly')) {
    json.components.LocalScript.idScripts = [
      'local_interactions',
      'butterfly_spawner',
    ];
    json.components.WorldScript.idScripts = ['interaction_zone'];
    console.log(
      json.components.LocalScript,
      json.components.WorldScript,
      json.components
    );
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

save();
