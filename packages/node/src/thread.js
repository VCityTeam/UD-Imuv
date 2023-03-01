const NodeGame = require('@ud-viz/node').Game;
const { GameScript, Constant } = require('@ud-imuv/shared');
const { Data, Game } = require('@ud-viz/shared');
const NodeConstant = require('./Constant');

GameScript.Map = NodeGame.ScriptTemplate.Map; // add @ud-viz/node script template

NodeGame.ThreadProcessRoutine(GameScript).then((threadContext) => {
  threadContext.gameContext.on(Constant.CONTEXT.EVENT.PORTAL, (data) => {
    // post portal event to main thread
    const message = {};
    message[NodeGame.Thread.KEY.TYPE] = NodeConstant.THREAD.EVENT.PORTAL;
    message[NodeGame.Thread.KEY.DATA] = data;
    threadContext.parentPort.postMessage(Data.objectToInt32Array(message));
  });

  threadContext.on(NodeConstant.THREAD.EVENT.PORTAL, (data) => {
    const portal = threadContext.gameContext.object3D.getObjectByProperty(
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

    return threadContext.gameContext.addObject3D(objectToAdd);
  });

  threadContext.on(NodeConstant.THREAD.EVENT.SPAWN, (avatarJSON) => {
    const avatar = new Game.Object3D(avatarJSON);
    return threadContext.gameContext.addObject3D(avatar).then(() => {
      const gameScriptController = avatar
        .getComponent(Game.Component.GameScript.TYPE)
        .getController();
      gameScriptController.getScripts()['Avatar'].spawn();

      console.log('spawn avatar in thread');
    });
  });
});
