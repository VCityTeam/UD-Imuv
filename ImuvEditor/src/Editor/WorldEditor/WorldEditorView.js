/** @format */

import './WorldEditor.css';
import { Game, Components, THREE } from 'ud-viz';
const File = Components.SystemUtils.File;

export class WorldEditorView {
  constructor(config, assetsManager) {
    this.config = config;

    //where ui is append
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_WorldEditorView');

    //where html
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_WorldEditorView');
    this.rootHtml.appendChild(this.ui);

    this.pause = false;

    //game
    this.gameView = null;

    //assets
    this.assetsManager = assetsManager;

    //json
    this.worldsJSON = null;

    //html
    this.input = null;
    this.worldsList = null;
    this.canvasPreview = null;
    this.stopButton = null;
    this.imgHeightmap = null;
    this.saveButton = null;
  }

  setPause(value) {
    this.pause = value;
  }

  html() {
    return this.rootHtml;
  }

  renderCanvas() {
    requestAnimationFrame(this.renderCanvas.bind(this));

    if (!this.gameView || this.pause) return;
    const world = this.gameView.getWorld();
    if (!world) return;
    const go = world.getGameObject();
    const obj = go.fetchObject3D();
    if (!obj) return;
    const bb = new THREE.Box3().setFromObject(obj);

    const wWorld = bb.max.x - bb.min.x;
    const hWorld = bb.max.y - bb.min.y;
    if (!wWorld || !hWorld) return;

    //update heightmap src

    if (!this.imgHeightmap) {
      const _this = this;

      world.getGameObject().traverse(function (g) {
        const s = g.getScripts();
        if (s && s['map']) {
          //consider assets are in ./
          let path = s['map'].conf.heightmap_path;
          const index = path.indexOf('/assets');
          path = './' + path.slice(index);

          //create html element
          _this.imgHeightmap = document.createElement('img');
          _this.imgHeightmap.src = path;
        }
      });
    }

    const wCanvas = this.canvasPreview.width;
    const hCanvas = this.canvasPreview.height;

    const ctx = this.canvasPreview.getContext('2d');

    //clear rect
    ctx.clearRect(0, 0, wCanvas, hCanvas);

    //draw heightmap
    if (this.imgHeightmap) {
      ctx.save();
      ctx.transform(1, 0, 0, -1, 0, hCanvas);
      ctx.drawImage(this.imgHeightmap, 0, 0, wCanvas, hCanvas);
      ctx.restore();
    }

    //draw collison body
    ctx.beginPath();
    ctx.save();
    ctx.scale(wCanvas / wWorld, hCanvas / hWorld);
    world.getCollisions().draw(ctx);
    ctx.strokeStyle = 'red';
    ctx.stroke();
    ctx.restore();
  }

  initCallbacks() {
    const _this = this;

    //input
    this.input.addEventListener(
      'change',
      this.readSingleFile.bind(this),
      false
    );

    this.stopButton.onclick = this.stopGame.bind(this);

    this.saveButton.onclick = function () {
      if (!_this.currentWorld) return;

      //change in world array
      _this.worldsJSON.forEach(function (w) {
        if (w.uuid == _this.currentWorld.getUUID()) {
          const clone = _this.currentWorld.clone();

          //remove avatar before saving
          clone.getGameObject().traverse(function (g) {
            if (g.name == 'avatar') {
              g.removeFromParent();
            }
          });
          w = clone.toJSON();
        }
      });

      //download array
      File.downloadObjectAsJson(_this.worldsJSON, 'worlds');
    };
  }

  readSingleFile(e) {
    try {
      const file = e.target.files[0];
      if (!file) {
        return;
      }
      const _this = this;
      const reader = new FileReader();
      reader.onload = function (e) {
        const json = JSON.parse(e.target.result);
        console.log('Worlds = ', json);
        _this.onWorlds(json);
      };

      reader.readAsText(file);
    } catch (e) {
      throw new Error(e);
    }
  }

  updateUI() {
    //clean worlds list and rebuild it
    const list = this.worldsList;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
    const _this = this;
    this.worldsJSON.forEach(function (w) {
      const li = document.createElement('li');
      li.innerHTML = w.name;
      li.onclick = _this.onWorldJSON.bind(_this, w, null);
      list.appendChild(li);
    });
  }

  onWorldJSON(json, pUUID) {
    const newWorld = new Game.Shared.World(json, { isServerSide: false });

    this.currentWorld = newWorld;

    //reset
    this.imgHeightmap = null;

    this.stopGame();

    const _this = this;

    this.gameView = new Game.GameView({
      htmlParent: this.rootHtml,
      assetsManager: this.assetsManager,
      isLocal: true,
      config: this.config,
    });
    this.gameView.setWorld(newWorld);

    this.gameView.load().then(function () {
      const htmlView = _this.gameView.html();
      //TODO no css inline
      htmlView.style.display = 'inline-block';
      htmlView.style.position = 'absolute';
      _this.updateUI();

      if (pUUID) {
        //place avatar (hack style local)
        const g = newWorld.getGameObject();
        const portal = g.find(pUUID);
        const avatar = g.find(_this.gameView.avatarUUID);
        avatar.setTransformFromJSON(portal.getTransform());
        newWorld.updateCollisionBuffer();
      }
    });

    //register
    newWorld.on('portalEvent', function (params) {
      const avatar = params[0];
      const worldToGoUUID = params[1];
      const portalUUID = params[2];

      let worldDest;
      for (let index = 0; index < _this.worldsJSON.length; index++) {
        const element = _this.worldsJSON[index];
        if (element.uuid == worldToGoUUID) {
          worldDest = element;
          break;
        }
      }

      if (!worldDest) {
        console.warn('no world dest ', worldToGoUUID);
      } else {
        _this.onWorldJSON(worldDest, portalUUID);
      }
    });
  }

  onWorlds(json) {
    if (!json) throw new Error('wrong json');
    this.worldsJSON = json;
    this.updateUI();
  }

  stopGame() {
    if (this.gameView) {
      this.gameView.dispose();
      this.gameView = null;
    }
  }

  initUI() {
    //open a world
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    this.ui.appendChild(input);
    this.input = input; //ref

    const worldsList = document.createElement('ul');
    this.ui.appendChild(worldsList);
    this.worldsList = worldsList;

    //preview
    const canvasPreview = document.createElement('canvas');
    canvasPreview.classList.add('canvas_preview');
    this.ui.appendChild(canvasPreview);
    this.canvasPreview = canvasPreview;

    const stopButton = document.createElement('div');
    stopButton.innerHTML = 'Stop Game';
    stopButton.classList.add('button_Editor');
    this.ui.appendChild(stopButton);
    this.stopButton = stopButton;

    const saveButton = document.createElement('div');
    saveButton.classList.add('button_Editor');
    saveButton.innerHTML = 'Download';
    this.ui.appendChild(saveButton);
    this.saveButton = saveButton;
  }

  load() {
    const _this = this;
    return new Promise((resolve, reject) => {
      _this.initUI();

      _this.initCallbacks();

      _this.renderCanvas();

      resolve();
    });
  }
}
