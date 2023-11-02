import { ScriptBase } from '@ud-viz/game_browser';
import { AudioComponent } from '@ud-viz/game_shared';

export class PortalSweep extends ScriptBase {
  onEnter() {
    if (this.context.userData.editorMode) {
      console.warn('no portal sweep in editor mode');
      return;
    }

    const audioComp = this.object3D.getComponent(AudioComponent.TYPE);

    audioComp.getController().play('portal_in');

    const fadeInHtmlEl = document.createElement('div');
    fadeInHtmlEl.classList.add('fadeIn_GameView');
    document.body.appendChild(fadeInHtmlEl);

    // TODO fade out when avatar arrived in world
  }

  static get ID_SCRIPT() {
    return 'portal_sweep_id_ext_script';
  }
}
