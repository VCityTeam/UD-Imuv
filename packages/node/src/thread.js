const udvizNode = require('@ud-viz/node');
const { GameScript, Constant } = require('@ud-imuv/shared');
const { Data, Game } = require('@ud-viz/shared');
const NodeConstant = require('./Constant');
const worker_threads = require('worker_threads');

GameScript.Map = udvizNode.Game.ScriptTemplate.Map; // add @ud-viz/node script template
const child = new udvizNode.Game.Thread.Child();
child.start(GameScript);
child.on(udvizNode.Game.Thread.CHILD_EVENT.ON_GAME_CONTEXT_LOADED, () => {
  child.gameContext.on(Constant.CONTEXT.EVENT.PORTAL, (data) => {
    // post portal event to main thread
    const message = {};
    message[udvizNode.Game.Thread.KEY.TYPE] = NodeConstant.THREAD.EVENT.PORTAL;
    message[udvizNode.Game.Thread.KEY.DATA] = data;
    worker_threads.parentPort.postMessage(Data.objectToInt32Array(message));
  });

  child.on(NodeConstant.THREAD.EVENT.PORTAL, (data) => {
    const portal = child.gameContext.object3D.getObjectByProperty(
      'uuid',
      data.portalUUID
    );
    if (!portal) {
      throw new Error('no portal with ', data.portalUUID);
    }

    const objectToAdd = new Game.Object3D(data.object3D);

    const gameScriptCompPortal = portal.getComponent(
      Game.Component.GameScript.TYPE
    );
    gameScriptCompPortal
      .getController()
      .getScripts()
      ['Portal'].setTransformOf(objectToAdd);

    return child.gameContext.addObject3D(objectToAdd);
  });

  child.on(NodeConstant.THREAD.EVENT.SPAWN, (avatarJSON) => {
    const avatar = new Game.Object3D(avatarJSON);
    return child.gameContext.addObject3D(avatar).then(() => {
      const gameScriptController = avatar
        .getComponent(Game.Component.GameScript.TYPE)
        .getController();
      gameScriptController.getScripts()['Avatar'].spawn();

      console.log('spawn avatar in thread');
    });
  });
});
