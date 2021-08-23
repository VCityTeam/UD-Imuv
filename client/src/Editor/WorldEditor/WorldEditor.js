/** @format */

import './WorldEditor.css';
import { ColliderEditorView } from '../ColliderEditor/ColliderEditor';
import Shared from 'ud-viz/src/Game/Shared/Shared';
import * as udviz from 'ud-viz';
import { GameView } from 'ud-viz/src/Views/Views';
import { THREE, OrbitControls, TransformControls } from 'ud-viz';

export class WorldEditorView {
  constructor(params) {
    this.config = params.config;

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_WorldEditor');
    params.parentUIHtml.appendChild(this.ui);

    //html
    this.closeButton = null;
    this.toolsButtons = null;

    this.model = new WorldEditorModel(params.assetsManager, params.worldJSON);

    this.gameView = new GameView({
      htmlParent: params.parentGameViewHtml,
      assetsManager: params.assetsManager,
      config: this.config,
      firstGameView: false,
      stateComputer: this.model.getWorldStateComputer(),
    });
    this.gameView.setUpdateGameObject(false);
    this.gameView.onFirstState(
      this.model.getWorldStateComputer().computeCurrentState(),
      null
    );
    //offset the gameview
    this.gameView.setDisplaySize(
      new THREE.Vector2(params.parentUIHtml.clientWidth, 0)
    );

    this.transformButton = null;
    this.colliderButton = null;
    this.heightmapButton = null;
    this.addObjectButton = null;

    this.labelCurrentWorld = null;
    this.toolsList = null;

    //controls
    this.orbitControls = null;
    this.transformControls = null;

    this.initUI();
    this.initCallbacks();
    this.initOrbitControls();
    this.initTransformControls();
  }

  getGameView() {
    return this.gameView;
  }

  dispose() {
    this.gameView.dispose();
    this.ui.remove();
    this.orbitControls.dispose();
    this.transformControls.dispose();
  }

  initUI() {
    this.toolsButtons = document.createElement('div');
    this.toolsButtons.classList.add('ul_WorldEditor');
    this.ui.appendChild(this.toolsButtons);

    const labelCurrentWorld = document.createElement('p');
    labelCurrentWorld.innerHTML =
      this.gameView.getStateComputer().getWorldContext().getWorld().getName() +
      ' :';
    this.ui.appendChild(labelCurrentWorld);
    this.labelCurrentWorld = labelCurrentWorld;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'Close';
    this.ui.appendChild(closeButton);
    this.closeButton = closeButton;

    const transformButton = document.createElement('li');
    transformButton.classList.add('li_Editor');
    transformButton.innerHTML = 'Transform';
    this.toolsButtons.appendChild(transformButton);
    this.transformButton = transformButton;

    const colliderButton = document.createElement('li');
    colliderButton.classList.add('li_Editor');
    colliderButton.innerHTML = 'Collider';
    this.toolsButtons.appendChild(colliderButton);
    this.colliderButton = colliderButton;

    const heightmapButton = document.createElement('li');
    heightmapButton.classList.add('li_Editor');
    heightmapButton.innerHTML = 'Heightmap';
    this.toolsButtons.appendChild(heightmapButton);
    this.heightmapButton = heightmapButton;

    const addObjectButton = document.createElement('li');
    addObjectButton.classList.add('li_Editor');
    addObjectButton.innerHTML = 'Add Object';
    this.toolsButtons.appendChild(addObjectButton);
    this.addObjectButton = addObjectButton;
  }

  initCallbacks() {
    const _this = this;

    _this.colliderButton.onclick = function () {
      const cev = new ColliderEditorView({
        parentUIHtml: _this.ui,
        gameView: _this.gameView,
        parentOC: _this.orbitControls,
        parentTC: _this.transformControls,
      });
      cev.setOnClose(function () {
        cev.dispose();
        // _this.rootHtml.appendChild(_this.ui);
      });
    };
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
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
        // console.log('orbit enabled ', !event.value);
      }
    );

    //CALLBACKS
    manager.addKeyInput('Escape', 'keydown', function () {
      _this.transformControls.detach();
    });

    manager.addMouseInput(viewerDiv, 'pointerdown', function (event) {
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
    });
  }

  initOrbitControls() {
    //new controls
    if (this.orbitControls) this.orbitControls.dispose();

    this.orbitControls = new OrbitControls(
      this.gameView.getItownsView().camera.camera3D,
      this.gameView.rootItownsHtml
    );

    this.orbitControls.target.copy(this.gameView.getExtent().center());
    // this.orbitControls.rotateSpeed = 0.5;
    // this.orbitControls.zoomSpeed = 0.1;
    this.orbitControls.update();
  }
}

class WorldEditorModel {
  constructor(assetsManager, json) {
    this.worldStateComputer = new Shared.WorldStateComputer(assetsManager, 30, {
      udviz: udviz,
      Shared: Shared,
    });

    this.onWorldJSON(json);
  }

  onWorldJSON(json) {
    this.worldStateComputer.onInit(new Shared.World(json));
  }

  getWorldStateComputer() {
    return this.worldStateComputer;
  }
}
