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
    let interactionFunction;
    manager.addKeyInput('e', 'keydown', function () {
      localScripts.forEach((ls) => {
        if (_this.conf.isColliding && (interactionFunction = ls.interaction)) {
          interactionFunction();
        }
      });
    });
  }

  update() {
    const _this = this;
    const conf = this.conf;
    let onEnterFunction, onCollidingFunction, onLeaveFunction;
    this.localScripts.forEach((ls) => {
      if (conf.onEnter && (onEnterFunction = ls.onEnter)) {
        onEnterFunction();
        _this.tickIsColliding = null;
      }
      if (conf.isColliding && (onCollidingFunction = ls.onColliding)) {
        _this.tickIsColliding = onCollidingFunction;
      }
      if (conf.onLeave && (onLeaveFunction = ls.onLeave)) {
        onLeaveFunction();
        _this.tickIsColliding = null;
      }
    });
  }
};
