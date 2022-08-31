import { LocalScript } from 'ud-viz/src/Game/Game';
import File from 'ud-viz/src/Components/SystemUtils/File';

export class LocalScriptGeoProjectUI {
  constructor(goUI, gV) {
    //variables
    const content = goUI.content;
    const go = goUI.go;

    //get ls component
    const lsComp = go.getComponent(LocalScript.TYPE);
    if (!lsComp) throw new Error('no localscript');

    //create link input
    const inputLink = document.createElement('input');
    inputLink.type = 'text';
    inputLink.value = lsComp.conf.href; //init
    content.appendChild(inputLink);

    //init callback
    inputLink.onchange = function() {
      lsComp.conf.href = this.value;
    };

    //create width input
    const inputWidth = document.createElement('input');
    inputWidth.type = 'number';
    inputWidth.value = lsComp.conf.image_width;
    content.appendChild(inputWidth);

    inputWidth.onchange = function() {
      lsComp.conf.image_width = parseFloat(this.value);
      go.setOutdated(true);
      gV.forceUpdate();
    };

    //create height input
    const inputHeight = document.createElement('input');
    inputHeight.type = 'number';
    inputHeight.value = lsComp.conf.image_height;
    content.appendChild(inputHeight);

    inputHeight.onchange = function() {
      lsComp.conf.image_height = parseFloat(this.value);
      go.setOutdated(true);
      gV.forceUpdate();
    };

    //image icon
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    content.appendChild(imageInput);

    imageInput.onchange = function(e) {
      File.readSingleFileAsDataUrl(e, function(data) {
        const url = data.target.result;
        lsComp.conf.image_icon_path = url;
        go.setOutdated(true);
        gV.forceUpdate();
      });
    };
  }
}
