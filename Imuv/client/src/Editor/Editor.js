/** @format */

import './Editor.css';
import { Game, THREE, OrbitControls, TransformControls } from 'ud-viz';
import { GameView } from 'ud-viz/src/View/GameView/GameView';
import { LocalComputer } from 'ud-viz/src/Game/Components/StateComputer/LocalComputer';

export class EditorView {
  constructor(config) {
    this.config = config;

    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_Editor');

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_Editor');
    this.rootHtml.appendChild(this.ui);

    //html
    this.worldsList = null;

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
  }

  initCallbacks() {
    const _this = this;
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
      stateComputer: this.model.getLocalComputer(),
      config: this.config,
      firstGameView: false,
    });

    this.currentGameView.onFirstState(
      this.model.getLocalComputer().computeCurrentState(),
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

    const _this = this;
    const renderer =
      this.currentGameView.getItownsView().mainLoop.gfxEngine.renderer;

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
            scene.add(_this.transformControls);
            console.log('attach to ', current.name);
          }
        }
      }
    });
  }

  initOrbitControls() {
    //new controls
    if (this.orbitControls) this.orbitControls.dispose();

    const _this = this;
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
    this.localComputer = null;
    this.assetsManager = assetsManager;
  }

  onWorldJSON(json) {
    //init localcomputer
    this.localComputer = new LocalComputer(
      new Game.Shared.World(json),
      this.assetsManager
    );

    this.localComputer.load();
  }

  getLocalComputer() {
    return this.localComputer;
  }
}
