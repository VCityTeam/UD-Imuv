/** @format */

import { World } from 'ud-viz/src/Game/Game';
import { LocalGame } from 'ud-viz/src/Templates/Templates';
import { THREE } from 'ud-viz';
import './PlayWorldEditor.css';
import { computeMapGO } from '../Components/EditorUtility';

export class PlayWorldEditorView {
  constructor(params) {
    this.htmlParent = params.parentGameViewHtml;
    this.assetsManager = params.assetsManager;
    this.config = params.config;
    this.parentUIHtml = params.parentUIHtml;
    this.parentView = params.parentView;

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_PlayWorldEditor');
    this.parentUIHtml.appendChild(this.ui);

    this.localGameApp = new LocalGame();
    this.closeButton = null;
    this.canvasDebug = null;
    this.heightmapImg = null;

    this.heightmapConf = null;

    this.avatarGO = null;

    //interval canvas debug
    this.interval = null;

    this.initUI();
    this.initCallbacks();

    //start app
    this.startLocalGame(params.worldJSON);
  }

  startLocalGame(json) {
    const _this = this;

    const jsonCopy = JSON.parse(JSON.stringify(json));
    const world = new World(jsonCopy);

    const avatar = this.assetsManager.createPrefab('avatar');
    this.avatarGO = avatar;

    this.localGameApp
      .startWithAssetsLoaded(world, this.assetsManager, this.config, {
        htmlParent: this.htmlParent,
        userData: { avatarUUID: avatar.getUUID(), editorMode: true },
      })
      .then(function () {
        const gV = _this.localGameApp.getGameView();

        world.addGameObject(
          avatar,
          gV.getInterpolator().getWorldContext(),
          computeMapGO(gV)
        );

        //resize
        gV.setDisplaySize(new THREE.Vector2(_this.parentUIHtml.clientWidth, 0));

        gV.getInterpolator().addAfterTickRequester(function () {
          const worldComputer = gV.getInterpolator();
          const inputManager = gV.getInputManager();
          const cmds = inputManager.computeCommands();
          worldComputer.onCommands(cmds);
        });

        //start rendering canvas debug
        _this.interval = setInterval(_this.renderCanvasDebug.bind(_this), 100);
      });
  }

  dispose() {
    this.ui.remove();
    this.localGameApp.dispose();
    clearInterval(this.interval);
  }

  renderCanvasDebug() {
    const canvas = this.canvasDebug;

    if (!this.heightmapImg) {
      const mapGO = computeMapGO(this.localGameApp.getGameView());
      this.heightmapImg = document.createElement('img');
      this.heightmapConf = mapGO.fetchWorldScripts()['map'].conf;
      this.heightmapImg.src = this.heightmapConf.heightmap_path;

      this.heightmapImg.onload = function () {
        canvas.width = this.width;
        canvas.height = this.height;
      };
    }

    const ctx = this.canvasDebug.getContext('2d');
    ctx.drawImage(this.heightmapImg, 0, 0);

    const pixelSize = this.heightmapConf.heightmap_geometry.size / canvas.width;
    const avatarPos = this.avatarGO.getPosition();
    const center = canvas.width * 0.5;
    const avatarPosCanavs = {
      x: center + avatarPos.x / pixelSize,
      y: center - avatarPos.y / pixelSize,
    };
    ctx.beginPath();
    ctx.fillStyle = 'red';
    ctx.arc(avatarPosCanavs.x, avatarPosCanavs.y, 10, 0, Math.PI * 2);
    ctx.fill();

    //draw collison body
    const world = this.localGameApp
      .getGameView()
      .getInterpolator()
      .getWorldContext()
      .getWorld();
    ctx.beginPath();
    ctx.save();
    ctx.translate(center, center);
    ctx.scale(1 / pixelSize, -1 / pixelSize);
    world.getCollisions().draw(ctx);
    ctx.fillStyle = 'green';
    ctx.fill();
    ctx.restore();

    //draw axis
  }

  initUI() {
    this.closeButton = document.createElement('div');
    this.closeButton.classList.add('button_Editor');
    this.closeButton.innerHTML = 'STOP';
    this.ui.appendChild(this.closeButton);

    this.canvasDebug = document.createElement('canvas');
    this.canvasDebug.classList.add('canvas_Editor');
    this.ui.appendChild(this.canvasDebug);
  }

  initCallbacks() {}

  setOnClose(f) {
    this.closeButton.onclick = f;
  }
}
