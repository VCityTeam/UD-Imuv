import { LocalScript } from 'ud-viz/src/Game/Game';

export class LocalScriptCameraTourUI {
  constructor(goUI, gV) {
    // variables
    const content = goUI.content;
    const go = goUI.go;

    // get ls component
    const lsComp = go.getComponent(LocalScript.TYPE);
    if (!lsComp) throw new Error('no localscript');

    this.rootHtml = document.createElement('div');
    content.appendChild(this.rootHtml);

    this.buildUI(go, gV);
  }

  buildUI(go, gV) {
    const _this = this;

    while (this.rootHtml.firstChild) {
      this.rootHtml.firstChild.remove();
    }

    const lsComp = go.getComponent(LocalScript.TYPE);
    if (!lsComp) throw new Error('no localscript');

    lsComp.conf.camera_transforms.forEach(function (ct, index) {
      // focus
      const focusButton = document.createElement('button');
      focusButton.innerHTML = 'Focus ' + index;
      _this.rootHtml.appendChild(focusButton);

      // delete
      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = 'Delete ' + index;
      _this.rootHtml.appendChild(deleteButton);

      // backspace
      const br = document.createElement('div');
      br.innerHTML = '<br>';
      _this.rootHtml.appendChild(br);

      // callback
      deleteButton.onclick = function () {
        lsComp.conf.camera_transforms.splice(index, 1);
        _this.buildUI(go, gV);
      };

      focusButton.onclick = function () {
        const camera = gV.getCamera();
        camera.position.fromArray(ct.position);
        camera.quaternion.fromArray(ct.quaternion);
        camera.updateProjectionMatrix();
      };
    });

    const addCameraTransform = document.createElement('button');
    addCameraTransform.innerHTML = 'Add Camera Transform';
    this.rootHtml.appendChild(addCameraTransform);

    addCameraTransform.onclick = function () {
      // add camera transform in conf
      const camera = gV.getCamera();
      const position = camera.position.toArray();
      const quaternion = camera.quaternion.toArray();

      lsComp.conf.camera_transforms.push({
        position: position,
        quaternion: quaternion,
      });

      _this.buildUI(go, gV);
    };
  }
}
