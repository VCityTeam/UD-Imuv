export class LocalInteractions {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    Game = udvizBundle.Game;

    ///attr
    this.tickIsColliding = null;
    this.isCollidingLocalAvatar = false;
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
      if (this.canInteract(ls)) {
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
        if (_this.canInteract(ls)) {
          ls.interaction.call(ls, localCtx);
        }
      });
    });
  }

  canInteract(ls) {
    return this.isCollidingLocalAvatar && ls.interaction;
  }

  onOutdated() {
    const _this = this;
    const conf = this.conf;

    const localCtx = arguments[1];
    const avatarUUIDLC = localCtx.getGameView().getUserData('avatarUUID');
    this.localScripts.forEach((ls) => {
      if (conf.avatarsOnEnter.includes(avatarUUIDLC)) {
        if (ls.onEnter) {
          ls.onEnter.call(ls, arguments[0], arguments[1]);
        }
        _this.tickIsColliding = null;
        _this.isCollidingLocalAvatar = true;
      }

      if (conf.avatarsColliding.includes(avatarUUIDLC)) {
        if (ls.onColliding) {
          _this.tickIsColliding = ls.onColliding.bind(
            ls,
            arguments[0],
            arguments[1]
          );
        }
        _this.isCollidingLocalAvatar = true;
      }

      if (conf.avatarsOnLeave.includes(avatarUUIDLC)) {
        if (ls.onLeave) {
          ls.onLeave.call(ls, arguments[0], arguments[1]);
        }
        _this.tickIsColliding = null;
        _this.isCollidingLocalAvatar = false;
      }
    });
  }
}
