/** @format */

import './WorldEditorOld.css';
import { Game, Components } from 'ud-viz';
const File = Components.SystemUtils.File;

export class WorldEditorViewOld {
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

    let script;
    go.traverse(function (child) {
      const scripts = child.fetchWorldScripts();
      if (scripts && scripts['map']) script = scripts['map'];
    });

    if (!script) return;

    const wWorld = script.conf.heightmap_geometry.bounding_box.max.x;
    const hWorld = script.conf.heightmap_geometry.bounding_box.max.y;

    if (!wWorld || !hWorld) return;

    //update heightmap src
    if (!this.imgHeightmap) {
      const _this = this;

      world.getGameObject().traverse(function (g) {
        const s = g.fetchWorldScripts();
        if (s && s['map']) {
          //create html element
          _this.imgHeightmap = document.createElement('img');
          _this.imgHeightmap.classList.add('img_WorldEditorView');
          _this.imgHeightmap.src = s['map'].conf.heightmap_path;
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
      function (e) {
        Components.SystemUtils.File.readSingleFile(e, function (e) {
          const json = JSON.parse(e.target.result);
          console.log('Worlds = ', json);
          _this.onWorlds(json);
        });
      },
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

  updateUI() {
    //clean worlds list and rebuild it
    const list = this.worldsList;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
    const _this = this;
    this.worldsJSON.forEach(function (w) {
      const li = document.createElement('li');
      li.classList.add('li_Editor');
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
      //TODO no css inline (wait reafacto editor)
      htmlView.style.display = 'inline-block';
      htmlView.style.position = 'absolute';
      _this.updateUI();

      if (pUUID) {
        //place avatar (hack style local)
        const g = newWorld.getGameObject();
        const portal = g.find(pUUID);
        const avatar = g.find(_this.gameView.avatarUUID);

        portal.fetchWorldScripts()['portal'].setTransformOf(avatar);

        newWorld.updateCollisionBuffer();
      }
    });

    //register
    newWorld.on('portalEvent', function (params) {
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
    input.classList.add('input_Editor');
    input.setAttribute('type', 'file');
    this.ui.appendChild(input);
    this.input = input; //ref

    const worldsList = document.createElement('ul');
    worldsList.classList.add('ul_Editor');
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
      try {
        _this.initUI();

        _this.initCallbacks();

        _this.renderCanvas();

        resolve();
      } catch (e) {
        reject();
      }
    });
  }
}
