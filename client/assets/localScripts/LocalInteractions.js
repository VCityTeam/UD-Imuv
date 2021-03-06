/**@format */
let Game;
module.exports = class LocalInteractions {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    Game = udvizBundle.Game;

    ///attr
    this.tickIsColliding = null;
    this.localScripts = null;

    //html
    this.interactionLabel = document.createElement('div');
    this.interactionLabel.innerHTML =
      this.conf['label_interaction'] || 'Press E';
    this.interactionLabel.classList.add('hidden');
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    this.localScripts = Object.values(go.fetchLocalScripts());
    const indexThis = this.localScripts.indexOf(this);
    this.localScripts.splice(indexThis, 1);
    this.initInputs(localCtx);

    //append can interact info html to gv ui
    localCtx.getGameView().appendToUI(this.interactionLabel);
  }

  tick() {
    if (this.tickIsColliding) {
      this.tickIsColliding();
    }
    const localCtx = arguments[1];
    const _this = this;
    let canInteract = false;
    for (let index = 0; index < this.localScripts.length; index++) {
      const ls = this.localScripts[index];
      if (_this.canInteract(localCtx, ls)) {
        canInteract = true;
        break;
      }
    }
    if (canInteract) {
      this.interactionLabel.classList.remove('hidden');
    } else {
      this.interactionLabel.classList.add('hidden');
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
