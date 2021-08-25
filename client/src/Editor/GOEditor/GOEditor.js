/** @format */

import './GOEditor.css';
import { THREE, TransformControls } from 'ud-viz';

export class GOEditorView {
  constructor(params) {
    //html
    this.ui = document.createElement('div');
    this.ui.classList.add('root_GOEditor');
    params.parentUIHtml.appendChild(this.ui);

    //html
    this.goList = null;
    this.goSelectedUI = null;

    //gameview
    this.gameView = params.gameView;

    this.orbitControls = params.orbitControls;

    //raycaster
    this.raycaster = new THREE.Raycaster();

    //controls
    this.transformControls = null;

    //listeners
    this.escListener = null;
    this.deleteListener = null;
    this.mouseDownListener = null;

    //go selected
    this.goSelected = null;

    this.initUI();
    this.initCallbacks();
    this.initTransformControls();
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
      _this.setSelectedGO(null, null);
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

        //TODO duplicate code with the delete button of the goUI

        deletedGO.removeFromParent();
        _this.setSelectedGO(null, null);

        //force update gameview
        _this.gameView.setUpdateGameObject(true);
        _this.gameView.update(world.computeWorldState());
        _this.gameView.setUpdateGameObject(false);

        _this.updateUI();
      }
    };
    this.mouseDownListener = function (event) {
      if (_this.transformControls.object) return; //already assign to an object

      //1. sets the mouse position with a coordinate system where the center
      //   of the screen is the origin
      const mouse = new THREE.Vector2(
        -1 +
          (2 * event.offsetX) / (viewerDiv.clientWidth - viewerDiv.offsetLeft),
        1 - (2 * event.offsetY) / (viewerDiv.clientHeight - viewerDiv.offsetTop)
      );

      //2. set the picking ray from the camera position and mouse coordinates
      _this.raycaster.setFromCamera(mouse, camera);

      //3. compute intersections
      //TODO opti en enlevant la recursive et en selectionnant seulement les bon object3D
      const intersects = _this.raycaster.intersectObject(
        _this.gameView.getObject3D(),
        true
      );

      if (intersects.length) {
        let minDist = Infinity;
        let info = null;

        intersects.forEach(function (i) {
          if (i.distance < minDist) {
            info = i;
            minDist = i.distance;
          }
        });

        if (info) {
          const objectClicked = info.object;
          let current = objectClicked;
          while (!current.userData.gameObjectUUID) {
            if (!current.parent) {
              console.warn('didnt find gameobject uuid');
              current = null;
              break;
            }
            current = current.parent;
          }

          if (current) {
            _this.setSelectedGO(current.userData.gameObjectUUID, current);
          }
        }
      }
    };

    //CALLBACKS
    manager.addKeyInput('Delete', 'keydown', this.deleteListener);
    manager.addKeyInput('Escape', 'keydown', this.escListener);
    manager.addMouseInput(viewerDiv, 'pointerdown', this.mouseDownListener);
  }

  setSelectedGO(uuid, object3D) {
    const world = this.gameView.getStateComputer().getWorldContext().getWorld();
    const go = world.getGameObject();
    this.goSelected = go.find(uuid);

    //clean
    const parent = this.goSelectedUI;
    while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
    }

    if (this.goSelected) {
      //attach transform ctrl
      this.transformControls.attach(object3D);
      this.transformControls.updateMatrixWorld();
      this.goSelectedUI.appendChild(this.createGOUI(this.goSelected));
    } else {
      this.transformControls.detach();
    }
  }

  createGOUI(go) {
    const result = document.createElement('div');
    result.classList.add('goUI_GOEditor');

    //name
    const inputName = document.createElement('input');
    inputName.type = 'text';
    inputName.value = go.getName();
    result.appendChild(inputName);

    //transform mode
    const translateButton = document.createElement('div');
    translateButton.innerHTML = 'translate';
    translateButton.classList.add('button_Editor');
    result.appendChild(translateButton);

    const rotateButton = document.createElement('div');
    rotateButton.classList.add('button_Editor');
    rotateButton.innerHTML = 'rotate';
    result.appendChild(rotateButton);

    const scaleButton = document.createElement('div');
    scaleButton.classList.add('button_Editor');
    scaleButton.innerHTML = 'scale';
    result.appendChild(scaleButton);

    //delete
    const deleteButton = document.createElement('div');
    deleteButton.classList.add('button_Editor');
    deleteButton.innerHTML = 'Delete';
    result.appendChild(deleteButton);

    //CALLBACKS
    const _this = this;
    deleteButton.onclick = function () {
      const world = _this.gameView
        .getStateComputer()
        .getWorldContext()
        .getWorld();

      //TODO code replication with delete of delete key

      go.removeFromParent();
      _this.setSelectedGO(null, null);

      //force update gameview
      _this.gameView.setUpdateGameObject(true);
      _this.gameView.update(world.computeWorldState());
      _this.gameView.setUpdateGameObject(false);

      _this.updateUI();
    };

    translateButton.onclick = function () {
      _this.transformControls.setMode('translate');
    };

    rotateButton.onclick = function () {
      _this.transformControls.setMode('rotate');
    };

    scaleButton.onclick = function () {
      _this.transformControls.setMode('scale');
    };

    inputName.onchange = function () {
      go.setName(inputName.value);
      _this.updateUI();
    };

    return result;
  }

  dispose() {
    this.ui.remove();

    this.transformControls.detach();
    this.transformControls.dispose();
    //remove listeners as well
    const manager = this.gameView.getInputManager();
    manager.removeInputListener(this.deleteListener);
    manager.removeInputListener(this.escListener);
    manager.removeInputListener(this.mouseDownListener);
  }

  updateUI() {
    //clean worlds list and rebuild it
    const list = this.goList;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    const world = this.gameView.getStateComputer().getWorldContext().getWorld();
    const go = world.getGameObject();
    const _this = this;
    go.traverse(function (child) {
      const li = document.createElement('li');
      li.classList.add('li_Editor');
      list.appendChild(li);
      li.innerHTML = child.getName();

      li.onclick = _this.goButtonClicked.bind(_this, child.getUUID());
    });
  }

  goButtonClicked(uuid) {
    const object3D = this.gameView.getObject3D();
    let objToFocus = null;
    object3D.traverse(function (c) {
      if (c.userData.gameObjectUUID == uuid) {
        objToFocus = c;
      }
    });

    if (!objToFocus) return;

    const camera = this.gameView.getItownsView().camera.camera3D;

    const bb = new THREE.Box3().setFromObject(objToFocus);
    const center = bb.getCenter(new THREE.Vector3());
    const radius = bb.min.distanceTo(bb.max) * 0.5;

    // compute new distance between camera and center of object/sphere
    const h = radius / Math.tan((camera.fov / 2) * THREE.Math.DEG2RAD);

    // get direction of camera
    const dir = new THREE.Vector3().subVectors(camera.position, center);

    // compute new camera position
    const newPos = new THREE.Vector3().addVectors(center, dir.setLength(h));

    camera.position.set(newPos.x, newPos.y, newPos.z);
    camera.lookAt(center);
    camera.updateProjectionMatrix();

    this.orbitControls.target.copy(center);
    this.orbitControls.update();

    this.setSelectedGO(uuid, objToFocus);
  }

  initUI() {
    this.goList = document.createElement('ul');
    this.goList.classList.add('ul_Editor');
    this.ui.appendChild(this.goList);

    this.goSelectedUI = document.createElement('div');
    this.ui.appendChild(this.goSelectedUI);

    this.updateUI();
  }

  initCallbacks() {}
}
