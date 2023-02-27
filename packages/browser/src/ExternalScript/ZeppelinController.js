import { ExternalGame, ExternalScriptTemplate } from '@ud-viz/browser';

export class ZeppelinController extends ExternalGame.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    //Zeppelin controller
    this.zeppelinControllerMode = false;

    this.commandController = null;
  }

  init() {
    this.commandController = new ExternalScriptTemplate.CommandController(
      this.context.inputManager
    );
  }

  getZeppelinControllerMode() {
    return this.zeppelinControllerMode;
  }

  setZeppelinControllerMode(value) {
    let zeppelinGO = null;
    this.context.object3D.traverse((child) => {
      if (child.userData.isZeppelin) {
        zeppelinGO = child;
        return true; // stop propagation
      }
      return false; // continue to traverse
    });

    if (!zeppelinGO) throw new Error('no zeppelin');

    if (value == this.zeppelinControllerMode) {
      console.warn('same value');
      return false;
    }

    this.zeppelinControllerMode = value;

    if (value) {
      const refine = this.context.findExternalScriptWithID('ItownsRefine');
      if (refine) refine.zeppelin();
      this.commandController.addNativeCommands(zeppelinGO.uuid);
      this.context.inputManager.setPointerLock(false);
    } else {
      this.commandController.removeNativeCommands();
    }

    return true;
  }
}
