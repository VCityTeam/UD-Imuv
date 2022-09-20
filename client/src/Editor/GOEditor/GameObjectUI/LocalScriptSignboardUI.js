import { GameObject, LocalScript } from 'ud-viz/src/Game/Game';
import { THREE } from 'ud-viz';

export class LocalScriptSignboardUI {
  constructor(goUI, gV) {
    //variables
    const content = goUI.content;
    const go = goUI.go;

    const uuid = go.getUUID();
    this.goInGame = gV.getLastState().getGameObject().find(uuid);
    this.render = this.goInGame.getComponent('Render');

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
    labelColor.innerHTML = 'Color';
    divColor.appendChild(labelColor);

    //create input
    const inputColor = document.createElement('input');
    inputColor.type = 'color';
    inputColor.value = lsComp.conf.colorFrameHex;
    divColor.appendChild(inputColor);
    this.inputColor = inputColor;
    content.appendChild(divColor);

    this.initCallback(lsComp);
  }

  rebuildMesh() {
    const meshes = this.render.getObject3D().children[0].children;
    this.render.setColor(new THREE.Color(this.inputColor.value));
    console.log('meshes', meshes);
    // for (const mesh of meshes) {
    //   if (mesh.name === 'frameFront') {
    //     mesh.material.map = null;
    //   } else {
    //     mesh.material.color.set(new THREE.Color(this.inputColor.value));

    //     mesh.material.needsUpdate = true;
    //   }
    // }
  }

  /**
   * > This function is called when the component is initialized. It sets up the callback functions for the input fields
   * @param {Object} lsComp - the component object
   */
  initCallback(lsComp) {
    const _this = this;
    this.inputHeight.onchange = function () {
      lsComp.conf.heightFrame = this.value;
      _this.rebuildMesh();
    };

    this.inputWidth.onchange = function () {
      lsComp.conf.widthFrame = this.value;
      _this.rebuildMesh();
    };

    this.inputColor.onchange = function () {
      _this.rebuildMesh();
    };
  }
}
