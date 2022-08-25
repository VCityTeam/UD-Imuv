import { LocalScript } from 'ud-viz/src/Game/Game';

export class LocalScriptJitsiAreaUI {
  constructor(goUI) {
    //variables
    const content = goUI.content;
    const go = goUI.go;

    //create UI
    const labelName = document.createElement('label');
    labelName.innerHTML = 'LocalScriptJitsiAreaUI';
    content.appendChild(labelName);
  }
}
