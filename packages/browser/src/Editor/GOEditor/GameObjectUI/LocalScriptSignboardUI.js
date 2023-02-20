import { LocalScript } from 'ud-viz/src/Game/Game';
import File from 'ud-viz/src/Components/SystemUtils/File';

export class LocalScriptSignboardUI {
  constructor(goUI, gV) {
    //variables
    this.content = goUI.content;
    const go = goUI.go;

    const uuid = go.getUUID();
    this.goInGame = gV.getLastState().getGameObject().find(uuid);

    if (!this.goInGame.children[0]) {
      console.error('No child found for the signboard');
      return;
    }
    this.renderFrame = this.goInGame.children[0].getComponent('Render');

    //get ls component
    const lsComp = this.goInGame.getComponent(LocalScript.TYPE);
    if (!lsComp) throw new Error('no localscript');

    //init html
    this.inputColor = null;
    this.inputImageURL = null;
    this.inputImageFile = null;
    this.inputSizeFactor = null;

    this.initHtml(lsComp);
    this.initCallback(lsComp);
  }

  initHtml(lsComp) {
    const content = this.content;

    //title
    const titleSignboard = document.createElement('h3');
    titleSignboard.innerHTML = 'Signboard:';
    content.appendChild(titleSignboard);

    //create Color Label
    const divColor = document.createElement('div');
    const labelColor = document.createElement('label');
    labelColor.innerHTML = 'Color Frame';
    divColor.appendChild(labelColor);

    //create Color input
    const inputColor = document.createElement('input');
    inputColor.type = 'color';
    inputColor.value = '#' + this.renderFrame.color.getHexString();
    divColor.appendChild(inputColor);
    this.inputColor = inputColor;
    content.appendChild(divColor);

    //create Image URL Label
    const divImageUrl = document.createElement('div');
    const labelImageUrl = document.createElement('label');
    labelImageUrl.innerHTML = 'Image URL';
    divImageUrl.appendChild(labelImageUrl);

    //create Input Image URL
    const inputImageURL = document.createElement('input');
    inputImageURL.type = 'text';
    inputImageURL.placeholder = 'https://example.com/image.png';
    inputImageURL.value = lsComp.conf.imageURL
      ? lsComp.conf.imageURL.substring(0, 42) + '...'
      : '';
    divImageUrl.appendChild(inputImageURL);
    this.inputImageURL = inputImageURL;
    content.appendChild(divImageUrl);

    //create Image File Label
    const divImageFile = document.createElement('div');
    const labelImageFile = document.createElement('label');
    labelImageFile.innerHTML = 'Image File';
    divImageFile.appendChild(labelImageFile);

    //create Input Image File
    const inputImageFile = document.createElement('input');
    inputImageFile.type = 'file';
    inputImageFile.accept = 'image/*';
    divImageFile.appendChild(inputImageFile);
    this.inputImageFile = inputImageFile;
    content.appendChild(divImageFile);

    //create Size Factor Label
    const divSizeFactor = document.createElement('div');
    const labelSizeFactor = document.createElement('label');
    labelSizeFactor.innerHTML = 'Size Factor';
    divSizeFactor.appendChild(labelSizeFactor);

    //create Input Size Factor
    const inputSizeFactor = document.createElement('input');
    inputSizeFactor.type = 'number';
    inputSizeFactor.value = lsComp.conf.sizeFactor;
    inputSizeFactor.step = 0.1;
    divSizeFactor.appendChild(inputSizeFactor);
    this.inputSizeFactor = inputSizeFactor;
    content.appendChild(divSizeFactor);
  }

  /**
   * > This function is called when the component is initialized. It sets up the callback functions for the input fields
   * @param {Object} lsComp - the component object
   */
  initCallback(lsComp) {
    const lsSignboard = this.goInGame.fetchLocalScripts()['signboard'];
    this.inputColor.oninput = function () {
      lsComp.conf.colorFrame = this.value;
      lsSignboard.changeColorRenderFrame.call(lsSignboard, this.value);
    };

    const imgTest = document.createElement('img');
    imgTest.onload = () => {
      lsComp.conf.imageURL = this.inputImageURL.value;
      lsSignboard.buildMesh.call(lsSignboard);
    };
    imgTest.onerror = () => {
      alert('The URL is not valid');
    };
    this.inputImageURL.onchange = function () {
      if (this.value == '') {
        lsSignboard.buildMesh.call(lsSignboard, true);
      } else {
        imgTest.src = this.value;
      }
    };

    this.inputSizeFactor.oninput = function () {
      lsComp.conf.sizeFactor = this.valueAsNumber;
      lsSignboard.buildMesh.call(lsSignboard);
    };

    this.inputImageFile.onchange = function (e) {
      File.readSingleFileAsDataUrl(e, function (data) {
        const url = data.target.result;
        lsComp.conf.imageURL = url;
        lsSignboard.buildMesh.call(lsSignboard);
      });
    };
  }
}
