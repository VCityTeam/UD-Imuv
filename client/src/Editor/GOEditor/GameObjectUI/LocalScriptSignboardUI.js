import { LocalScript } from 'ud-viz/src/Game/Game';
import { THREE } from 'ud-viz';

export class LocalScriptSignboardUI {
  constructor(goUI, gV) {
    //variables
    const content = goUI.content;
    const go = goUI.go;

    const uuid = go.getUUID();
    this.goInGame = gV.getLastState().getGameObject().find(uuid);
    this.renderFrame = this.goInGame.children[0].getComponent('Render');

    //create UI
    //get ls component
    const lsComp = go.getComponent(LocalScript.TYPE);
    if (!lsComp) throw new Error('no localscript');

    const titleSignboard = document.createElement('div');
    titleSignboard.innerHTML = 'Signboard:';
    content.appendChild(titleSignboard);

    //create Height Label
    const divHeight = document.createElement('div');
    const labelHeight = document.createElement('label');
    labelHeight.innerHTML = 'Height';
    divHeight.appendChild(labelHeight);

    //create input
    const inputHeight = document.createElement('input');
    inputHeight.type = 'number';
    inputHeight.value = lsComp.conf.heightFrame; //init
    divHeight.appendChild(inputHeight);
    this.inputHeight = inputHeight;
    content.appendChild(divHeight);

    //create Width Label
    const divWidth = document.createElement('div');
    const labelWidth = document.createElement('label');
    labelWidth.innerHTML = 'Width';
    divWidth.appendChild(labelWidth);

    //create input
    const inputWidth = document.createElement('input');
    inputWidth.type = 'number';
    inputWidth.value = lsComp.conf.widthFrame; //init
    divWidth.appendChild(inputWidth);
    this.inputWidth = inputWidth;
    content.appendChild(divWidth);

    //create Color Label
    const divColor = document.createElement('div');
    const labelColor = document.createElement('label');
    labelColor.innerHTML = 'Color Frame';
    divColor.appendChild(labelColor);

    //create input
    const inputColor = document.createElement('input');
    inputColor.type = 'color';
    inputColor.value = '#' + this.renderFrame.color.getHexString();
    divColor.appendChild(inputColor);
    this.inputColor = inputColor;
    content.appendChild(divColor);

    this.initCallback(lsComp);
  }

  rebuildMesh() {
    const meshes = this.renderFrame.getObject3D().children[0].children;
    this.renderFrame.setColor(new THREE.Color(this.inputColor.value));
    console.log('meshes', meshes);
  }

  /**
   * > This function is called when the component is initialized. It sets up the callback functions for the input fields
   * @param {Object} lsComp - the component object
   */
  initCallback(lsComp) {
    const _this = this;
    this.inputHeight.oninput = function () {
      lsComp.conf.heightFrame = this.value;
      _this.rebuildMesh();
    };

    this.inputWidth.oninput = function () {
      lsComp.conf.widthFrame = this.value;
      _this.rebuildMesh();
    };

    this.inputColor.oninput = function () {
      _this.rebuildMesh();
    };
  }
}
