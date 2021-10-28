import './ColliderEditor.css';

import { THREE, TransformControls } from 'ud-viz';
import ColliderModule from 'ud-viz/src/Game/Shared/GameObject/Components/Collider';
import { Shared } from 'ud-viz/src/Game/Game';
import { PolygonShape, CircleShape, POLYGON_TYPE, CIRCLE_TYPE } from './Shape';

export class ColliderEditorView {
  constructor(params) {
    //raycaster
    this.raycaster = new THREE.Raycaster();

    this.rootHtml = params.parentUIHtml;
    this.gameView = params.gameView;

    this.assetsManager = params.assetsManager;

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
    this.newPolygonButton = null;
    this.newCircleButton = null;
    this.saveButton = null;
    this.bodyCheckbox = null;

    this.goSelected = params.goEV.getSelectedGO();
    this.colliderComp = this.getColliderComponent();

    //controls
    params.goEV.dispose(); //TODO : merge transformcontrols of goEV and  cEV
    this.orbitControls = params.parentOC;
    this.transformControls = null;
    this.tcChanged = false; //TODO : Find how to use transformControls.dragging correctly

    this.addPointMode = false;

    this.model = new ColliderEditorModel(this.computePosOffset());

    this.model.loadShapesFromJSON(
      this.colliderComp,
      this.colliderObject3D,
      this.gameView
    );
    this.initUI();
    this.initTransformControls();
    this.initCallbacks();

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
    const go = this.goSelected;
    if (!go) throw new Error('no map object in world');

    let colliderComp = go.getComponent(ColliderModule.TYPE);
    if (!colliderComp) {
      colliderComp = go.addComponent(
        {
          type: 'Collider',
          shapes: [],
          body: true,
        },
        this.gameView.getAssetsManager(),
        Shared,
        false
      );
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
      let cloneShape = null;
      if (shape.getType() == POLYGON_TYPE)
        cloneShape = new PolygonShape(_this.colliderObject3D);
      else if (shape.getType() == CIRCLE_TYPE)
        cloneShape = new CircleShape(_this.colliderObject3D, shape.radius);

      if (!cloneShape) {
        console.error('Type incorrect of ', shape);
        return;
      }
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

    if (shape.getType() == CIRCLE_TYPE) {
      const radiusInput = document.createElement('input');
      radiusInput.setAttribute('type', 'number');
      radiusInput.setAttribute('step', 0.1);
      radiusInput.value = shape.getRadius();
      radiusInput.onchange = function () {
        shape.setRadius(radiusInput.value);
        _this.model.setSelectedObject(shape.mesh);
        _this.attachTC();
        _this.updateUI();
      };
      liShapesList.appendChild(radiusInput);
    }

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
    const newPolygonButton = document.createElement('button');
    newPolygonButton.innerHTML = 'New Polygon';
    wrapper.appendChild(newPolygonButton);
    this.newPolygonButton = newPolygonButton;

    const newCircleButton = document.createElement('button');
    newCircleButton.innerHTML = 'New Circle';
    wrapper.appendChild(newCircleButton);
    this.newCircleButton = newCircleButton;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'Close';
    wrapper.appendChild(closeButton);
    this.closeButton = closeButton;

    const saveButton = document.createElement('button');
    saveButton.innerHTML = 'Save';
    wrapper.appendChild(saveButton);
    this.saveButton = saveButton;

    const labelBodyCheckbox = document.createElement('label');
    labelBodyCheckbox.innerHTML = 'Body';
    wrapper.appendChild(labelBodyCheckbox);

    const bodyCheckbox = document.createElement('input');
    bodyCheckbox.setAttribute('type', 'checkbox');
    bodyCheckbox.checked = this.colliderComp.body;
    labelBodyCheckbox.appendChild(bodyCheckbox);
    this.bodyCheckbox = bodyCheckbox;

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

    this.newPolygonButton.onclick = function () {
      _this.model.addNewShape(new PolygonShape(_this.colliderObject3D));
      transformControls.detach();
      _this.updateUI();
    };

    this.newCircleButton.onclick = function () {
      _this.model.addNewShape(new CircleShape(_this.colliderObject3D));
      transformControls.detach();
      _this.updateUI();
    };

    this.saveButton.onclick = function () {
      console.log('Save Collider');

      const colliderComp = _this.getColliderComponent();
      colliderComp.shapesJSON = _this.model.toJSON();
      colliderComp.body = _this.bodyCheckbox.checked;
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

  computePosOffset() {
    return this.gameView
      .getObject3D()
      .position.clone()
      .add(this.goSelected.computeWorldTransform().position);
  }
}

export class ColliderEditorModel {
  constructor(posOffset) {
    this.shapes = [];
    this.currentShape = null;
    this.selectedObject = null;
    this.posOffset = posOffset;
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

    const posOffset = this.posOffset;

    json.forEach(function (col) {
      if (col.type == POLYGON_TYPE) {
        const shape = new PolygonShape(object3D);
        _this.addNewShape(shape);
        col.points.forEach(function (p) {
          const newPoint = _this.createSphere();
          newPoint.position.set(
            posOffset.x + p.x,
            posOffset.y + p.y,
            posOffset.z + (p.z || 0)
          );
          shape.addPoint(newPoint);
          if (newPoint) _this.setSelectedObject(newPoint);
          if (shape.mesh) _this.setSelectedObject(shape.mesh);
        });
      } else if (col.type == CIRCLE_TYPE) {
        const shape = new CircleShape(object3D, col.radius);

        _this.addNewShape(shape);

        const p = col.center;
        const newPoint = _this.createSphere();
        newPoint.position.set(
          posOffset.x + p.x,
          posOffset.y + p.y,
          posOffset.z + (p.z || 0)
        );
        shape.addPoint(newPoint);
        if (newPoint) _this.setSelectedObject(newPoint);
        if (shape.mesh) _this.setSelectedObject(shape.mesh);
      }
    });
  }

  toJSON() {
    const result = [];
    const _this = this;
    this.shapes.forEach(function (s) {
      result.push(s.toJSON(_this.posOffset));
    });
    return result;
  }
}
