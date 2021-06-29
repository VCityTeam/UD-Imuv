import './TransformEditor.css';

import { THREE } from 'ud-viz/src/Game/Shared/Shared';
import { createTileGroupsFromBatchIDs } from 'ud-viz/src/Widgets/Components/3DTiles/3DTilesUtils';

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

  disposeCallbacks() {
    const canvas = this.parentWEV.parentEV.currentGameView.rootItownsHtml;
    canvas.onpointermove = null;
    canvas.onpointerup = null;
  }

  dispose() {
    this.disposeUI();
    this.disposeCallbacks();
    this.parentWEV.parentEV.transformControls.detach();
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
    selectedObject.innerHTML = 'Selected GO : ';
    this.selectedObject = selectedObject;

    const raycastedObject = document.createElement('p');
    this.ui.appendChild(raycastedObject);
    raycastedObject.innerHTML = 'Raycasted GO : ';
    this.raycastedObject = raycastedObject;
  }

  initCallbaks() {
    const _this = this;
    const currentGameView = _this.parentWEV.parentEV.currentGameView;
    const canvas = currentGameView.rootItownsHtml;
    const transformControls = _this.parentWEV.parentEV.transformControls;
    const orbitControls = _this.parentWEV.parentEV.orbitControls;
    const scene = currentGameView.getItownsView().scene;
    const manager = currentGameView.getInputManager();


    let rotatediff = 0;
    const getObjectOnHover = function (event) {
      //1. sets the mouse position with a coordinate system where the center of the screen is the origin
      const mouse = new THREE.Vector2(
        -1 + (2 * event.offsetX) / canvas.clientWidth,
        1 - (2 * event.offsetY) / canvas.clientHeight
      );

      //2. set the picking ray from the camera position and mouse coordinates
      const camera = currentGameView.getItownsView().camera.camera3D;
      const oldNear = camera.near;
      camera.near = 0;
      _this.raycaster.setFromCamera(mouse, camera);
      camera.near = oldNear;

      //3. compute intersections
      const intersects = _this.raycaster.intersectObject(
        currentGameView.getObject3D(),
        true
      );
      if (intersects.length > 0) {
        _this.model.setOnHoverGO(intersects[0].object);
      } else {
        _this.model.setOnHoverGO(null);
      }

      _this.raycastedObject.innerHTML =
        'Raycasted GO : ' + _this.model.getNameCurrentGO();
    };

    const attachTC = function () {
      if (!_this.model.selectedGO) return;

      transformControls.attach(_this.model.selectedGO);
      transformControls.updateMatrixWorld();
      scene.add(transformControls);
    };

    canvas.onpointermove = function (event) {
      if (event.buttons != 0) return; //stop raycast when rotating
      getObjectOnHover(event);
    };

    canvas.onpointerdown = function (event) {
      if (event.button != 0) return;
      rotatediff =
        orbitControls.getAzimuthalAngle() + orbitControls.getPolarAngle();
    };

    canvas.onpointerup = function (event) {
      if (event.button != 0) return;
      rotatediff -=
        orbitControls.getAzimuthalAngle() + orbitControls.getPolarAngle();
      rotatediff = Math.abs(rotatediff);
      if (transformControls.dragging || rotatediff > 0.01) return;
      _this.model.selectGO();
      _this.selectedObject.innerHTML =
        'Selected GO : ' + _this.model.getNameSelectedGO();
      attachTC();
    };

    manager.addKeyInput('Escape', 'keydown', function () {
      transformControls.detach();
      _this.model.setSelectedGO(null);
      _this.selectedObject.innerHTML =
        'Selected GO : ' + _this.model.getNameSelectedGO();
    });
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }
}

export class TransformEditorModel {
  constructor() {
    this.onHoverGO = null;
    this.selectedGO = null;
  }

  setSelectedGO(newGO) {
    if (newGO == this.selectedGO) return;
    this.selectedGO = newGO;
  }

  selectGO() {
    if (!this.onHoverGO) return;
    this.setSelectedGO(this.onHoverGO);
  }

  setOnHoverGO(newGO) {
    if (newGO) {
      newGO = this.getRootGO(newGO);
    }
    this.onHoverGO = newGO;
  }

  getRootGO(GO) {
    if (!GO.userData.gameObjectUUID && GO.parent) {
      return this.getRootGO(GO.parent);
    }
    return GO;
  }

  getNameCurrentGO() {
    if (this.onHoverGO) {
      return this.onHoverGO.name;
    } else {
      return 'No Current GO';
    }
  }

  getNameSelectedGO() {
    if (this.selectedGO) {
      return this.selectedGO.name;
    } else {
      return 'No Selected GO';
    }
  }
}