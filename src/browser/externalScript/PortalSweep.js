import { ScriptBase } from '@ud-viz/game_browser';
import { AudioComponent } from '@ud-viz/game_shared';
import { ID } from '../../shared/constant';

export class PortalSweep extends ScriptBase {
  onEnter() {
    if (this.context.userData.editorMode) {
      console.warn('no portal sweep in editor mode');
      return;
    }

    const audioComp = this.object3D.getComponent(AudioComponent.TYPE);

    audioComp.getController().play(ID.SOUND.PORTAL_IN);

    const fadeInHtmlEl = document.createElement('div');
    fadeInHtmlEl.classList.add('fadeIn_GameView');
    document.body.appendChild(fadeInHtmlEl);

    // TODO fade out when avatar arrived in world
  }

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.PORTAL_SWEEP;
  }
}
