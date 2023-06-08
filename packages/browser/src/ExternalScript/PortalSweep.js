import { Game, Shared } from '@ud-viz/browser';

export class PortalSweep extends Game.External.ScriptBase {
  onEnter() {
    if (this.context.userData.editorMode) {
      console.warn('no portal sweep in editor mode');
      return;
    }

    const audioComp = this.object3D.getComponent(
      Shared.Game.Component.Audio.TYPE
    );

    audioComp.getController().play('portal_in');

    const fadeInHtmlEl = document.createElement('div');
    fadeInHtmlEl.classList.add('fadeIn_GameView');
    document.body.appendChild(fadeInHtmlEl);

    //TODO fade out when avatar arrived in world
  }
}
