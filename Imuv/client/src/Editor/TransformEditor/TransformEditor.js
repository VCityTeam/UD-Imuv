import './TransformEditor.css';

import { THREE } from 'ud-viz/src/Game/Shared/Shared';

export class TransformEditorView {
  constructor(parentWEV) {
    this.parentWEV = parentWEV;

    this.model = new TransformEditorModel();

    //raycaster
    this.raycaster = new THREE.Raycaster();

    this.rootHtml = this.parentWEV.rootHtml;

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_Editor');
    this.ui.classList.add('ui_TransformEditor');
    this.rootHtml.appendChild(this.ui);

    this.labelTransformTool = null;

    this.closeButton = null;

    this.selectedObject = null;

    this.initUI();
    this.initCallbaks();
  }

  disposeUI() {
    this.ui.remove();
  }

  initUI() {
    const labelTransformTool = document.createElement('p');
    labelTransformTool.innerHTML =
      'Transform Tool <br>' + this.parentWEV.labelCurrentWorld.innerHTML;
    this.ui.appendChild(labelTransformTool);
    this.labelTransformTool = labelTransformTool;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'Close';
    this.ui.appendChild(closeButton);
    this.closeButton = closeButton;

    const selectedObject = document.createElement('p');
    this.ui.appendChild(selectedObject);
    this.selectedObject = selectedObject;
  }

  initCallbaks() {
    const _this = this;
    const canvas = _this.parentWEV.parentEV.currentGameView.rootItownsHtml;
    const getObjectOnHover = function (event) {
      //1. sets the mouse position with a coordinate system where the center of the screen is the origin
      const mouse = new THREE.Vector2(
        -1 + (2 * event.offsetX) / canvas.clientWidth,
        1 - (2 * event.offsetY) / canvas.clientHeight
      );
      //console.log("mouse", mouse);

      //2. set the picking ray from the camera position and mouse coordinates
      const camera =
        _this.parentWEV.parentEV.currentGameView.getItownsView().camera
          .camera3D;
      const oldNear = camera.near;
      camera.near = 0;
      _this.raycaster.setFromCamera(mouse, camera);
      camera.near = oldNear;

      //3. compute intersections
      _this.intersects = _this.raycaster.intersectObjects(
        _this.parentWEV.parentEV.currentGameView.object3D.children,true
      );
      const intersects = _this.intersects;
      if (intersects.length > 0) {
        _this.model.setCurrentGO(intersects[0].object);
      } else {
        _this.model.setCurrentGO(null);
      }

      _this.selectedObject.innerHTML =
        'GOSelected : ' + _this.model.getNameCurrentGO();
    };

    canvas.onpointermove = function (event) {
      if (event.buttons != 0) return; //stop raycast when rotating
      getObjectOnHover(event);
    };
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }
}

export class TransformEditorModel {
  constructor() {
    this.currentGO = null;
  }

  setCurrentGO(newGO) {
    this.currentGO = newGO;
  }

  getNameCurrentGO() {
    if (this.currentGO) {
      return this.currentGO.name;
    } else {
      return 'No Current GO';
    }
  }
}
