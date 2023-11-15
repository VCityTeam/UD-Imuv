import { THREE } from 'ud-viz';
import ColliderModule from 'ud-viz/src/Game/GameObject/Components/Collider';
import { Game } from 'ud-viz/src/Game/Game';
import { PolygonShape, CircleShape, POLYGON_TYPE, CIRCLE_TYPE } from './Shape';

import './ColliderEditor.css';
export class ColliderEditorView {
  constructor(params) {
    this.goEditor = params.goEditor;

    this.rootHtml = params.rootHtml;
    this.gameView = this.goEditor.gameView;

    this.assetsManager = this.goEditor.assetsManager;

    this.colliderObject3D = new THREE.Object3D();
    this.colliderObject3D.name = 'ColliderObject';
    this.gameView.getScene().add(this.colliderObject3D);

    // where html goes
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

    this.goSelected = this.goEditor.getSelectedGO();
    this.colliderComp = this.getColliderComponent();

    // controls
    this.orbitControls = this.gameView.getOrbitControls();
    this.transformControls = this.gameView.getTransformControls();
    this.tcChanged = false; // TODO : Find how to use transformControls.dragging correctly

    this.addPointMode = false;

    this.model = new ColliderEditorModel(
      this.computePosOffset(),
      this.gameView
    );

    this.gameView.attachTCToObject(null);
    this.model.loadShapesFromJSON(
      this.colliderComp,
      this.colliderObject3D,
      this.gameView
    );
    this.initUI();
    this.initCallbacks();

    this.updateUI();
  }

  getColliderComponent() {
    const go = this.goSelected;
    if (!go) throw new Error('no map object in world');
    const goInGv = this.gameView
      .getLastState()
      .getGameObject()
      .find(go.object3D.userData.gameObjectUUID);
    let colliderComp = goInGv.getComponent(ColliderModule.TYPE);
    if (!colliderComp) {
      colliderComp = goInGv.addComponent(
        {
          type: 'Collider',
          shapes: [],
          body: true,
        },
        this.gameView.getAssetsManager(),
        Game,
        false
      );
    }

    return colliderComp;
  }

  dispose() {
    this.ui.remove();
    const manager = this.gameView.getInputManager();
    manager.removeInputListener(this.refAddPointKeyDown);
    manager.removeInputListener(this.refAddPointKeyUp);
    this.colliderObject3D.removeFromParent();
    this.colliderObject3D = null;
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
        _this.model.placeSphereAtPoint(point.position.clone(), cloneShape);
        if (cloneShape) _this.model.setSelectedObject(cloneShape.mesh);
      });
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

    // List of shapes
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
    shapesList.classList.add('ul_ShapeEditor');
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

  initCallbacks() {
    const _this = this;
    const manager = this.gameView.getInputManager();

    this.newPolygonButton.onclick = function () {
      _this.model.addNewShape(new PolygonShape(_this.colliderObject3D));
      _this.updateUI();
    };

    this.newCircleButton.onclick = function () {
      _this.model.addNewShape(new CircleShape(_this.colliderObject3D));
      _this.updateUI();
    };

    this.saveButton.onclick = function () {
      console.log('Save Collider');
      const colliderComp = _this.getColliderComponent();
      colliderComp.shapesJSON = _this.model.toJSON();
      colliderComp.body = _this.bodyCheckbox.checked;
    };

    const gV = this.gameView;

    const cbPointerUp = function (event) {
      if (event.button != 0) return;
      if (_this.getAddPointMode()) {
        const intersect = gV.throwRay(event, gV.getObject3D());
        if (intersect) {
          _this.model.placeSphereAtPoint(
            intersect.point,
            _this.model.getCurrentShape()
          );
        }
      } else {
        if (gV.tcHasBeenDragged()) {
          _this.model.updateShape();
          return;
        }
        if (gV.hasBeenRotated()) return;
        const intersect = gV.throwRay(event, _this.colliderObject3D);

        _this.model.setSelectedObject(intersect ? intersect.object : null);
      }
      _this.updateUI();
    };

    gV.setCallbackPointerUp(cbPointerUp.bind(this), 'Collider');

    this.refAddPointKeyDown = this.setAddPointMode.bind(this, true);
    this.refAddPointKeyUp = this.setAddPointMode.bind(this, false);

    manager.addKeyInput('Control', 'keydown', this.refAddPointKeyDown);
    manager.addKeyInput('Control', 'keyup', this.refAddPointKeyUp);

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
  constructor(posOffset, gameView) {
    this.shapes = [];
    this.currentShape = null;
    this.selectedObject = null;
    this.posOffset = posOffset;
    this.gameView = gameView;
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
    this.gameView.attachTCToObject(object);
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

  /** Create sphere as new point of shape at a position */
  placeSphereAtPoint(point, shape) {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const sphereP = new THREE.Mesh(geometry, material);
    sphereP.position.set(point.x, point.y, point.z);

    shape.addPoint(sphereP);
    this.setSelectedObject(sphereP);

    return sphereP;
  }

  updateShape() {
    const type = this.getSelectedObject().userData.type;
    if (type == 'Point') {
      this.getCurrentShape().updateMesh();
    } else if (type == 'Mesh') {
      this.getCurrentShape().adjustPoints();
    }
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
          const pos = new THREE.Vector3(
            posOffset.x + p.x,
            posOffset.y + p.y,
            posOffset.z + (p.z || 0)
          );

          _this.placeSphereAtPoint(pos, shape);

          if (shape.mesh) _this.setSelectedObject(shape.mesh);
        });
      } else if (col.type == CIRCLE_TYPE) {
        const shape = new CircleShape(object3D, col.radius);
        _this.addNewShape(shape);

        const pos = new THREE.Vector3(
          posOffset.x + col.center.x,
          posOffset.y + col.center.y,
          posOffset.z + (col.center.z || 0)
        );

        _this.placeSphereAtPoint(pos, shape);

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
