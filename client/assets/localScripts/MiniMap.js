const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;

const MINI_MAP_SIZE = 700;
const AVATAR_SIZE_MIN = 15;
const AVATAR_SIZE_MAX = 25;
const MAGNETISM = 2;

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
    this.ui.id = 'canvas_mini_map';
    this.ui.width = MINI_MAP_SIZE;
    this.ui.height = MINI_MAP_SIZE;
    this.ui.style.width = MINI_MAP_SIZE + 'px';
    this.ui.style.height = MINI_MAP_SIZE + 'px';

    this.currentDT = 0;

    this.portalIcons = [];
    this.defaultCanvas = null;

    //map is displayed or not
    this.displayMiniMap = false;
  }

  /**
   * It adds a key input listener to the game view's input manager, which toggles the display of the
   * mini map
   */
  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    const userID = gameView.getUserData('userID');
    console.log('init mini map');

    const manager = gameView.getInputManager();
    const Command = udviz.Game.Command;

    const _this = this;
    const ui = this.ui;
    const conf = this.conf;

    /* Finding the position of the portals and adding them to the array. */
    const portalIcons = this.portalIcons;
    go.traverse(function (child) {
      const lS = child.fetchLocalScripts();
      if (lS && lS['portal_sweep']) {
        portalIcons.push(new PortalIcon(child.getPosition()));
      }
    });

    //add button ui
    const button = document.createElement('button');
    button.innerHTML = 'mini map';
    gameView.appendToUI(button);
    button.onclick = function () {
      _this.displayMiniMap = !_this.displayMiniMap;

      if (_this.displayMiniMap) {
        gameView.appendToUI(ui);
      } else {
        ui.remove();
      }
    };

    manager.addMouseCommand('click', function () {
      const event = this.event('click');

      if (event.target != ui) return null;
      const x = event.pageX;
      const y = event.pageY;

      const rect = event.target.getBoundingClientRect();
      const ratioX = (x - rect.left) / (rect.right - rect.left);
      const ratioY = 1 - (y - rect.top) / (rect.bottom - rect.top);

      const teleportPosition = new udviz.THREE.Vector3(
        (ratioX - 0.5) * conf.mini_map_size,
        (ratioY - 0.5) * conf.mini_map_size,
        0
      );

      //MAGNETISM
      _this.portalIcons.forEach(function (icon) {
        const posIcon = icon.getPosition();
        if (
          Math.abs(posIcon.x - teleportPosition.x) < MAGNETISM &&
          Math.abs(posIcon.y - teleportPosition.y) < MAGNETISM
        ) {
          teleportPosition.x = posIcon.x;
          teleportPosition.y = posIcon.y;
        }
      });

      return new Command({
        type: Command.TYPE.TELEPORT,
        data: {
          mousePosition: { x: x, y: y },
          position: teleportPosition,
          avatarUUID: gameView.getUserData('avatarUUID'),
        },
        userID: userID,
      });
    });

    manager.addMouseInput(this.ui, 'mousemove', function (event) {
      const x = event.pageX;
      const y = event.pageY;

      const rect = _this.ui.getBoundingClientRect();
      const ratioX = (x - rect.left) / (rect.right - rect.left);
      const ratioY = 1 - (y - rect.top) / (rect.bottom - rect.top);

      const positionMouse = new udviz.THREE.Vector3(
        (ratioX - 0.5) * conf.mini_map_size,
        (ratioY - 0.5) * conf.mini_map_size,
        0
      );

      _this.portalIcons.forEach(function (icon) {
        const posIcon = icon.getPosition();
        if (
          Math.abs(posIcon.x - positionMouse.x) < MAGNETISM &&
          Math.abs(posIcon.y - positionMouse.y) < MAGNETISM
        ) {
          icon.setHover(true);
        } else {
          icon.setHover(false);
        }
      });
    });
  }

  onNewGameObject() {
    const newGO = arguments[2];

    if (newGO.isStatic()) {
      const scene = new udviz.THREE.Scene();
      const utils = udviz.Components.THREEUtils;
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

      /* Rendering the scene to a background image. */
      this.renderer.render(scene, camera);
      const _this = this;
      this.backgroundImage.onload = function () {
        _this.defaultCanvas = _this.createDefaultCanvas();
      };
      this.backgroundImage.src = this.renderer.domElement.toDataURL();
    }
  }

  drawPointOfInterest(
    contextCanvas,
    ratioXStart,
    ratioYStart,
    ratioXEnd,
    ratioYEnd,
    text,
    colorStyle = 'yellow'
  ) {
    contextCanvas.save();

    const width = (ratioXEnd - ratioXStart) * MINI_MAP_SIZE;
    const height = (ratioYEnd - ratioYStart) * MINI_MAP_SIZE;
    const lineWidth = 4;

    //draw box
    contextCanvas.beginPath();
    contextCanvas.strokeStyle = colorStyle;
    contextCanvas.lineWidth = lineWidth;
    contextCanvas.rect(
      ratioXStart * MINI_MAP_SIZE,
      ratioYStart * MINI_MAP_SIZE,
      width,
      height
    );
    contextCanvas.stroke();

    //draw text
    contextCanvas.font = '20px Arial';
    contextCanvas.fillStyle = colorStyle;
    contextCanvas.fillText(
      text,
      ratioXStart * MINI_MAP_SIZE + width + lineWidth,
      ratioYStart * MINI_MAP_SIZE + height * 0.5
    );

    contextCanvas.restore();
  }

  /**
   * It draws the background image, then draws a red circle around each portal
   * @returns A canvas element with a background image and a red circle drawn on it.
   */
  createDefaultCanvas() {
    const defaultCanvas = document.createElement('canvas');
    defaultCanvas.width = MINI_MAP_SIZE;
    defaultCanvas.height = MINI_MAP_SIZE;
    defaultCanvas.style.width = MINI_MAP_SIZE + 'px';
    defaultCanvas.style.height = MINI_MAP_SIZE + 'px';
    defaultCanvas.style.background = 'green';

    const pixelSize = this.conf.mini_map_size / MINI_MAP_SIZE;
    const ctx = defaultCanvas.getContext('2d');

    ctx.drawImage(this.backgroundImage, 0, 0);

    //Point interest HARD CODED
    //TODO : Compute ratio from positions in the world. Store a list of points of interest with their positions in the world.
    this.drawPointOfInterest(
      ctx,
      390 / 700,
      445 / 700,
      471 / 700,
      500 / 700,
      "Salle d'exposition"
    );

    this.drawPointOfInterest(
      ctx,
      266 / 700,
      69 / 700,
      294 / 700,
      93 / 700,
      "Zone d'observation"
    );

    this.drawPointOfInterest(
      ctx,
      212 / 700,
      203 / 700,
      227 / 700,
      217 / 700,
      'Zeppelin Tour'
    );

    this.drawPointOfInterest(
      ctx,
      381 / 700,
      212 / 700,
      456 / 700,
      264 / 700,
      'Salle conférence'
    );

    this.drawPointOfInterest(
      ctx,
      424 / 700,
      363 / 700,
      490 / 700,
      400 / 700,
      'Studios'
    );

    //draw instruction teleport
    ctx.save();
    ctx.font = '20px Arial';
    ctx.fillStyle = 'red';
    ctx.fillText('Cliquez sur les', 20, 20);
    ctx.fillText('pour vous teleporter dans la salle voulu.', 180, 20);
    ctx.restore();
    this.drawSpiral(ctx, {
      x: 163,
      y: 10,
    });

    return defaultCanvas;
  }

  drawSpiral(destCtx, pos, theta = 0, hover = false) {
    destCtx.beginPath();

    if (hover) {
      destCtx.strokeStyle = 'green';
    } else {
      destCtx.strokeStyle = 'red';
    }

    destCtx.lineWidth = 1;

    const a = 0.5;
    const b = 0.5;
    for (let i = 0; i < 150; i++) {
      const angle = 0.1 * i;
      const xSpiral = pos.x + (a + b * angle) * Math.cos(angle + theta);
      const ySpiral = pos.y + (a + b * angle) * Math.sin(angle + theta);
      destCtx.lineTo(xSpiral, ySpiral);
    }
    destCtx.stroke();
  }

  /**
   * It draws the mini-map, and then draws the avatar on top of it
   * @returns A function that takes in two arguments, go and localCtx.
   */
  tick() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const _this = this;

    if (!this.defaultCanvas || !this.displayMiniMap) return;
    //write
    const destCtx = this.ui.getContext('2d');
    destCtx.drawImage(this.defaultCanvas, 0, 0);

    this.currentDT += localCtx.getDt() * 0.002;

    //draw avatar
    const avatarGO = go
      .computeRoot()
      .find(localCtx.getGameView().getUserData('avatarUUID'));
    const pixelSize = this.conf.mini_map_size / MINI_MAP_SIZE;
    if (avatarGO) {
      const avatarPos = avatarGO.getPosition();

      const size =
        AVATAR_SIZE_MIN +
        (AVATAR_SIZE_MAX - AVATAR_SIZE_MIN) *
          Math.abs(Math.cos(this.currentDT));

      const c = {
        x: MINI_MAP_SIZE * 0.5 + avatarPos.x / pixelSize,
        y: MINI_MAP_SIZE * 0.5 - avatarPos.y / pixelSize,
      };
      /* Drawing the avatar on the mini map. Set its color thanks to the render color */
      const avatarColor = avatarGO.getComponent('Render').color;
      destCtx.fillStyle =
        'rgb(' +
        avatarColor.r * 255 +
        ',' +
        avatarColor.g * 255 +
        ',' +
        avatarColor.b * 255 +
        ')';

      const rotation = -avatarGO.getRotation().z - Math.PI;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      const xRot = function (x, y) {
        return x * cos - y * sin;
      };

      const yRot = function (x, y) {
        return y * cos + x * sin;
      };

      //draw triangle
      const ratioTriangle = 0.6;
      destCtx.beginPath();
      destCtx.moveTo(
        c.x + xRot(-size * 0.5, -size * ratioTriangle),
        c.y + yRot(-size * 0.5, -size * ratioTriangle)
      );
      destCtx.lineTo(
        c.x + xRot(size * 0.5, -size * ratioTriangle),
        c.y + yRot(size * 0.5, -size * ratioTriangle)
      );
      destCtx.lineTo(
        c.x + xRot(0, size * ratioTriangle),
        c.y + yRot(0, size * ratioTriangle)
      );
      destCtx.closePath();
      destCtx.fill();
    }

    //icons
    //PORTAL spirals

    this.portalIcons.forEach(function (icon) {
      const pos = icon.getPosition();

      const posPortal = {
        x: MINI_MAP_SIZE * 0.5 + pos.x / pixelSize,
        y: MINI_MAP_SIZE * 0.5 - pos.y / pixelSize,
      };
      _this.drawSpiral(destCtx, posPortal, _this.currentDT, icon.isHover());
    });
  }

  /**
   * It takes the data from the `mini_map_no_teleport` array and displays a red text saying "You can't
   * teleport here" at the mouse position
   */
  onOutdated() {
    const gameView = arguments[1].getGameView();
    const AnimatedText = gameView.getLocalScriptModules()['AnimatedText'];
    this.conf.mini_map_no_teleport.forEach(function (data) {
      if (data.avatarUUID == gameView.getUserData('avatarUUID')) {
        const a = new AnimatedText({
          text: "You can't teleport here",
          color: 'red',
        });
        a.spawn(data.mousePosition.x, data.mousePosition.y);
      }
    });
  }
};

class PortalIcon {
  constructor(position) {
    this.position = position;
    this.hover = false;
  }

  getPosition() {
    return this.position;
  }

  isHover() {
    return this.hover;
  }

  setHover(value) {
    this.hover = value;
  }
}
