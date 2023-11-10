const { gameScript, constant } = require('../../src/shared/shared');
const { objectToInt32Array } = require('@ud-viz/utils_shared');
const { Object3D, GameScriptComponent } = require('@ud-viz/game_shared');
const { thread } = require('@ud-viz/game_node');
const { Map } = require('@ud-viz/game_node_template');
const { THREAD } = require('./constant');
const worker_threads = require('worker_threads');
const { COMMAND } = require('../../src/shared/constant');

const child = new thread.Child();
child.start({ ...gameScript, Map: Map });
child.on(thread.CHILD_EVENT.ON_GAME_CONTEXT_LOADED, () => {
  child.gameContext.on(constant.CONTEXT.EVENT.PORTAL, (data) => {
    // post portal event to main thread
    const message = {};
    message[thread.MESSAGE_KEY.TYPE] = THREAD.EVENT.PORTAL;
    message[thread.MESSAGE_KEY.DATA] = data;
    worker_threads.parentPort.postMessage(objectToInt32Array(message));
  });

  child.on(THREAD.EVENT.PORTAL, (data) => {
    const portal = child.gameContext.object3D.getObjectByProperty(
      'uuid',
      data.portalUUID
    );
    if (!portal) {
      throw new Error('no portal with ', data.portalUUID);
    }

    const objectToAdd = new Object3D(data.object3D);

    const gameScriptCompPortal = portal.getComponent(GameScriptComponent.TYPE);
    gameScriptCompPortal
      .getController()
      .scripts.get(gameScript.Portal.ID_SCRIPT)
      .setTransformOf(objectToAdd);

    return child.gameContext.addObject3D(objectToAdd);
  });

  child.on(THREAD.EVENT.SPAWN, (avatarJSON) => {
    const avatar = new Object3D(avatarJSON);
    return child.gameContext.addObject3D(avatar).then(() => {
      const spawner = child.gameContext.findGameScriptWithID(
        constant.ID.GAME_SCRIPT.SPAWNER
      );
      spawner.initializeSpawnTransform(avatar);

      console.log('spawn avatar in thread');
    });
  });

  child.on(THREAD.EVENT.EDIT_AVATAR, (newAvatar) => {
    const avatarGO = child.gameContext.object3D.getObjectByProperty(
      'uuid',
      newAvatar.uuid
    );

    const cityAvatar = child.gameContext.findGameScriptWithID(
      gameScript.Avatar.ID_SCRIPT,
      avatarGO
    ).cityAvatar;
    if (cityAvatar) {
      gameScript.MenuAvatar.editAvatar(cityAvatar, {
        idRenderData: newAvatar.components.Render.idRenderData,
        color: newAvatar.components.Render.color,
        textureFacePath:
          newAvatar.components.ExternalScript.variables.path_face_texture,
      });
    }

    gameScript.MenuAvatar.editAvatar(avatarGO, {
      idRenderData: newAvatar.components.Render.idRenderData,
      color: newAvatar.components.Render.color,
      textureFacePath:
        newAvatar.components.ExternalScript.variables.path_face_texture,
    });
  });

  child.gameContext.on(
    thread.MESSAGE_EVENT.ON_NEW_SOCKET_WRAPPER,
    (socketID) => {
      console.log('on new socket wrapper', socketID);
    }
  );

  child.gameContext.on(
    thread.MESSAGE_EVENT.ON_SOCKET_WRAPPER_REMOVE,
    (socketID) => {
      console.log('on socket wrapper remove', socketID);
    }
  );
});
