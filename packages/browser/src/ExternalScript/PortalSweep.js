import { ExternalGame } from '@ud-viz/browser';
import { Game } from '@ud-viz/shared';

export class PortalSweep extends ExternalGame.ScriptBase {
  onEnter() {
    if (this.context.userData.editorMode) {
      console.warn('no portal sweep in editor mode');
      return;
    }

    const audioComp = this.object3D.getComponent(Game.Component.Audio.TYPE);

    audioComp.getController().play('portal_in');

    const fadeInHtmlEl = document.createElement('div');
    fadeInHtmlEl.classList.add('fadeIn_GameView');
    document.body.appendChild(fadeInHtmlEl);

    //TODO fade out when avatar arrived in world
  }
}
