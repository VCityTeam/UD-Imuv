import WorldScriptModule from 'ud-viz/src/Game/GameObject/Components/WorldScript';

export function computeMapGO(g) {
  let result = null;
  // find the map
  const wCxt = g.getInterpolator().getWorldContext();
  const world = wCxt.getWorld();
  world.getGameObject().traverse(function (child) {
    const ws = child.getComponent(WorldScriptModule.TYPE);
    if (ws && ws.scriptParams.includes('map')) {
      result = child;
    }
  });

  return result;
}
