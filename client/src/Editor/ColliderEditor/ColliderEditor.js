import './ColliderEditor.css';

import { THREE } from 'ud-viz/src/Game/Shared/Shared';
import { ConvexGeometry } from 'ud-viz/node_modules/three/examples/jsm/geometries/ConvexGeometry';


export class ColliderEditorView {
  constructor(parentWEV) {
    this.parentWEV = parentWEV;

    this.editor = parentWEV.parentEV;

    this.model = new ColliderEditorModel();

    //raycaster
    this.raycaster = new THREE.Raycaster();

    this.rootHtml = this.parentWEV.rootHtml;

    this.canvas = this.parentWEV.parentEV.currentGameView.rootItownsHtml;

    this.colliderObject3D = new THREE.Object3D();
    this.colliderObject3D.name = 'ColliderObject';
    this.editor.currentGameView
      .getItownsView()
      .scene.add(this.colliderObject3D);

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_Editor');
    this.ui.classList.add('ui_ColliderEditor');
    this.rootHtml.appendChild(this.ui);

    this.labelColliderTool = null;
    this.uiCurrentShape = null;
    this.uiShapes = null;
    this.uiMode = null;

    this.closeButton = null;
    this.newButton = null;

    this.initUI();
    this.initCallbacks();
  }

  disposeUI() {
    this.ui.remove();
  }

  disposeCallbacks() {
    this.setOrbitsControl(true);
    window.onkeydown = null;
  }

  dispose() {
    this.disposeUI();
    this.disposeCallbacks();
  }

  setOrbitsControl(value) {
    this.editor.orbitControls.enabled = value;
  }

  updateUI() {
    this.uiShapes.innerHTML =
      'Shapes length : ' + this.model.getShapes().length;

    this.uiCurrentShape.innerHTML =
      'Current Shape : ' + this.model.getCurrentShape();

    if (this.editor.orbitControls.enabled) {
      this.uiMode.innerHTML = 'Mode : OrbitsControl';
    } else {
      this.uiMode.innerHTML = 'Mode : AddPoints';
    }
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
    const newButton = document.createElement('button');
    newButton.innerHTML = 'New';
    wrapper.appendChild(newButton);
    this.ui.appendChild(wrapper);
    this.newButton = newButton;

    const uiCurrentShape = document.createElement('p');
    uiCurrentShape.innerHTML = 'Current Shape : None';
    wrapper.appendChild(uiCurrentShape);
    this.ui.appendChild(wrapper);
    this.uiCurrentShape = uiCurrentShape;

    const uiShapes = document.createElement('p');
    uiShapes.innerHTML = 'Shapes length : None';
    wrapper.appendChild(uiShapes);
    this.ui.appendChild(wrapper);
    this.uiShapes = uiShapes;

    const uiMode = document.createElement('p');
    uiMode.innerHTML = 'Mode : OrbitsControl';
    wrapper.appendChild(uiMode);
    this.ui.appendChild(wrapper);
    this.uiMode = uiMode;
  }

  initCallbacks() {
    const _this = this;
    const currentGameView = _this.editor.currentGameView;
    const canvas = _this.canvas;
    const transformControls = _this.editor.transformControls;

    const throwRay = function (event, object3D) {
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
      const intersects = _this.raycaster.intersectObject(object3D, true);

      return intersects[0];
    };

    this.newButton.onclick = function () {
      _this.model.setCurrentShape(new Sphape(_this.colliderObject3D));
      _this.updateUI();
    };

    const attachTC = function () {
      transformControls.detach();
      if (!_this.model.getSelectedObject()) return;

      transformControls.attach(_this.model.getSelectedObject());
      transformControls.updateMatrixWorld();
      currentGameView.getItownsView().scene.add(transformControls);
    };

    const editor = _this.editor;
    window.onkeydown = function (event) {
      if (event.defaultPrevented) return;
      if (event.code == 'Enter' || event.code == 'NumpadEnter') {
        if (!_this.model.getCurrentShape()) return;
        console.log('Confirm Shape', _this.model.getCurrentShape());
        _this.model.addCurrentShape();
        canvas.onclick = null;
        _this.setOrbitsControl(true);
      }
      if (event.code == 'KeyQ') {
        const shape = _this.model.getCurrentShape();
        if (!shape) return;

        const mode = !editor.orbitControls.enabled;
        _this.setOrbitsControl(mode);
        if (!mode) {
          canvas.onclick = function (event) {
            if (event.button != 0) return;
            const intersect = throwRay(event, currentGameView.getObject3D());
            if (intersect) {
              const geometry = new THREE.SphereGeometry(1, 32, 32);
              const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
              const sphere = new THREE.Mesh(geometry, material);
              const pos = intersect.point;
              sphere.position.set(pos.x, pos.y, pos.z);
              _this.model.getCurrentShape().getObject3D().add(sphere);
              sphere.updateMatrixWorld();
              shape.addPoint(sphere);
            }
          };
        } else {
          canvas.onclick = function (event) {
            const intersect = throwRay(event, _this.colliderObject3D);
            if (intersect) {
              _this.model.setSelectedObject(intersect.object);
            } else {
              _this.model.setSelectedObject(null);
            }
            attachTC();
          };
        }
      }

      _this.updateUI();
    };
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }
}

export class ColliderEditorModel {
  constructor() {
    this.shapes = [];
    this.currentShape = null;
    this.selectedObject = null;
  }

  addCurrentShape() {
    if (!this.currentShape || !this.currentShape.points.length) {
      console.log('BAD DATA ! CurrentShape : ', this.currentShape);
      return;
    }
    this.shapes.push(this.currentShape);
    this.setCurrentShape(null);
  }

  setCurrentShape(shape) {
    this.currentShape = shape;
  }

  setSelectedObject(object) {
    this.selectedObject = object;
  }

  getCurrentShape() {
    return this.currentShape;
  }

  getShapes() {
    return this.shapes;
  }
  getSelectedObject() {
    return this.selectedObject;
  }
}

export class Sphape {
  constructor(parent) {
    this.points = [];

    this.shapeObject = new THREE.Object3D();
    this.shapeObject.name = 'ShapeObject3D';
    parent.add(this.shapeObject);

    this.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.material.side = THREE.DoubleSide;
    this.mesh = null;
  }

  addPoint(point) {
    this.points.push(point);
    this.updateMesh();
  }

  updateMesh() {
    const points = this.points;
    if (points.length < 4) return;

    const vertices = [];
    points.forEach((element) => {
      vertices.push(element.position);
    });
    const geometry = new ConvexGeometry(vertices);
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter();
    const positions = geometry.attributes.position.array;
    for(let i = 0 ; i< positions.length;i+=3){
      positions[i] -= center.x;
      positions[i+1] -= center.y;
      positions[i+2] -= center.z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute( positions, 3 ));

    if (this.mesh) points[0].parent.remove(this.mesh);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.copy(center);
    this.mesh.updateMatrixWorld();
    this.shapeObject.add(this.mesh);
  }

  getObject3D() {
    return this.shapeObject;
  }
}
