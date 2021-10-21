let udviz = null;

const MINI_MAP_SIZE = 512;

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
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();

    const manager = gameView.getInputManager();
    let displayMiniMap = false;
    const ui = this.ui;
    manager.addKeyInput('m', 'keydown', function () {
      displayMiniMap = !displayMiniMap;

      if (displayMiniMap) {
        gameView.appendToUI(ui);
      } else {
        ui.remove();
      }
    });
  }

  onNewGameObject() {
    const newGO = arguments[2];

    if (newGO.isStatic()) {
      const scene = new udviz.THREE.Scene();
      const utils = udviz.Game.Shared.Components.THREEUtils;
      utils.addLights(scene);

      newGO.computeRoot().traverse(function (g) {
        if (g.isStatic()) {
          const r = g.getComponent(udviz.Game.Shared.Render.TYPE);
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

    //draw avatar
    const avatarGO = go
      .computeRoot()
      .find(localCtx.getGameView().getUserData('avatarUUID'));
    if (avatarGO) {
      const avatarPos = avatarGO.getPosition();
      const pixelSize = this.conf.mini_map_size / MINI_MAP_SIZE;

      const avatarPosCanavs = {
        x: MINI_MAP_SIZE * 0.5 + avatarPos.x / pixelSize,
        y: MINI_MAP_SIZE * 0.5 - avatarPos.y / pixelSize,
      };
      destCtx.beginPath();
      destCtx.strokeStyle = 'red';
      destCtx.arc(avatarPosCanavs.x, avatarPosCanavs.y, 10, 0, Math.PI * 2);
      destCtx.stroke();
    }
  }
};
