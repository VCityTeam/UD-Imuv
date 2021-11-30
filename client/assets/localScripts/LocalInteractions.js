/**@format */
let Shared;
module.exports = class LocalInteractions {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    this.tickIsColliding = null;
    Shared = udvizBundle.Game.Shared;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    this.localScripts = Object.values(go.fetchLocalScripts());
    const indexThis = this.localScripts.indexOf(this);
    this.localScripts.splice(indexThis, 1);
    this.initInputs(localCtx);
  }

  tick() {
    if (this.tickIsColliding) {
      this.tickIsColliding();
    }
  }

  initInputs(localCtx) {
    const _this = this;
    const localScripts = this.localScripts;
    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();
    const avatarUUIDLC = localCtx.getGameView().getUserData('avatarUUID');

    let interactionFunction;
    manager.addKeyInput('e', 'keydown', function () {
      localScripts.forEach((ls) => {
        if (
          _this.conf.avatarsColliding.includes(avatarUUIDLC) &&
          (interactionFunction = ls.interaction)
        ) {
          interactionFunction();
        }
      });
    });
  }

  update() {
    const _this = this;
    const conf = this.conf;
    let onEnterFunction, onCollidingFunction, onLeaveFunction;
    const localCtx = arguments[1];
    const avatarUUIDLC = localCtx.getGameView().getUserData('avatarUUID');
    this.localScripts.forEach((ls) => {
      if (conf.avatarsOnEnter.includes(avatarUUIDLC)) {
        if ((onEnterFunction = ls.onEnter)) {
          onEnterFunction.call(ls);
        }
        _this.tickIsColliding = null;
      }

      if (conf.avatarsColliding.includes(avatarUUIDLC)) {
        if ((onCollidingFunction = ls.onColliding)) {
          _this.tickIsColliding = onCollidingFunction.bind(ls);
        }
      }

      if (conf.avatarsOnLeave.includes(avatarUUIDLC)) {
        if ((onLeaveFunction = ls.onLeave)) {
          onLeaveFunction.call(ls);
        }
        _this.tickIsColliding = null;
      }
    });
  }
};
