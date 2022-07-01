const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;

const MINI_MAP_SIZE = 512;
const AVATAR_RADIUS_MIN = 5;
const AVATAR_RADIUS_MAX = 15;

module.exports = class MiniMap {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    if (!this.conf.mini_map_size) console.error('no mini map size in conf');

    udviz = udvizBundle;

    this.backgroundImage = document.createElement('img');

    this.renderer = new udviz.THREE.WebGLRenderer({
      canvas: document.createElement('canvas'),
      antialias: true,
    });
    this.renderer.setSize(MINI_MAP_SIZE, MINI_MAP_SIZE);

    //what is display
    this.ui = document.createElement('canvas');
    this.ui.width = MINI_MAP_SIZE;
    this.ui.height = MINI_MAP_SIZE;
    this.ui.style.width = MINI_MAP_SIZE + 'px';
    this.ui.style.height = MINI_MAP_SIZE + 'px';
    this.ui.style.background = 'red';

    this.currentDT = 0;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();

    const manager = gameView.getInputManager();
    let displayMiniMap = false;
    const ui = this.ui;
    const conf = this.conf;
    manager.addKeyInput('m', 'keydown', function () {
      displayMiniMap = !displayMiniMap;

      if (displayMiniMap) {
        gameView.appendToUI(ui);
      } else {
        ui.remove();
      }
    });

    ui.onclick = function (event) {
      const x = event.pageX;
      const y = event.pageY;
      const rect = this.getBoundingClientRect();
      const ratioX = (x - rect.left) / (rect.right - rect.left);
      const ratioY = 1 - (y - rect.top) / (rect.bottom - rect.top);

      const teleportPosition = new udviz.THREE.Vector3(
        (ratioX - 0.5) * conf.mini_map_size,
        (ratioY - 0.5) * conf.mini_map_size,
        0
      );
      const webSocketService = localCtx.getWebSocketService();
      const ImuvConstants = localCtx.getGameView().getLocalScriptModules()[
        'ImuvConstants'
      ];
      const pixelData = this.getContext('2d').getImageData(
        x - rect.left,
        y - rect.top,
        1,
        1
      ).data;
      if (pixelData[0] == 0 && pixelData[1] == 0 && pixelData[2] == 0) return;
      webSocketService.emit(ImuvConstants.WEBSOCKET.MSG_TYPES.TELEPORT_AVATAR, {
        avatarUUID: localCtx.getGameView().getUserData('avatarUUID'),
        teleportPosition: teleportPosition,
      });
    };
  }

  onNewGameObject() {
    const newGO = arguments[2];

    if (newGO.isStatic()) {
      const scene = new udviz.THREE.Scene();
      const utils = udviz.Game.Components.THREEUtils;
      utils.addLights(scene);

      newGO.computeRoot().traverse(function (g) {
        if (g.isStatic()) {
          const r = g.getComponent(udviz.Game.Render.TYPE);
          if (r) {
            const clone = r.getObject3D().clone();

            const wT = g.computeWorldTransform();

            clone.position.x = wT.position.x;
            clone.position.y = wT.position.y;
            clone.position.z = wT.position.z;

            clone.rotation.x = wT.rotation.x;
            clone.rotation.y = wT.rotation.y;
            clone.rotation.z = wT.rotation.z;

            clone.scale.x = wT.scale.x;
            clone.scale.y = wT.scale.y;
            clone.scale.z = wT.scale.z;

            clone.updateMatrixWorld();
            scene.add(clone);
          }
        }
      });

      scene.updateMatrixWorld();

      const halfSize = this.conf.mini_map_size * 0.5;
      const camera = new udviz.THREE.OrthographicCamera(
        -halfSize,
        halfSize,
        halfSize,
        -halfSize,
        0.001,
        1000
      );
      camera.position.z = 100; //to be sure to not cull something
      camera.updateProjectionMatrix();

      this.renderer.render(scene, camera);
      this.backgroundImage.src = this.renderer.domElement.toDataURL();
    }
  }

  tick() {
    const go = arguments[0];
    const localCtx = arguments[1];

    //write
    const destCtx = this.ui.getContext('2d');
    destCtx.drawImage(this.backgroundImage, 0, 0);

    this.currentDT += localCtx.getDt() * 0.002;

    //draw avatar
    const avatarGO = go
      .computeRoot()
      .find(localCtx.getGameView().getUserData('avatarUUID'));
    if (avatarGO) {
      const avatarPos = avatarGO.getPosition();
      const pixelSize = this.conf.mini_map_size / MINI_MAP_SIZE;

      const radius =
        AVATAR_RADIUS_MIN +
        (AVATAR_RADIUS_MAX - AVATAR_RADIUS_MIN) *
          Math.abs(Math.cos(this.currentDT));

      const avatarPosCanvas = {
        x: MINI_MAP_SIZE * 0.5 + avatarPos.x / pixelSize,
        y: MINI_MAP_SIZE * 0.5 - avatarPos.y / pixelSize,
      };
      destCtx.beginPath();
      destCtx.fillStyle = 'red';
      destCtx.arc(avatarPosCanvas.x, avatarPosCanvas.y, radius, 0, Math.PI * 2);
      destCtx.fill();
    }
  }
};
