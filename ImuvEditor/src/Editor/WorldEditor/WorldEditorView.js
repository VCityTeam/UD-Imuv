/** @format */

import './WorldEditor.css';
import RenderComponent from 'ud-viz/src/Game/Shared/GameObject/Components/RenderComponent';
import { Game, GameView, Components } from 'ud-viz';
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
    this.worldsList = null;
    this.canvasCollision = null;
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

  renderCanvasCollision() {
    requestAnimationFrame(this.renderCanvasCollision.bind(this));

    if (!this.gameView || this.pause) return;
    const world = this.gameView.getWorld();
    if (!world) return;
    const go = world.getGameObject();
    if (!go.getObject3D()) return;
    const bb = go.getComponent(RenderComponent.TYPE).computeBoundingBox();

    const w = bb.max.x - bb.min.x;
    const h = bb.max.y - bb.min.y;

    this.canvasCollision.width = w;
    this.canvasCollision.height = h;

    const ctx = this.canvasCollision.getContext('2d');
    ctx.clearRect(
      0,
      0,
      this.canvasCollision.width,
      this.canvasCollision.height
    );
    ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath();
    world.getCollisions().draw(ctx);
    ctx.stroke();
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

      //path remain
      _this.currentWorld.getGameObject().traverse(function (g) {
        const s = g.getScripts();

        //dont change path
        if (s && s['map']) {
          const path = s['map'].conf.heightmap_path;
          const index = path.indexOf('/assets');
          s['map'].conf.heightmap_path =
            _this.pathDirectory + path.slice(index);
        }
      });

      //change in world array
      _this.worldsJSON.forEach(function (w) {
        if (w.uuid == _this.currentWorld.getUUID()) {
          const clone = _this.currentWorld.clone();
          
          debugger
          
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
      var file = e.target.files[0];
      if (!file) {
        return;
      }
      const _this = this;
      var reader = new FileReader();
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
      li.onclick = _this.onWorldJSON.bind(_this, w);
      list.appendChild(li);
    });

    //update heightmap
    if (this.gameView && !this.imgHeightmap.src) {
      const world = this.gameView.getWorld();
      if (world) {
        world.getGameObject().traverse(function (g) {
          const s = g.getScripts();
          if (s && s['map']) {
            const path = s['map'].conf.heightmap_path;
            _this.imgHeightmap.src = path;
          }
        });
      }
    }
  }

  onWorldJSON(json) {
    const world = new Game.Shared.World(json, { isServerSide: false });
    const _this = this;

    world.getGameObject().initAssets(this.assetsManager, Game.Shared);

    //remain path of heightmap
    world.getGameObject().traverse(function (g) {
      const s = g.getScripts();
      if (s && s['map']) {
        const path = s['map'].conf.heightmap_path;
        const index = path.indexOf('/assets');
        _this.pathDirectory = path.slice(0, index);
        s['map'].conf.heightmap_path = '..' + path.slice(index);
      }
    });
    this.currentWorld = world;

    this.onWorld(world);
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
    const canvasCollision = document.createElement('canvas');
    canvasCollision.classList.add('canvas_preview');
    this.ui.appendChild(canvasCollision);
    this.canvasCollision = canvasCollision;

    const stopButton = document.createElement('div');
    stopButton.innerHTML = 'Stop Game';
    stopButton.classList.add('button_Editor');
    this.ui.appendChild(stopButton);
    this.stopButton = stopButton;

    const imgDiv = document.createElement('img');
    this.ui.appendChild(imgDiv);
    this.imgHeightmap = imgDiv;

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

      _this.renderCanvasCollision();

      resolve();
    });
  }

  onWorld(newWorld) {
    this.stopGame();

    const _this = this;

    this.gameView = new GameView({
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
      _this.rootHtml.appendChild(htmlView);
    });

    this.updateUI();
  }
}
