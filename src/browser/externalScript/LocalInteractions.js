import { ScriptBase } from '@ud-viz/game_browser';
import { ExternalScriptComponent } from '@ud-viz/game_shared';

import { UI } from './UI';

export class LocalInteractions extends ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    // /attr
    this.tickIsColliding = null;
    this.isCollidingLocalAvatar = false;
  }

  init() {
    this.initInputs();
  }

  tick() {
    if (this.tickIsColliding) {
      this.tickIsColliding();
    }

    let canInteract = false;
    const extScriptComp = this.object3D.getComponent(
      ExternalScriptComponent.TYPE
    );
    for (const [, script] of extScriptComp.getController().scripts) {
      if (this.canInteract(script)) {
        canInteract = true;
        break;
      }
    }

    const scriptUI = this.context.findExternalScriptWithID(UI.ID_SCRIPT);
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
      const extScriptComp = this.object3D.getComponent(
        ExternalScriptComponent.TYPE
      );
      for (const [, script] of extScriptComp.getController().scripts) {
        if (this.canInteract(script)) {
          script.interaction.call(script);
        }
      }
    });
  }

  canInteract(ls) {
    return this.isCollidingLocalAvatar && ls.interaction;
  }

  onOutdated() {
    const extScriptComp = this.object3D.getComponent(
      ExternalScriptComponent.TYPE
    );
    for (const [, script] of extScriptComp.getController().scripts) {
      if (
        this.variables.avatarsOnEnter.includes(
          this.context.userData.avatar.uuid
        )
      ) {
        if (script.onEnter) {
          script.onEnter.call(script);
        }
        this.tickIsColliding = null;
        this.isCollidingLocalAvatar = true;
      }

      if (
        this.variables.avatarsColliding.includes(
          this.context.userData.avatar.uuid
        )
      ) {
        if (script.onColliding) {
          this.tickIsColliding = script.onColliding.bind(script);
        }
        this.isCollidingLocalAvatar = true;
      }

      if (
        this.variables.avatarsOnLeave.includes(
          this.context.userData.avatar.uuid
        )
      ) {
        if (script.onLeave) {
          script.onLeave.call(script);
        }
        this.tickIsColliding = null;
        this.isCollidingLocalAvatar = false;
      }
    }
  }

  static get ID_SCRIPT() {
    return 'local_interactions_id_ext_script';
  }
}
