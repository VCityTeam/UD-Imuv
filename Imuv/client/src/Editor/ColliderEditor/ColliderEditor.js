import './ColliderEditor.css';

import { THREE } from 'ud-viz/src/Game/Shared/Shared';

export class ColliderEditorView {
  constructor(parentWEV) {
    this.parentWEV = parentWEV;

    this.model = new ColliderEditorModel();

    //raycaster
    this.raycaster = new THREE.Raycaster();

    this.rootHtml = this.parentWEV.rootHtml;

    this.canvas = this.parentWEV.parentEV.currentGameView.rootItownsHtml;

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_Editor');
    this.ui.classList.add('ui_ColliderEditor');
    this.rootHtml.appendChild(this.ui);

    this.labelColliderTool = null;

    this.closeButton = null;
    this.addButton = null;

    this.scene = new THREE.Scene();

    this.initUI();
    this.initCallbacks();
  }

  disposeUI() {
    this.ui.remove();
  }

  disposeCallbacks() {}

  dispose() {
    this.disposeUI();
    this.disposeCallbacks();
  }

  initUI() {
    const labelColliderTool = document.createElement('p');
    labelColliderTool.innerHTML =
      'Collider Tool <br>' + this.parentWEV.labelCurrentWorld.innerHTML;
    this.ui.appendChild(labelColliderTool);
    this.labelColliderTool = labelColliderTool;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'Close';
    this.ui.appendChild(closeButton);
    this.closeButton = closeButton;

    const wrapper = document.createElement('div');
    const addButton = document.createElement('button');
    addButton.innerHTML = 'Add';
    wrapper.appendChild(addButton);
    this.ui.appendChild(wrapper);
    this.addButton = addButton;
  }

  initCallbacks() {
    const _this = this;
    const currentGameView = _this.parentWEV.parentEV.currentGameView;
    const canvas = _this.canvas;

    const throwRay = function (event) {
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

      return intersects[0];
    };

    this.addButton.onclick = function () {
      const shape = new Sphape();
      canvas.onclick = function (event) {
        if (event.button != 0) return;
        const intersect = throwRay(event);
        if (intersect) {
          const geometry = new THREE.SphereGeometry(1, 32, 32);
          const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
          const sphere = new THREE.Mesh(geometry, material);
          const pos = intersect.point;
          sphere.position.set(pos.x, pos.y, pos.z);
          _this.getScene(intersect.object).add(sphere);
          sphere.updateMatrix();
          shape.addPoint(sphere);
        }
      };
      _this.model.addShape(shape);
    };

    window.onkeydown = function (event) {
      if (event.defaultPrevented) return;
      if (event.code == 'Enter') {
        console.log('Enter');
      }
    };
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }

  getScene(obj) {
    if (obj.parent) return this.getScene(obj.parent);
    return obj;
  }
}

export class ColliderEditorModel {
  constructor() {
    this.shapes = [];
  }

  addShape(shape) {
    this.shapes.push(shape);
    console.log(this.shapes);
  }
}

export class Sphape {
  constructor() {
    this.points = [];
  }

  addPoint(point) {
    this.points.push(point);
  }
}
