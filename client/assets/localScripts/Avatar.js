/**@format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class Avatar {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;

    this.onJump = false;
  }

  update() {
    if (this.conf.isOut && !this.onJump) {
      console.log('JUMP');
      this.onJump = true;

      //scope variables
      const _this = this;
      const localCtx = arguments[1];
      const rootGO = localCtx.getRootGameObject();

      //avatar_controller
      const avatarController = rootGO.fetchLocalScripts()['avatar_controller'];
      if (!avatarController) throw new Error('no avatar controller script');

      //remove avatar controls
      const avatarUnsetted = avatarController.setAvatarControllerMode(
        false,
        localCtx
      );
    }
  }
};
