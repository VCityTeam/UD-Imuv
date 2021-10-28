const fs = require('fs');
const worldsJSON = require('../assets/worlds/worlds.json');
const Shared = require('../node_modules/ud-viz/src/Game/Shared/Shared');

Shared.Components.JSONUtils.parse(worldsJSON, function (json, key) {
  if (key == 'name' && json[key].includes('Image')) {
    //&& json[key][idScripts].includes('image')) {
    json.components.Audio = {
      sounds: ['open_popup', 'close_popup'],
      conf: { shared: true },
      type: 'Audio',
    };
    // console.log(json);
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
