import './ColliderEditor.css';

import { THREE, TransformControls } from 'ud-viz';
import { ConvexGeometry } from 'ud-viz/node_modules/three/examples/jsm/geometries/ConvexGeometry';

export class ColliderEditorView {
  constructor(params) {
    this.model = new ColliderEditorModel();

    //raycaster
    this.raycaster = new THREE.Raycaster();

    this.rootHtml = params.parentUIHtml;
    this.gameView = params.gameView;
    this.canvas = this.gameView.rootItownsHtml;

    this.colliderObject3D = new THREE.Object3D();
    this.colliderObject3D.name = 'ColliderObject';
    this.gameView.getItownsView().scene.add(this.colliderObject3D);

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_ColliderEditor');
    this.rootHtml.appendChild(this.ui);

    this.labelColliderTool = null;
    this.uiCurrentShape = null;
    this.uiShapes = null;
    this.shapesList = null;
    this.uiMode = null;

    this.closeButton = null;
    this.newButton = null;

    //controls
    this.orbitControls = params.parentOC;
    this.transformControls = null;

    this.addPointMode = false;

    this.initUI();
    this.initTransformControls();
    this.initCallbacks();
  }

  dispose() {
    this.setOrbitControls(true);
    this.ui.remove();
    this.transformControls.detach();
    this.transformControls.dispose();
    const manager = this.gameView.getInputManager();
    manager.removeInputListener(this.refAddPointKeyDown);
    manager.removeInputListener(this.refAddPointKeyUp);
    manager.removeInputListener(this.onPointerupListener);
    if (this.gameView.getItownsView().scene)
      this.gameView.getItownsView().scene.remove(this.colliderObject3D);
  }

  setOrbitControls(value) {
    this.orbitControls.enabled = value;
  }

  setAddPointMode(value) {
    if (!this.model.getCurrentShape()) return;
    this.addPointMode = value;
    this.setOrbitControls(!this.addPointMode);
    this.updateUI();
  }
  getAddPointMode() {
    return this.addPointMode;
  }

  shapeHtml(shape) {
    const _this = this;

    const liShapesList = document.createElement(`li`);
    liShapesList.classList.add('li_Editor');
    liShapesList.innerHTML = shape.name;

    const deleteButton = document.createElement('div');
    deleteButton.classList.add('button_Editor');
    deleteButton.innerHTML = 'Delete';
    deleteButton.onclick = function () {
      _this.model.removeShape(shape);
      _this.updateUI();
    };
    liShapesList.appendChild(deleteButton);

    return liShapesList;
  }

  updateUI() {
    const _this = this;
    this.uiShapes.innerHTML =
      'Shapes length : ' + this.model.getShapes().length;

    const list = this.shapesList;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
    this.model.getShapes().forEach(function (shape) {
      list.appendChild(_this.shapeHtml(shape));
    });

    const shape = this.model.getCurrentShape(); 
    const name = (shape) ? shape.name : 'None';
    this.uiCurrentShape.innerHTML = 'Current Shape : ' + name;

    if (this.orbitControls.enabled) {
      this.uiMode.innerHTML = 'Mode : OrbitsControl';
    } else {
      this.uiMode.innerHTML = 'Mode : AddPoints';
    }
  }

  initUI() {
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

    const shapesList = document.createElement('ul');
    shapesList.classList.add('ul_Editor');
    wrapper.appendChild(shapesList);
    this.ui.appendChild(wrapper);
    this.shapesList = shapesList;

    const uiMode = document.createElement('p');
    uiMode.innerHTML = 'Mode : OrbitsControl';
    wrapper.appendChild(uiMode);
    this.ui.appendChild(wrapper);
    this.uiMode = uiMode;
  }

  initTransformControls() {
    if (this.transformControls) this.transformControls.dispose();

    const camera = this.gameView.getItownsView().camera.camera3D;
    const scene = this.gameView.getItownsView().scene;
    const manager = this.gameView.getInputManager();
    const viewerDiv = this.gameView.rootItownsHtml;

    this.transformControls = new TransformControls(camera, viewerDiv);
    scene.add(this.transformControls);

    const _this = this;

    //cant handle this callback with our input manager
    this.transformControls.addEventListener(
      'dragging-changed',
      function (event) {
        _this.orbitControls.enabled = !event.value;
      }
    );

    this.escListener = function () {
      _this.transformControls.detach();
    };

    this.deleteListener = function () {
      if (_this.transformControls.object) {
        const world = _this.gameView
          .getStateComputer()
          .getWorldContext()
          .getWorld();
        const go = world.getGameObject();
        const deletedGO = go.find(
          _this.transformControls.object.userData.gameObjectUUID
        );
        _this.transformControls.detach();
        deletedGO.removeFromParent();

        //force update gameview
        _this.gameView.setUpdateGameObject(true);
        _this.gameView.update(world.computeWorldState());
        _this.gameView.setUpdateGameObject(false);
      }
    };

    //CALLBACKS
    manager.addKeyInput('Delete', 'keydown', this.deleteListener);
    manager.addKeyInput('Escape', 'keydown', this.escListener);
  }

  initCallbacks() {
    const _this = this;
    const currentGameView = this.gameView;
    const canvas = this.canvas;
    const transformControls = this.transformControls;
    const manager = this.gameView.getInputManager();

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
      _this.model.addNewShape(new Sphape(_this.colliderObject3D));
      _this.updateUI();
    };

    const attachTC = function () {
      transformControls.detach();
      if (!_this.model.getSelectedObject()) return;

      transformControls.attach(_this.model.getSelectedObject());
      transformControls.updateMatrixWorld();
      currentGameView.getItownsView().scene.add(transformControls);
    };

    const getShape = function () {
      return _this.model.getCurrentShape();
    };
    this.onPointerupListener = function (event) {
      if (_this.getAddPointMode()) {
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
          getShape().addPoint(sphere);
        }
      } else {
        if (transformControls.dragging) {
          getShape().updateMesh();
          return;
        }
        const intersect = throwRay(event, _this.colliderObject3D);
        if (intersect) {
          _this.model.setSelectedObject(intersect.object);
        } else {
          _this.model.setSelectedObject(null);
        }
        attachTC();
      }
      _this.updateUI();
    };

    this.refAddPointKeyDown = this.setAddPointMode.bind(this, true);
    this.refAddPointKeyUp = this.setAddPointMode.bind(this, false);

    manager.addKeyInput('Control', 'keydown', this.refAddPointKeyDown);
    manager.addKeyInput('Control', 'keyup', this.refAddPointKeyUp);
    manager.addMouseInput(canvas, 'pointerup', this.onPointerupListener);
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

  addNewShape(shape) {
    this.setCurrentShape(shape);
    this.shapes.push(this.currentShape);
  }

  removeShape(shape) {
    if (this.currentShape == shape) {
      this.currentShape = null;
    }
    const index = this.shapes.indexOf(shape);
    if (index >= 0) this.shapes.splice(index, 1);
    shape.shapeObject.parent.remove(shape.shapeObject);
  }

  setCurrentShape(shape) {
    this.currentShape = shape;
  }

  setSelectedObject(object) {
    this.selectedObject = object;
    if (object && object.parent.shape) {
      this.setCurrentShape(object.parent.shape);
    }
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
    this.shapeObject.shape = this;
    parent.add(this.shapeObject);

    this.name = 'Shape' + this.shapeObject.uuid;
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
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] -= center.x;
      positions[i + 1] -= center.y;
      positions[i + 2] -= center.z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    //If you want the ray intersect the mesh you have to remove this boudingbox
    //geometry.boundingBox = null;

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
