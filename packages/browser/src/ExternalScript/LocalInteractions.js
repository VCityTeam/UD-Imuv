import { ExternalGame } from '@ud-viz/browser';
import { Game } from '@ud-viz/shared';

export class LocalInteractions extends ExternalGame.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    ///attr
    this.tickIsColliding = null;
    this.isCollidingLocalAvatar = false;
    this.externalScripts = null;
  }

  init() {
    const externalComp = this.object3D.getComponent(
      Game.Component.ExternalScript.TYPE
    );
    this.externalScripts = Object.values(
      externalComp.getController().getScripts()
    );
    console.log(this.externalScripts);

    this.initInputs();
  }

  tick() {
    if (this.tickIsColliding) {
      this.tickIsColliding();
    }

    let canInteract = false;
    for (let index = 0; index < this.externalScripts.length; index++) {
      const ls = this.externalScripts[index];
      if (this.canInteract(ls)) {
        canInteract = true;
        break;
      }
    }

    const scriptUI = this.context.findExternalScriptWithID('UI');
    const labelInfo = scriptUI.getLabelInfo();
    if (canInteract) {
      labelInfo.writeLabel(
        this.object3D.uuid,
        this.variables.label_interaction || 'E'
      );
    } else {
      labelInfo.clear(this.object3D.uuid);
    }
  }

  initInputs() {
    this.context.inputManager.addKeyInput('e', 'keydown', () => {
      this.externalScripts.forEach((ls) => {
        if (this.canInteract(ls)) {
          ls.interaction.call(ls);
        }
      });
    });
  }

  canInteract(ls) {
    return this.isCollidingLocalAvatar && ls.interaction;
  }

  onOutdated() {
    this.externalScripts.forEach((ls) => {
      if (
        this.variables.avatarsOnEnter.includes(this.context.userData.avatarUUID)
      ) {
        console.log(this.object3D.name, 'on enter');
        if (ls.onEnter) {
          ls.onEnter.call(ls);
        }
        this.tickIsColliding = null;
        this.isCollidingLocalAvatar = true;
      }

      if (
        this.variables.avatarsColliding.includes(
          this.context.userData.avatarUUID
        )
      ) {
        console.log(this.object3D.name, 'colliding');
        if (ls.onColliding) {
          this.tickIsColliding = ls.onColliding.bind(ls);
        }
        this.isCollidingLocalAvatar = true;
      }

      if (
        this.variables.avatarsOnLeave.includes(this.context.userData.avatarUUID)
      ) {
        console.log(this.object3D.name, 'on leave');
        if (ls.onLeave) {
          ls.onLeave.call(ls);
        }
        this.tickIsColliding = null;
        this.isCollidingLocalAvatar = false;
      }
    });
  }
}
