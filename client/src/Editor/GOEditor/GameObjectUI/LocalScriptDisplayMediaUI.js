import { LocalScript } from 'ud-viz/src/Game/Game';

export class LocalScriptDisplayMediaUI {
  constructor(goUI) {
    //variables
    const content = goUI.content;
    const go = goUI.go;

    //title
    const titleDisplayMedia = document.createElement('h3');
    titleDisplayMedia.innerHTML = 'DisplayMedia:';
    content.appendChild(titleDisplayMedia);

    //add a label to the input iframe_src
    const label = document.createElement('div');
    label.innerHTML = 'Lien iframe';
    content.appendChild(label);

    //get ls component
    const lsComp = go.getComponent(LocalScript.TYPE);
    if (!lsComp) throw new Error('no localscript');

    //create input
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'http:// || https:// || ./*.html';
    input.value = lsComp.conf.iframe_src || ''; //init
    content.appendChild(input);

    //init callback
    input.onchange = function () {
      lsComp.conf.iframe_src = this.value;
    };
  }
}
