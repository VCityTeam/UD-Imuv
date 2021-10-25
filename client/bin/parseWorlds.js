const fs = require('fs');
const worldsJSON = require('../assets/worlds/worlds.json');
const Shared = require('../node_modules/ud-viz/src/Game/Shared/Shared');

Shared.Components.JSONUtils.parse(worldsJSON, function (json, key) {
  if (json[key] == 'LocalScript' && json['idScripts'].includes('image')) {
    json.conf.popup_position = { ratioX: Math.random(), ratioY: Math.random() };
  }
});

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
