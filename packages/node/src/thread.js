const { Shared, Game } = require('@ud-viz/node');
const { GameScript, Constant } = require('@ud-imuv/shared');
const NodeConstant = require('./Constant');
const worker_threads = require('worker_threads');

GameScript.Map = Game.ScriptTemplate.Map; // add @ud-viz/node script template
const child = new Game.Thread.Child();
child.start(GameScript);
child.on(Game.Thread.CHILD_EVENT.ON_GAME_CONTEXT_LOADED, () => {
  child.gameContext.on(Constant.CONTEXT.EVENT.PORTAL, (data) => {
    // post portal event to main thread
    const message = {};
    message[Game.Thread.KEY.TYPE] = NodeConstant.THREAD.EVENT.PORTAL;
    message[Game.Thread.KEY.DATA] = data;
    worker_threads.parentPort.postMessage(
      Shared.Data.objectToInt32Array(message)
    );
  });

  child.on(NodeConstant.THREAD.EVENT.PORTAL, (data) => {
    const portal = child.gameContext.object3D.getObjectByProperty(
      'uuid',
      data.portalUUID
    );
    if (!portal) {
      throw new Error('no portal with ', data.portalUUID);
    }

    const objectToAdd = new Shared.Game.Object3D(data.object3D);

    const gameScriptCompPortal = portal.getComponent(
      Shared.Game.Component.GameScript.TYPE
    );
    gameScriptCompPortal
      .getController()
      .getScripts()
      ['Portal'].setTransformOf(objectToAdd);

    return child.gameContext.addObject3D(objectToAdd);
  });

  child.on(NodeConstant.THREAD.EVENT.SPAWN, (avatarJSON) => {
    const avatar = new Shared.Game.Object3D(avatarJSON);
    return child.gameContext.addObject3D(avatar).then(() => {
      const gameScriptController = avatar
        .getComponent(Shared.Game.Component.GameScript.TYPE)
        .getController();

      gameScriptController.getScripts()[GameScript.Avatar.ID_SCRIPT].spawn();

      console.log('spawn avatar in thread');
    });
  });

  child.gameContext.on(
    Game.Thread.MESSAGE_EVENT.ON_NEW_SOCKET_WRAPPER,
    (socketID) => {
      console.log('on new socket wrapper', socketID);
    }
  );

  child.gameContext.on(
    Game.Thread.MESSAGE_EVENT.ON_SOCKET_WRAPPER_REMOVE,
    (socketID) => {
      console.log('on socket wrapper remove', socketID);
    }
  );
});
