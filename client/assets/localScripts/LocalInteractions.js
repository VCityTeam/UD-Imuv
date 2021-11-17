/**@format */
let udviz = null;
let Shared = null;

module.exports = class LocalInteractions {
  constructor(conf, udvizBundle) {
    this.conf = conf;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    this.localScripts = Object.values(go.fetchLocalScripts());
    const indexThis = this.localScripts.indexOf(this);
    this.localScripts.splice(indexThis, 1);
    this.initInputs(localCtx);
  }

  initInputs(localCtx) {
    const conf = this.conf;
    const localScripts = this.localScripts;
    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();
    let interactionFunction;
    manager.addKeyInput('e', 'keydown', function () {
      localScripts.forEach((ls) => {
        if (conf.isColliding && (interactionFunction = ls.interaction)) {
          interactionFunction();
        }
      });
    });
  }

  update() {
    const conf = this.conf;
    let onEnterFunction, isCollidingFunction, onLeaveFunction;
    this.localScripts.forEach((ls) => {
      if (conf.onEnter && (onEnterFunction = ls.onEnter)) {
        onEnterFunction();
      }
      if (conf.isColliding && (isCollidingFunction = ls.isColliding)) {
        isCollidingFunction();
      }
      if (conf.onLeave && (onLeaveFunction = ls.onLeave)) {
        onLeaveFunction();
      }
    });
  }
};
