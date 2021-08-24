/** @format */

import './TransformEditor.css';

import { THREE, TransformControls } from 'ud-viz';

export class TransformEditorView {
  constructor(params) {
    //parent attr
    this.gameView = params.gameView;
    this.orbitControls = params.orbitControls;

    //raycaster
    this.raycaster = new THREE.Raycaster();

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_TransformEditor');
    params.parentUIHtml.appendChild(this.ui);

    //html
    this.translateButton = null;
    this.scaleButton = null;
    this.rotateButton = null;
    this.closeButton = null;

    //controls
    this.transformControls = null;

    //listeners
    this.escListener = null;
    this.deleteListener = null;
    this.mouseDownListener = null;

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
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      //3. compute intersections
      //TODO opti en enlevant la recursive et en selectionnant seulement les bon object3D
      const intersects = raycaster.intersectObject(
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
            _this.transformControls.attach(current);
            _this.transformControls.updateMatrixWorld();

            console.log('attach to ', current.name);
          }
        }
      }
    };

    //CALLBACKS
    manager.addKeyInput('Delete', 'keydown', this.deleteListener);
    manager.addKeyInput('Escape', 'keydown', this.escListener);
    manager.addMouseInput(viewerDiv, 'pointerdown', this.mouseDownListener);
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

  initUI() {
    this.translateButton = document.createElement('div');
    this.translateButton.classList.add('button_Editor');
    this.translateButton.innerHTML = 'Translate';
    this.ui.appendChild(this.translateButton);

    this.rotateButton = document.createElement('div');
    this.rotateButton.classList.add('button_Editor');
    this.rotateButton.innerHTML = 'rotate';
    this.ui.appendChild(this.rotateButton);

    this.scaleButton = document.createElement('div');
    this.scaleButton.classList.add('button_Editor');
    this.scaleButton.innerHTML = 'scale';
    this.ui.appendChild(this.scaleButton);

    const closeButton = document.createElement('div');
    closeButton.classList.add('button_Editor');
    closeButton.innerHTML = 'Close';
    this.ui.appendChild(closeButton);
    this.closeButton = closeButton;
  }

  initCallbacks() {
    const _this = this;

    this.translateButton.onclick = function () {
      _this.transformControls.setMode('translate');
    };

    this.rotateButton.onclick = function () {
      _this.transformControls.setMode('rotate');
    };

    this.scaleButton.onclick = function () {
      _this.transformControls.setMode('scale');
    };
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }
}

//unused TODO clean ?
export class TransformEditorModel {
  constructor() {
    this.onHoverGO = null;
    this.selectedGO = null;
  }

  setSelectedGO(newGO) {
    if (newGO == this.selectedGO) return;
    this.selectedGO = this.setColorSelected(
      this.selectedGO,
      new THREE.Color('rgb(255, 255, 255)')
    );
    this.selectedGO = this.setColorSelected(
      newGO,
      new THREE.Color('rgb(255, 0, 0)')
    );
  }

  selectGO() {
    this.setSelectedGO(this.onHoverGO);
  }

  setOnHoverGO(newGO) {
    if (newGO) {
      newGO = this.getRootGO(newGO);
    }
    this.onHoverGO = newGO;
  }

  setColorSelected(newGO, newColor) {
    if (newGO) {
      newGO.traverse(function (children) {
        if (children.material) {
          children.material.color = newColor;
        }
      });
    }
    return newGO;
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
