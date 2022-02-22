const fs = require('fs');
const worldsJSON = require('../assets/worlds/worlds.json');
const Shared = require('../node_modules/ud-viz/src/Game/Shared/Shared');

Shared.Components.JSONUtils.parse(worldsJSON, function (json, key) {
  if (
    key == 'name' &&
    json.components &&
    json.components.LocalScript &&
    json.components.LocalScript.idScripts.includes('image')
  ) {
    json.components.LocalScript.conf = {
      path: json.components.LocalScript.conf.path,
      factorWidth: 3,
      factorHeight: 3,
      map_path:
        './assets/img/uploaded/8DA2C1D5-2E2A-4A52-8681-44044E78D171.jpeg',
      GPS_Coord: { Lng: null, Lat: null, checked: false },
    };
    json.transform.scale = [1, 1, 1];
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
