const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;

const MINI_MAP_SIZE = 500;
const AVATAR_SIZE_MIN = 15;
const AVATAR_SIZE_MAX = 25;

module.exports = class MiniMap {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    if (!this.conf.mini_map_size) console.error('no mini map size in conf');

    udviz = udvizBundle;

    this.backgroundImage = document.createElement('img');

    this.renderer = new udviz.THREE.WebGLRenderer({
      canvas: document.createElement('canvas'),
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(MINI_MAP_SIZE, MINI_MAP_SIZE);
    this.renderer.setClearColor(0xffffff, 0);

    //what is display
    this.rootHtml = document.createElement('div');

    this.canvasMiniMap = document.createElement('canvas');
    this.canvasMiniMap.width = MINI_MAP_SIZE;
    this.canvasMiniMap.height = MINI_MAP_SIZE;
    this.canvasMiniMap.style.width = MINI_MAP_SIZE + 'px';
    this.canvasMiniMap.style.height = MINI_MAP_SIZE + 'px';
    this.rootHtml.appendChild(this.canvasMiniMap);

    this.currentDT = 0;

    this.portalIcons = [];
    this.defaultCanvas = null;

    //map is displayed or not
    this.displayMap = false;

    //mode
    this.clickMode = null;

    //ping
    this.pings = [];

    this.mapClickMode = null;

    //info div
    this.infoDivs = [];
  }

  /**
   * Map interface
   * @param {*} value
   */
  setDisplayMap(value) {
    this.displayMap = value;
  }

  /**
   * Map interface
   * @returns
   */
  getRootHtml() {
    return this.rootHtml;
  }

  /**
   * Map interface
   * @param {*} mode
   */
  setClickMode(mode) {
    this.clickMode = mode;

    if (mode == this.mapClickMode.DEFAULT) {
      this.setCursorPointer(false);
    } else if (mode == this.mapClickMode.PING) {
      this.setCursorPointer(true);
    } else if (mode == this.mapClickMode.TELEPORT) {
      this.setCursorPointer(true);
    }
  }

  /**
   * It adds a key input listener to the game view's input manager, which toggles the display of the
   * mini map
   */
  init() {
    const go = arguments[0];
    const localCtx = arguments[1];

    const gameView = localCtx.getGameView();

    //init constants
    this.mapClickMode =
      gameView.getLocalScriptModules()['ImuvConstants'].MAP_CLICK_MODE;
    this.setClickMode(this.mapClickMode.DEFAULT);

    this.createDivInfos();

    this.createPortalIcons(localCtx, go);

    const _this = this;
    const userID = gameView.getUserData('userID');
    const conf = this.conf;
    const Command = udviz.Game.Command;
    const ImuvConstants = gameView.getLocalScriptModules()['ImuvConstants'];

    this.canvasMiniMap.onclick = function (event) {
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

      //check mode
      if (_this.clickMode === _this.mapClickMode.TELEPORT) {
        _this.setClickMode(_this.mapClickMode.DEFAULT);

        const command = new Command({
          type: Command.TYPE.TELEPORT,
          data: {
            mousePosition: { x: x, y: y },
            position: teleportPosition,
            avatarUUID: gameView.getUserData('avatarUUID'),
          },
          userID: userID,
          gameObjectUUID: go.getUUID(),
        });

        localCtx
          .getWebSocketService()
          .emit(ImuvConstants.WEBSOCKET.MSG_TYPES.COMMANDS, [command.toJSON()]);
      } else if (_this.clickMode === _this.mapClickMode.PING) {
        _this.setClickMode(_this.mapClickMode.DEFAULT);

        const avatarGO = localCtx
          .getRootGameObject()
          .find(gameView.getUserData('avatarUUID'));

        const command = new Command({
          type: Command.TYPE.PING_MINI_MAP,
          data: {
            mousePosition: {
              x: ratioX * MINI_MAP_SIZE,
              y: MINI_MAP_SIZE - ratioY * MINI_MAP_SIZE,
            },
            color: _this.fetchAvatarColor(avatarGO),
          },
          userID: userID,
          gameObjectUUID: go.getUUID(),
        });

        localCtx
          .getWebSocketService()
          .emit(ImuvConstants.WEBSOCKET.MSG_TYPES.COMMANDS, [command.toJSON()]);
      }
    };
  }

  createPortalIcons(localCtx, go) {
    /* Finding the position of the portals and adding them to the array. */

    const pixelSize = this.conf.mini_map_size / MINI_MAP_SIZE;
    const ImuvConstants = localCtx.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];

    go.computeRoot().traverse((child) => {
      const lS = child.fetchLocalScripts();
      if (lS && lS['portal_sweep']) {
        //check if intersecting a dropdown menu (portalIcons)

        //position
        const portalPosition = new udviz.THREE.Vector2(
          100 * (0.5 + child.getPosition().x / (pixelSize * MINI_MAP_SIZE)),
          100 * (0.5 - child.getPosition().y / (pixelSize * MINI_MAP_SIZE))
        );

        //callback
        const callbackPortal = (event) => {
          const x = event.pageX;
          const y = event.pageY;

          const command = new udviz.Game.Command({
            type: udviz.Game.Command.TYPE.TELEPORT,
            data: {
              mousePosition: { x: x, y: y },
              position: child.getPosition(),
              avatarUUID: localCtx.getGameView().getUserData('avatarUUID'),
            },
            userID: localCtx.getGameView().getUserData('userID'),
            gameObjectUUID: go.getUUID(),
          });

          localCtx
            .getWebSocketService()
            .emit(ImuvConstants.WEBSOCKET.MSG_TYPES.COMMANDS, [
              command.toJSON(),
            ]);
        };

        let intersectPortalIcons = false;
        const intersectionDist = (100 * 20) / MINI_MAP_SIZE; //TODO pick in css of map_UI could be compute procedurally

        for (let index = 0; index < this.portalIcons.length; index++) {
          const portalIcon = this.portalIcons[index];
          const menuPosition = portalIcon.fetchPosition();

          if (menuPosition.distanceTo(portalPosition) < intersectionDist) {
            intersectPortalIcons = true;

            //modify menu position TODO this is not the good way because only work well for two item in the list
            const newPosition = menuPosition.lerp(portalPosition, 0.5);
            portalIcon.setPosition(newPosition);

            //add item in the list
            portalIcon.addItem(child.getName(), callbackPortal);

            break;
          }
        }

        if (!intersectPortalIcons) {
          //create a portal icon
          const portalIcon = new DropDownMenu();
          portalIcon.setPosition(portalPosition);
          portalIcon.addItem(child.getName(), callbackPortal);

          this.portalIcons.push(portalIcon);
          this.rootHtml.appendChild(portalIcon.html());
        }
      }
    });
  }

  createDivInfo(ratioXStart, ratioYStart, ratioXEnd, ratioYEnd, text) {
    //create a html div
    const div = document.createElement('div');
    div.classList.add('map_info');

    div.style.left = ratioXStart * 100 + '%';
    div.style.top = ratioYStart * 100 + '%';

    const width = ratioXEnd - ratioXStart;
    const height = ratioYEnd - ratioYStart;

    div.style.width = width * 100 + '%';
    div.style.height = height * 100 + '%';

    div.title = text;

    this.infoDivs.push(div);

    this.rootHtml.appendChild(div);
  }

  createDivInfos() {
    //Point interest HARD CODED
    //TODO : Compute ratio from positions in the world. Store a list of points of interest with their positions in the world.
    this.createDivInfo(
      390 / 700,
      445 / 700,
      471 / 700,
      500 / 700,
      "Salle d'exposition"
    );

    this.createDivInfo(
      266 / 700,
      69 / 700,
      294 / 700,
      93 / 700,
      "Zone d'observation"
    );

    this.createDivInfo(212 / 700, 203 / 700, 227 / 700, 217 / 700, 'ZeppeLyon');

    this.createDivInfo(
      381 / 700,
      212 / 700,
      456 / 700,
      264 / 700,
      'Salle conférence'
    );

    this.createDivInfo(424 / 700, 363 / 700, 490 / 700, 400 / 700, 'Studios');
  }

  setCursorPointer(value) {
    if (value) {
      this.canvasMiniMap.style.cursor = 'pointer';
      this.infoDivs.concat(this.portalIcons).forEach((el) => {
        el.classList.add('no_event');
      });
    } else {
      this.infoDivs.concat(this.portalIcons).forEach((el) => {
        el.classList.remove('no_event');
      });
      this.canvasMiniMap.style.cursor = 'auto';
    }
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

    const ctx = defaultCanvas.getContext('2d');

    ctx.drawImage(this.backgroundImage, 0, 0);

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

  fetchAvatarColor(avatarGO) {
    const avatarColor = avatarGO.getComponent('Render').color;
    return (
      'rgb(' +
      avatarColor.r * 255 +
      ',' +
      avatarColor.g * 255 +
      ',' +
      avatarColor.b * 255 +
      ')'
    );
  }

  /**
   * It draws the mini-map, and then draws the avatar on top of it
   * @returns A function that takes in two arguments, go and localCtx.
   */
  tick() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const _this = this;

    if (!this.defaultCanvas || !this.displayMap) return;
    //write
    const destCtx = this.canvasMiniMap.getContext('2d');
    destCtx.clearRect(
      0,
      0,
      this.canvasMiniMap.width,
      this.canvasMiniMap.height
    );
    destCtx.drawImage(this.defaultCanvas, 0, 0);

    this.currentDT += localCtx.getDt() * 0.002;

    const userAvatarSize =
      AVATAR_SIZE_MIN +
      (AVATAR_SIZE_MAX - AVATAR_SIZE_MIN) * Math.abs(Math.cos(this.currentDT));

    //draw avatars
    const pixelSize = this.conf.mini_map_size / MINI_MAP_SIZE;
    const drawAvatar = function (avatarGO, size) {
      const avatarPos = avatarGO.getPosition();

      const c = {
        x: MINI_MAP_SIZE * 0.5 + avatarPos.x / pixelSize,
        y: MINI_MAP_SIZE * 0.5 - avatarPos.y / pixelSize,
      };
      /* Drawing the avatar on the mini map. Set its color thanks to the render color */
      destCtx.fillStyle = _this.fetchAvatarColor(avatarGO);

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
    };

    go.computeRoot().traverse(function (child) {
      //retrieve avatar base on their name maybe it should be another way
      if (child.getName() === 'avatar') {
        if (
          child.getUUID() === localCtx.getGameView().getUserData('avatarUUID')
        ) {
          drawAvatar(child, userAvatarSize);
        } else {
          drawAvatar(child, AVATAR_SIZE_MIN);
        }
      }
    });

    //draw pings
    for (let i = this.pings.length - 1; i >= 0; i--) {
      const ping = this.pings[i];
      if (ping.draw(destCtx, localCtx.getDt())) {
        //end remove it
        this.pings.splice(i, 1);
      }
    }

    //feedbacks clickable
    if (this.canvasMiniMap.style.cursor == 'pointer') {
      const brightnessValue =
        120 + (150 - 120) * Math.abs(Math.cos(this.currentDT));
      destCtx.filter = 'brightness(' + brightnessValue + '%)';
    } else {
      destCtx.filter = 'brightness(100%)';
    }
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

    const _this = this;
    this.conf.mini_map_ping.forEach(function (data) {
      const ping = new Ping({
        position: data.mousePosition,
        color: data.color,
      });
      _this.pings.push(ping);
    });
  }
};

class Ping {
  constructor(params) {
    this.duration = params.duration || 2000;
    this.maxSize = params.maxSize || 20;
    this.currentTime = 0;

    this.position = params.position;
    this.color = params.color;
  }

  draw(context2D, dt) {
    this.currentTime += dt;

    //draw context2D
    const radius = (this.maxSize * this.currentTime) / this.duration;
    context2D.beginPath();
    context2D.lineWidth = 3;
    context2D.strokeStyle = this.color;
    context2D.arc(this.position.x, this.position.y, radius, 0, 2 * Math.PI);
    context2D.stroke();

    if (this.currentTime >= this.duration) {
      return true;
    } else {
      return false;
    }
  }
}


class DropDownMenu {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('dropdown');

    const icon = document.createElement('img');
    icon.src = './assets/img/ui/arobase.png';
    icon.classList.add('map_icon');
    this.rootHtml.appendChild(icon);

    this.content = document.createElement('div');
    this.content.classList.add('dropdown-content');
    this.rootHtml.appendChild(this.content);
  }

  addItem(label, callback) {
    const item = document.createElement('div');
    item.innerHTML = label;
    item.onclick = callback;
    this.content.appendChild(item);
  }

  fetchPosition() {
    return new udviz.THREE.Vector2(
      parseFloat(this.rootHtml.style.left),
      parseFloat(this.rootHtml.style.top)
    );
  }

  setPosition(position) {
    this.rootHtml.style.left = position.x + '%';
    this.rootHtml.style.top = position.y + '%';
  }

  html() {
    return this.rootHtml;
  }
}
