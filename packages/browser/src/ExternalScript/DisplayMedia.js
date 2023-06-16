import { Game, Shared } from '@ud-viz/browser';
import { UI } from './UI';
export class DisplayMedia extends Game.External.ScriptBase {
  onClick() {
    if (this.variables.iframe_src) {
      const scriptUI = this.context.findExternalScriptWithID(UI.ID_SCRIPT);
      scriptUI.displayIframe(this.variables.iframe_src);
    }

    if (this.variables.sound_id) {
      const audioComp = this.object3D.getComponent(
        Shared.Game.Component.Audio.TYPE
      );
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

  static get ID_SCRIPT() {
    return 'display_media_id_ext_script';
  }
}
