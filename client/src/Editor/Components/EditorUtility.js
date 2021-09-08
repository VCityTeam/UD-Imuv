const WorldScriptModule = require('ud-viz/src/Game/Shared/GameObject/Components/WorldScript');

module.exports = {
  computeMapGO(g) {
      let result = null;
    //find the map
    const wCxt = g.getStateComputer().getWorldContext();
    const world = wCxt.getWorld();
    world.getGameObject().traverse(function (child) {
      const ws = child.getComponent(WorldScriptModule.TYPE);
      if (ws && ws.idScripts.includes('map')) {
        result = child;
      }
    });

    return result;
  },
};
