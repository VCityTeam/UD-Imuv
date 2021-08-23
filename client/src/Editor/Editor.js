/** @format */

import './Editor.css';
import { Game, THREE, OrbitControls, TransformControls } from 'ud-viz';
import { GameView } from 'ud-viz/src/Views/GameView/GameView';
import Shared from 'ud-viz/src/Game/Shared/Shared';
import * as udviz from 'ud-viz';
import Constants from 'ud-viz/src/Game/Shared/Components/Constants';

export class EditorView {
  constructor(webSocketService, config) {
    this.config = config;

    this.webSocketService = webSocketService;

    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_Editor');

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_Editor');
    this.rootHtml.appendChild(this.ui);

    //html
    this.worldsList = null;
    this.saveWorldsButton = null;

    //assets
    this.assetsManager = new Game.Components.AssetsManager();

    //model
    this.model = new EditorModel(this.assetsManager);

    //gameview
    this.currentGameView = null;

    //controls
    this.orbitControls = null;
    this.transformControls = null;
  }

  dispose() {
    this.rootHtml.remove();
    if (this.orbitControls) this.orbitControls.dispose();
    if (this.transformControls) this.transformControls.dispose();
    if (this.currentGameView) this.currentGameView.dispose();
  }

  initUI() {
    const worldsList = document.createElement('ul');
    worldsList.classList.add('ul_Editor');
    this.ui.appendChild(worldsList);
    this.worldsList = worldsList;

    this.saveWorldsButton = document.createElement('div');
    this.saveWorldsButton.classList.add('button_Editor');
    this.saveWorldsButton.innerHTML = 'Save Worlds';
    this.ui.appendChild(this.saveWorldsButton);
  }

  initCallbacks() {
    const _this = this;

    this.saveWorldsButton.onclick = function () {
      console.log('Save worlds');
      _this.webSocketService.emit(
        Constants.WEBSOCKET.MSG_TYPES.SAVE_WORLDS,
        _this.assetsManager.getWorldsJSON()
      );
    };
  }

  updateUI() {
    const worldsJSON = this.assetsManager.getWorldsJSON();
    //clean worlds list and rebuild it
    const list = this.worldsList;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
    const _this = this;
    worldsJSON.forEach(function (w) {
      const li = document.createElement('li');
      li.classList.add('li_Editor');
      li.innerHTML = w.name;
      li.onclick = _this.onWorldJSON.bind(_this, w);
      list.appendChild(li);
    });
  }

  onWorldJSON(json) {
    if (this.currentGameView) {
      this.currentGameView.dispose();
    }

    this.model.onWorldJSON(json);

    this.currentGameView = new GameView({
      htmlParent: this.rootHtml,
      assetsManager: this.assetsManager,
      stateComputer: this.model.getWorldStateComputer(),
      config: this.config,
      firstGameView: false,
    });

    this.currentGameView.setUpdateGameObject(false);

    this.currentGameView.onFirstState(
      this.model.getWorldStateComputer().computeCurrentState(),
      null
    );

    //offset the gameview
    this.currentGameView.setDisplaySize(
      new THREE.Vector2(this.ui.clientWidth, 0)
    );

    this.initOrbitControls();
    this.initTransformControls();
  }

  initTransformControls() {
    if (this.transformControls) this.transformControls.dispose();

    const camera = this.currentGameView.getItownsView().camera.camera3D;
    const scene = this.currentGameView.getItownsView().scene;
    const manager = this.currentGameView.getInputManager();
    const viewerDiv = this.currentGameView.rootItownsHtml;

    this.transformControls = new TransformControls(camera, viewerDiv);
    scene.add(this.transformControls);

    const _this = this;

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
        _this.currentGameView.getObject3D(),
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
      this.currentGameView.getItownsView().camera.camera3D,
      this.currentGameView.rootItownsHtml
    );

    this.orbitControls.target.copy(this.currentGameView.getExtent().center());
    this.orbitControls.rotateSpeed = 0.5;
    this.orbitControls.zoomSpeed = 0.1;
    this.orbitControls.update();
  }

  load() {
    const _this = this;
    return new Promise((resolve, reject) => {
      try {
        _this.assetsManager
          .loadFromConfig(_this.config.assetsManager)
          .then(function () {
            _this.initUI();
            _this.initCallbacks();
            _this.updateUI();
            resolve();
          });
      } catch (e) {
        reject();
      }
    });
  }

  html() {
    return this.rootHtml;
  }
}

class EditorModel {
  constructor(assetsManager) {
    this.worldStateComputer = new Shared.WorldStateComputer(assetsManager, 30, {
      udviz: udviz,
      Shared: Shared,
    });
  }

  onWorldJSON(json) {
    this.worldStateComputer.onInit(new Shared.World(json));
  }

  getWorldStateComputer() {
    return this.worldStateComputer;
  }
}
