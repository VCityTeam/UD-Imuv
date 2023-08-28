import { LocalScript } from 'ud-viz/src/Game/Game';

export class LocalScriptJitsiAreaUI {
  constructor(goUI) {
    // variables
    const content = goUI.content;
    const go = goUI.go;

    // create UI
    // get ls component
    const lsComp = go.getComponent(LocalScript.TYPE);
    if (!lsComp) throw new Error('no localscript');

    // create input
    const input = document.createElement('input');
    input.type = 'text';
    input.value = lsComp.conf.jitsi_room_name; // init
    content.appendChild(input);

    // init callback
    input.onchange = function () {
      lsComp.conf.jitsi_room_name = this.value;
    };
  }
}
