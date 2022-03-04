/**@format */

module.exports = class ZeppelinStart {
  constructor() {}

  init() {}

  onEnter() {
    console.log('onEnter ZeppelinStart');
  }

  onColliding() {
    console.log('onColliding ZeppelinStart');
  }

  onLeave() {
    console.log('onLeave ZeppelinStart');
  }

  interaction(localCtx) {
    console.log('interaction ZeppelinStart');
    const rootGO = localCtx.getRootGameObject();
    const controller = rootGO.fetchLocalScripts()['controller'];
    controller.setAvatarControllerMode(false, localCtx);
    controller.setZeppelinControllerMode(true, localCtx);
  }
};
