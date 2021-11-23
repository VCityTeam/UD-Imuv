const fs = require('fs');
const worldsJSON = require('../assets/worlds/worlds.json');
const Shared = require('../node_modules/ud-viz/src/Game/Shared/Shared');

Shared.Components.JSONUtils.parse(worldsJSON, function (json, key) {
  if (key == 'name' && json[key].includes('UI_GO')) {
    //&& json[key][idScripts].includes('image')) {
    // json.components.Audio = {
    //   sounds: ['open_popup', 'close_popup'],
    //   conf: { shared: true },
    //   type: 'Audio',
    // };
    // delete json.components.LocalScript.conf['world_computer_dt'];
    // const array = json.components.LocalScript.idScripts;
    // const index = array.indexOf('ui');
    // array.splice(index, 1);
    // console.log(array);
    // json.components.LocalScript.idScripts

    // const uiGO = new Shared.GameObject({ name: 'UI_GO' });
    // const jsonGO = uiGO.toJSON(true);
    // jsonGO.components.LocalScript = {
    //   idScripts: ['ui'],
    //   conf: { world_computer_dt: null },
    // };
    // const finalGO = new Shared.GameObject(jsonGO);
    // json.children.push(finalGO.toJSON(true));
    json.components.WorldScript = {
      idScripts: ['ui'],
    };
    console.log(json);
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
