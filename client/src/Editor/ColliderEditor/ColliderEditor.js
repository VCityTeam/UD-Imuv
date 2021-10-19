import './ColliderEditor.css';

import { THREE, TransformControls } from 'ud-viz';
import { ConvexGeometry } from 'ud-viz';
import * as QuickHull from 'quickhull';
import ColliderModule from 'ud-viz/src/Game/Shared/GameObject/Components/Collider';
import { Shared } from 'ud-viz/src/Game/Game';

export class ColliderEditorView {
  constructor(params) {
    //raycaster
    this.raycaster = new THREE.Raycaster();

    this.rootHtml = params.parentUIHtml;
    this.gameView = params.gameView;

    this.assetsManager = params.assetsManager;

    this.model = new ColliderEditorModel(this.gameView);

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
    this.pointsList = null;
    this.uiMode = null;

    this.closeButton = null;
    this.newButton = null;
    this.saveButton = null;

    //controls
    params.goEV.dispose(); //TODO : merge transformcontrols of goEV and  cEV
    this.orbitControls = params.parentOC;
    this.transformControls = null;
    this.tcChanged = false; //TODO : Find how to use transformControls.dragging correctly

    this.addPointMode = false;

    this.initUI();
    this.initTransformControls();
    this.initCallbacks();
    this.model.loadShapesFromJSON(
      this.getColliderComponent(),
      this.colliderObject3D,
      this.gameView
    );
    this.attachTC();
    this.updateUI();
  }

  getCanvas() {
    const canvas =
      this.gameView.getItownsView().mainLoop.gfxEngine.renderer.domElement;
    canvas.style.zIndex = 1;
    return canvas;
  }

  getColliderComponent() {
    const world = this.gameView.getStateComputer().getWorldContext().getWorld();

    const go = world.getGameObject();
    const wS = go.fetchWorldScripts()['worldGameManager'];
    const mapGo = wS.getMap();

    if (!mapGo) throw new Error('no map object in world');

    let colliderComp = mapGo.getComponent(ColliderModule.TYPE);
    if (!colliderComp) {
      const c = mapGo.addComponent(
        {
          type: 'Collider',
          shapes: [],
          body: true,
        },
        this.gameView.getInputManager(),
        Shared,
        false
      );
      colliderComp = c;
    }

    return colliderComp;
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
    manager.removeInputListener(this.onPointerdownListener);
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

    const liShapesList = document.createElement('li');
    liShapesList.classList.add('li_Editor');
    liShapesList.classList.add('li_ColliderEditor');
    liShapesList.innerHTML =
      shape.name + '\nNombre de points : ' + shape.points.length;

    const deleteButton = document.createElement('div');
    deleteButton.classList.add('button_Editor');
    deleteButton.innerHTML = 'Delete';
    deleteButton.onclick = function () {
      if (shape.mesh && shape.mesh == _this.model.getSelectedObject())
        _this.transformControls.detach();
      _this.model.removeShape(shape);
      _this.updateUI();
    };
    liShapesList.appendChild(deleteButton);

    const selectButton = document.createElement('div');
    selectButton.classList.add('button_Editor');
    selectButton.innerHTML = 'Select';
    selectButton.onclick = function () {
      _this.model.setCurrentShape(shape);
      if (shape.mesh) {
        _this.model.setSelectedObject(shape.mesh);
      }
      _this.attachTC();
      _this.updateUI();
    };
    liShapesList.appendChild(selectButton);

    const cloneButton = document.createElement('div');
    cloneButton.classList.add('button_Editor');
    cloneButton.innerHTML = 'Clone';
    cloneButton.onclick = function () {
      const cloneShape = new Shape(_this.colliderObject3D);
      _this.model.addNewShape(cloneShape);
      shape.points.forEach((point) => {
        const newPoint = _this.model.createSphere();
        newPoint.position.copy(point.position.clone());
        cloneShape.addPoint(newPoint);

        if (newPoint) _this.model.setSelectedObject(newPoint);
        if (cloneShape) _this.model.setSelectedObject(cloneShape.mesh);
      });
      _this.attachTC();
      _this.updateUI();
    };
    liShapesList.appendChild(cloneButton);

    return liShapesList;
  }

  pointHtml(point) {
    const _this = this;

    const liPointList = document.createElement('li');
    liPointList.classList.add('li_Editor');
    liPointList.classList.add('li_ColliderEditor');
    if (point == this.model.getSelectedObject())
      liPointList.classList.add('li_SelectedPointEditor');
    liPointList.innerHTML = point.name;

    const deleteButton = document.createElement('div');
    deleteButton.classList.add('button_Editor');
    deleteButton.innerHTML = 'Delete';
    deleteButton.onclick = function () {
      if (point == _this.model.getSelectedObject())
        _this.transformControls.detach();
      _this.model.getCurrentShape().removePoint(point);
      _this.updateUI();
    };
    liPointList.appendChild(deleteButton);

    return liPointList;
  }

  updateUI() {
    const _this = this;

    this.uiShapes.innerHTML =
      'Shapes length : ' + this.model.getShapes().length;

    //List of shapes
    const sList = this.shapesList;
    while (sList.firstChild) {
      sList.removeChild(sList.firstChild);
    }
    this.model.getShapes().forEach(function (shape) {
      sList.appendChild(_this.shapeHtml(shape));
    });

    const shape = this.model.getCurrentShape();
    const index = this.model.shapes.indexOf(shape);
    const name = shape ? '' : 'None';
    this.uiCurrentShape.innerHTML = 'Current Shape : ' + name;

    const pList = this.pointsList;
    while (pList.firstChild) {
      pList.removeChild(pList.firstChild);
    }
    if (index >= 0) {
      shape.points.forEach(function (point) {
        pList.appendChild(_this.pointHtml(point));
      });
      sList.children[index].appendChild(pList);
      sList.children[index].classList.add('li_SelectedEditor');
      this.uiCurrentShape.appendChild(sList.children[index]);
    }

    if (this.orbitControls.enabled) {
      this.uiMode.innerHTML = 'Mode : OrbitsControl';
    } else {
      this.uiMode.innerHTML = 'Mode : AddPoints';
    }
  }

  initUI() {
    const wrapper = document.createElement('div');
    const newButton = document.createElement('button');
    newButton.innerHTML = 'New';
    wrapper.appendChild(newButton);
    this.newButton = newButton;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'Close';
    wrapper.appendChild(closeButton);
    this.closeButton = closeButton;

    const saveButton = document.createElement('button');
    saveButton.innerHTML = 'Save';
    wrapper.appendChild(saveButton);
    this.saveButton = saveButton;

    const uiCurrentShape = document.createElement('p');
    uiCurrentShape.innerHTML = 'Current Shape : None';
    wrapper.appendChild(uiCurrentShape);
    this.uiCurrentShape = uiCurrentShape;

    const uiShapes = document.createElement('p');
    uiShapes.innerHTML = 'Shapes length : None';
    wrapper.appendChild(uiShapes);
    this.uiShapes = uiShapes;

    const shapesList = document.createElement('ul');
    shapesList.classList.add('ul_Editor');
    wrapper.appendChild(shapesList);
    this.shapesList = shapesList;

    const pointsList = document.createElement('ul');
    pointsList.classList.add('ul_Editor');
    this.pointsList = pointsList;

    const uiMode = document.createElement('p');
    uiMode.innerHTML = 'Mode : OrbitsControl';
    wrapper.appendChild(uiMode);
    this.uiMode = uiMode;

    this.ui.appendChild(wrapper);
  }

  initTransformControls() {
    if (this.transformControls) this.transformControls.dispose();

    const camera = this.gameView.getItownsView().camera.camera3D;
    const scene = this.gameView.getItownsView().scene;
    // const viewerDiv = this.gameView.rootItownsHtml;

    this.transformControls = new TransformControls(camera, this.getCanvas());
    scene.add(this.transformControls);

    const _this = this;

    //cant handle this callback with our input manager
    this.transformControls.addEventListener(
      'dragging-changed',
      function (event) {
        _this.setOrbitControls(!event.value);
        _this.tcChanged = true;
      }
    );
  }

  initCallbacks() {
    const _this = this;
    const currentGameView = this.gameView;
    const canvas = this.getCanvas();
    const viewerDiv = this.gameView.rootItownsHtml;
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

      for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.visible) {
          return intersects[i];
        }
      }

      return null;
    };

    this.newButton.onclick = function () {
      _this.model.addNewShape(new Shape(_this.colliderObject3D));
      transformControls.detach();
      _this.updateUI();
    };

    this.saveButton.onclick = function () {
      console.log('Save Collider');

      const colliderComp = _this.getColliderComponent();
      colliderComp.shapesJSON = _this.model.toJSON();
    };

    this.attachTC = function () {
      transformControls.detach();
      if (!_this.model.getSelectedObject()) return;
      transformControls.attach(_this.model.getSelectedObject());
      transformControls.updateMatrixWorld();
      currentGameView.getItownsView().scene.add(transformControls);
    };

    const getShape = function () {
      return _this.model.getCurrentShape();
    };

    const computeAngle = function () {
      return (
        _this.orbitControls.getAzimuthalAngle() +
        _this.orbitControls.getPolarAngle()
      );
    };

    let angle = 0;

    this.onPointerdownListener = function (event) {
      if (event.button != 0) return;
      angle = computeAngle();
    };

    this.onPointerupListener = function (event) {
      const isRotating = Math.abs(angle - computeAngle()) > 0;
      if (event.button != 0) return;
      if (_this.getAddPointMode()) {
        const intersect = throwRay(event, currentGameView.getObject3D());
        if (intersect) {
          const newPoint = _this.model.createSphere();
          const pos = intersect.point;
          newPoint.position.set(pos.x, pos.y, pos.z);

          getShape().addPoint(newPoint);
          _this.model.setSelectedObject(newPoint || null);
        }
      } else {
        if (_this.tcChanged) {
          _this.tcChanged = false;
          if (_this.model.getSelectedObject().userData == 'Point') {
            getShape().updateMesh();
          } else if (_this.model.getSelectedObject().userData == 'Mesh') {
            getShape().adjustPoints();
          }
          return;
        }
        if (isRotating) return;
        const intersect = throwRay(event, _this.colliderObject3D);
        if (intersect) {
          _this.model.setSelectedObject(intersect.object);
        } else {
          _this.model.setSelectedObject(null);
        }
      }
      _this.attachTC();
      _this.updateUI();
    };

    this.refAddPointKeyDown = this.setAddPointMode.bind(this, true);
    this.refAddPointKeyUp = this.setAddPointMode.bind(this, false);

    manager.addKeyInput('Control', 'keydown', this.refAddPointKeyDown);
    manager.addKeyInput('Control', 'keyup', this.refAddPointKeyUp);
    manager.addMouseInput(viewerDiv, 'pointerup', this.onPointerupListener);
    manager.addMouseInput(viewerDiv, 'pointerdown', this.onPointerdownListener);

    manager.addKeyInput('f', 'keyup', function () {
      if (_this.model.getSelectedObject()) {
        _this.orbitControls.target.copy(
          _this.model.getSelectedObject().position
        );
        _this.orbitControls.update();
      }
    });
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }
}

export class ColliderEditorModel {
  constructor(gameView) {
    this.shapes = [];
    this.currentShape = null;
    this.selectedObject = null;
    this.gameViewObject = gameView.getObject3D();
  }

  addNewShape(shape) {
    this.setSelectedObject(null);
    this.setCurrentShape(shape);
    this.shapes.push(this.currentShape);
  }

  removeShape(shape) {
    if (this.currentShape == shape) {
      this.currentShape = null;
    }
    const index = this.shapes.indexOf(shape);
    if (index >= 0) this.shapes.splice(index, 1);
    shape.getObject3D().parent.remove(shape.getObject3D());
  }

  setCurrentShape(shape) {
    if (this.currentShape) this.currentShape.setDefaultColor();
    this.currentShape = shape;
    if (this.currentShape)
      this.currentShape.setSelectedColor(this.getSelectedObject());
  }

  setSelectedObject(object) {
    this.selectedObject = object;
    if (object && object.parent.shape) {
      this.setCurrentShape(object.parent.shape);
    } else {
      this.setCurrentShape(null);
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

  createSphere() {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sphere = new THREE.Mesh(geometry, material);
    return sphere;
  }

  loadShapesFromJSON(colliderComp, object3D) {
    const _this = this;
    const json = colliderComp.shapesJSON;

    json.forEach(function (col) {
      if (typeof col.points === 'undefined') return;
      const shape = new Shape(object3D);
      _this.addNewShape(shape);
      col.points.forEach(function (p) {
        const newPoint = _this.createSphere();
        const posOffset = _this.gameViewObject.position;
        newPoint.position.set(
          posOffset.x + p.x,
          posOffset.y + p.y,
          posOffset.z + (p.z || 150)
        );
        shape.addPoint(newPoint);
        if (newPoint) _this.setSelectedObject(newPoint);
        if (shape.mesh) _this.setSelectedObject(shape.mesh);
      });
    });
  }

  toJSON() {
    const result = [];
    const _this = this;
    this.shapes.forEach(function (s) {
      result.push(s.toJSON(_this.gameViewObject.position));
    });
    return result;
  }
}

class Shape {
  constructor(parent) {
    this.points = [];

    this.shapeObject = new THREE.Object3D();
    this.shapeObject.name = 'ShapeObject3D';
    this.shapeObject.shape = this;
    parent.add(this.shapeObject);

    this.name = 'Shape' + this.shapeObject.uuid;
    this.matMesh = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.matMesh.side = THREE.DoubleSide;

    this.colMeshDefault = 0xff0000;
    this.colMeshSelected = 0x69b00b;

    this.colPointDefault = 0xffff00;
    this.colPointCurrentShape = 0x00ffff;
    this.colPointSelected = 0x0b69b0;

    this.mesh = null;

    this.previousMeshPosition = null;

    this.type = 'Polygon';
  }

  setDefaultColor() {
    const _this = this;
    this.matMesh.color.set(this.colMeshDefault);
    if (this.mesh) {
      this.mesh.material = this.matMesh;
    }
    this.points.forEach(function (p) {
      p.material.color.set(_this.colPointDefault);
    });
  }

  setSelectedColor(objectSelected) {
    const _this = this;
    this.matMesh.color.set(this.colMeshSelected);
    if (this.mesh) {
      this.mesh.material = this.matMesh;
    }
    this.points.forEach(function (p) {
      if (objectSelected == p) {
        p.material.color.set(_this.colPointSelected);
      } else {
        p.material.color.set(_this.colPointCurrentShape);
      }
    });
  }

  /**
   *
   * @param {Mesh} point : sphere
   */
  addPoint(point) {
    this.getObject3D().add(point);
    point.updateMatrixWorld();

    this.points.push(point);
    point.name = 'Point' + this.points.length;
    point.userData = 'Point';
    this.updateMesh();
  }

  removePoint(point) {
    const index = this.points.indexOf(point);
    if (index >= 0) this.points.splice(index, 1);
    point.parent.remove(point);
    this.updateMesh();
  }

  updateMesh() {
    const points = this.points;
    if (this.mesh) {
      this.mesh.parent.remove(this.mesh);
      this.mesh = null;
    }

    if (points.length < 4) return;

    const vertices = [];
    points.forEach((element) => {
      vertices.push(element.position);
    });

    const meshGeometry = new ConvexGeometry(vertices);
    meshGeometry.computeBoundingBox();
    const vecCenter = new THREE.Vector3();
    meshGeometry.boundingBox.getCenter(vecCenter);
    const positions = meshGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] -= vecCenter.x;
      positions[i + 1] -= vecCenter.y;
      positions[i + 2] -= vecCenter.z;
    }

    meshGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    //If you want the ray intersect the mesh you have to remove this boudingbox
    meshGeometry.boundingBox = null;

    this.mesh = new THREE.Mesh(meshGeometry, this.matMesh);
    this.mesh.position.copy(vecCenter);
    this.mesh.updateMatrixWorld();
    this.mesh.userData = 'Mesh';
    this.previousMeshPosition = this.mesh.position.clone();
    this.getObject3D().add(this.mesh);
  }

  adjustPoints() {
    const _this = this;
    this.points.forEach((point) => {
      const newPosition = point.position
        .clone()
        .add(
          _this.mesh.position.clone().sub(_this.previousMeshPosition.clone())
        );

      point.position.copy(newPosition);
    });
    this.previousMeshPosition = this.mesh.position.clone();
  }

  getObject3D() {
    return this.shapeObject;
  }

  toJSON(posOffset) {
    const result = [];

    this.points.forEach(function (p) {
      result.push(p.position.clone().sub(posOffset));
    });

    let hull = QuickHull(result);
    hull.pop();

    const shape = {};
    shape.type = this.type;
    shape.points = hull;
    return shape;
  }
}
