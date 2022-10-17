/**@format */
let Game;
module.exports = class LocalInteractions {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    Game = udvizBundle.Game;

    ///attr
    this.tickIsColliding = null;
    this.localScripts = null;
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
    const go = arguments[0];

    if (this.tickIsColliding) {
      this.tickIsColliding();
    }

    const localCtx = arguments[1];
    let canInteract = false;
    for (let index = 0; index < this.localScripts.length; index++) {
      const ls = this.localScripts[index];
      if (this.canInteract(localCtx, ls)) {
        canInteract = true;
        break;
      }
    }

    const scriptUI = localCtx.findLocalScriptWithID('ui');
    const labelInfo = scriptUI.getLabelInfo();
    if (canInteract) {
      labelInfo.writeLabel(go.getUUID(), this.conf.label_interaction || 'E');
    } else {
      labelInfo.clear(go.getUUID());
    }
  }

  initInputs(localCtx) {
    const _this = this;
    const localScripts = this.localScripts;
    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();

    manager.addKeyInput('e', 'keydown', function () {
      localScripts.forEach((ls) => {
        if (_this.canInteract(localCtx, ls)) {
          ls.interaction.call(ls, localCtx);
        }
      });
    });
  }

  canInteract(localCtx, ls) {
    const avatarUUIDLC = localCtx.getGameView().getUserData('avatarUUID');
    return this.conf.avatarsColliding.includes(avatarUUIDLC) && ls.interaction;
  }

  onOutdated() {
    const _this = this;
    const conf = this.conf;
    let onEnterFunction, onCollidingFunction, onLeaveFunction;
    const localCtx = arguments[1];
    const avatarUUIDLC = localCtx.getGameView().getUserData('avatarUUID');
    this.localScripts.forEach((ls) => {
      if (conf.avatarsOnEnter.includes(avatarUUIDLC)) {
        if ((onEnterFunction = ls.onEnter)) {
          onEnterFunction.call(ls, arguments[0], arguments[1]);
        }
        _this.tickIsColliding = null;
      }

      if (conf.avatarsColliding.includes(avatarUUIDLC)) {
        if ((onCollidingFunction = ls.onColliding)) {
          _this.tickIsColliding = onCollidingFunction.bind(
            ls,
            arguments[0],
            arguments[1]
          );
        }
      }

      if (conf.avatarsOnLeave.includes(avatarUUIDLC)) {
        if ((onLeaveFunction = ls.onLeave)) {
          onLeaveFunction.call(ls, arguments[0], arguments[1]);
        }
        _this.tickIsColliding = null;
      }
    });
  }
};
