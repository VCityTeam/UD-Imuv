import { ExternalGame } from '@ud-viz/browser';
import { Game } from '@ud-viz/shared';

export class DisplayMedia extends ExternalGame.ScriptBase {
  onClick() {
    if (this.variables.iframe_src) {
      const scriptUI = this.context.findExternalScriptWithID('UI');
      scriptUI.displayIframe(this.variables.iframe_src);
    }

    if (this.variables.sound_id) {
      const audioComp = this.object3D.getComponent(Game.Component.Audio.TYPE);
      const sound = audioComp.getController().getSounds()[
        this.variables.sound_id
      ];
      if (sound.playing()) {
        sound.pause();
      } else {
        sound.play();
      }
    }
  }
}
