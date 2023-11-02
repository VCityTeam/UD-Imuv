import { ScriptBase } from '@ud-viz/game_browser';
import { AudioComponent } from '@ud-viz/game_shared';

import { UI } from './UI';
export class DisplayMedia extends ScriptBase {
  onClick() {
    if (this.variables.iframe_src) {
      const scriptUI = this.context.findExternalScriptWithID(UI.ID_SCRIPT);
      scriptUI.displayIframe(this.variables.iframe_src);
    }

    if (this.variables.sound_id) {
      const audioComp = this.object3D.getComponent(AudioComponent.TYPE);
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
