import { Game, Shared, THREE, THREEUtil } from '@ud-viz/browser';
import { Constant } from '@ud-imuv/shared';
import { AnimatedText } from './Component/AnimatedText/AnimatedText';

const MINI_MAP_SIZE = 500;
const AVATAR_SIZE_MIN = 15;
const AVATAR_SIZE_MAX = 25;

export class MiniMap extends Game.External.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    if (!this.variables.mini_map_size)
      console.error('no mini map size in conf');

    this.backgroundImage = document.createElement('img');

    this.renderer = new THREE.WebGLRenderer({
      canvas: document.createElement('canvas'),
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(MINI_MAP_SIZE, MINI_MAP_SIZE);
    this.renderer.setClearColor(0xffffff, 0);

    //what is display
    this.domElement = document.createElement('div');
    this.domElement.style.position = 'relative';

    this.canvasMiniMap = document.createElement('canvas');
    this.canvasMiniMap.width = MINI_MAP_SIZE;
    this.canvasMiniMap.height = MINI_MAP_SIZE;
    this.canvasMiniMap.style.width = MINI_MAP_SIZE + 'px';
    this.canvasMiniMap.style.height = MINI_MAP_SIZE + 'px';
    this.domElement.appendChild(this.canvasMiniMap);

    this.currentDT = 0;

    this.portalIcons = [];
    this.defaultCanvas = null;

    //map is displayed or not
    this.displayMap = false;

    //mode
    this.clickMode = null;

    //ping
    this.pings = [];

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
  html() {
    return this.domElement;
  }

  /**
   * Map interface
   * @param {*} mode
   */
  setClickMode(mode) {
    this.clickMode = mode;

    if (mode == Constant.MAP_CLICK_MODE.DEFAULT) {
      this.setCursorPointer(false);
    } else if (mode == Constant.MAP_CLICK_MODE.PING) {
      this.setCursorPointer(true);
    } else if (mode == Constant.MAP_CLICK_MODE.TELEPORT) {
      this.setCursorPointer(true);
    }
  }

  /**
   * It adds a key input listener to the game view's input manager, which toggles the display of the
   * mini map
   */
  init() {
    this.setClickMode(Constant.MAP_CLICK_MODE.DEFAULT);

    this.createDivInfos();

    this.createPortalIcons();

    this.updateBackgroundImage();

    this.canvasMiniMap.onclick = (event) => {
      const x = event.pageX;
      const y = event.pageY;

      const rect = event.target.getBoundingClientRect();
      const ratioX = (x - rect.left) / (rect.right - rect.left);
      const ratioY = 1 - (y - rect.top) / (rect.bottom - rect.top);

      //check mode
      if (this.clickMode === Constant.MAP_CLICK_MODE.TELEPORT) {
        const teleportPosition = new THREE.Vector3(
          (ratioX - 0.5) * this.variables.mini_map_size,
          (ratioY - 0.5) * this.variables.mini_map_size,
          0
        );
        this.setClickMode(Constant.MAP_CLICK_MODE.DEFAULT);
        this.context.sendCommandToGameContext([
          new Shared.Command({
            type: Constant.COMMAND.TELEPORT,
            data: {
              object3DUUID: this.object3D.uuid,
              mousePosition: { x: x, y: y },
              position: teleportPosition,
              avatarUUID: this.context.userData.avatarUUID,
            },
          }),
        ]);
      } else if (this.clickMode === Constant.MAP_CLICK_MODE.PING) {
        this.setClickMode(Constant.MAP_CLICK_MODE.DEFAULT);
        this.context.sendCommandToGameContext([
          new Shared.Command({
            type: Constant.COMMAND.PING,
            data: {
              object3DUUID: this.object3D.uuid,
              mousePosition: {
                x: ratioX * MINI_MAP_SIZE,
                y: MINI_MAP_SIZE - ratioY * MINI_MAP_SIZE,
              },
              color: this.fetchAvatarColor(
                this.context.object3D.getObjectByProperty(
                  'uuid',
                  this.context.userData.avatarUUID
                )
              ),
            },
          }),
        ]);
      }
    };
  }

  createPortalIcons() {
    /* Finding the position of the portals and adding them to the array. */

    const pixelSize = this.variables.mini_map_size / MINI_MAP_SIZE;

    this.context.object3D.traverse((child) => {
      if (!child.userData.isPortal) return;

      //check if intersecting a dropdown menu (portalIcons)

      //position
      const portalPosition = new THREE.Vector2(
        100 * (0.5 + child.position.x / (pixelSize * MINI_MAP_SIZE)),
        100 * (0.5 - child.position.y / (pixelSize * MINI_MAP_SIZE))
      );

      //callback
      const callbackPortal = (event) => {
        const x = event.pageX;
        const y = event.pageY;

        this.context.sendCommandToGameContext([
          new Shared.Command({
            type: Constant.COMMAND.TELEPORT,
            data: {
              object3DUUID: this.object3D.uuid,
              mousePosition: { x: x, y: y }, // should be useless since portal have to be in map
              position: child.position,
              avatarUUID: this.context.userData.avatarUUID,
            },
          }),
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
          portalIcon.addItem(child.name, callbackPortal);

          break;
        }
      }

      if (!intersectPortalIcons) {
        //create a portal icon
        const portalIcon = new DropDownMenu();
        portalIcon.setPosition(portalPosition);
        portalIcon.addItem(child.name, callbackPortal);
        this.portalIcons.push(portalIcon);
        this.domElement.appendChild(portalIcon.html());
      }
    });
    this.orderPortalIconsZIndex();
  }

  orderPortalIconsZIndex() {
    const portalIconsByTopOffset = this.portalIcons.sort((a, b) => {
      if (parseFloat(a.html().style.top) > parseFloat(b.html().style.top)) {
        return -1;
      }
      if (parseFloat(a.html().style.top) < parseFloat(b.html().style.top)) {
        return 1;
      }
      return 0;
    });
    for (let index = 0; index < portalIconsByTopOffset.length; index++) {
      const portalIcon = portalIconsByTopOffset[index];
      portalIcon.html().style.zIndex = 6 + index; // 6 is the default z-index of the dropdown of map
    }
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

    this.domElement.appendChild(div);
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
      this.infoDivs.forEach((el) => {
        el.classList.add('no_event');
      });
      this.portalIcons.forEach((p) => {
        p.html().classList.add('no_event');
      });
    } else {
      this.infoDivs.forEach((el) => {
        el.classList.remove('no_event');
      });
      this.portalIcons.forEach((p) => {
        p.html().classList.remove('no_event');
      });
      this.canvasMiniMap.style.cursor = 'auto';
    }
  }

  updateBackgroundImage() {
    const scene = new THREE.Scene();

    THREEUtil.addLights(scene);

    this.context.object3D.traverse((g) => {
      if (g.isGameObject3D && g.isStatic()) {
        const r = g.getComponent(Shared.Game.Component.Render.TYPE);
        if (r) {
          const clone = r.getController().getObject3D().clone();

          r.getController().object3D.matrixWorld.decompose(
            clone.position,
            clone.quaternion,
            clone.scale
          );

          clone.position.sub(this.context.object3D.position);

          clone.updateMatrixWorld();
          scene.add(clone);
        }
      }
    });

    scene.updateMatrixWorld();

    const halfSize = this.variables.mini_map_size * 0.5;
    const camera = new THREE.OrthographicCamera(
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
    this.backgroundImage.onload = () => {
      this.defaultCanvas = this.createDefaultCanvas();
    };
    this.backgroundImage.src = this.renderer.domElement.toDataURL();
  }

  onNewGameObject(newGO) {
    if (newGO.isStatic()) {
      this.updateBackgroundImage(); // new static object to draw on map
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
    const avatarColor = avatarGO
      .getComponent(Shared.Game.Component.Render.TYPE)
      .getModel()
      .getColor();
    return (
      'rgb(' +
      avatarColor[0] * 255 +
      ',' +
      avatarColor[1] * 255 +
      ',' +
      avatarColor[2] * 255 +
      ')'
    );
  }

  /**
   * It draws the mini-map, and then draws the avatar on top of it
   * @returns A function that takes in two arguments, go and localCtx.
   */
  tick() {
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

    this.currentDT += this.context.dt * 0.002;

    const userAvatarSize =
      AVATAR_SIZE_MIN +
      (AVATAR_SIZE_MAX - AVATAR_SIZE_MIN) * Math.abs(Math.cos(this.currentDT));

    //draw avatars
    const pixelSize = this.variables.mini_map_size / MINI_MAP_SIZE;
    const drawAvatar = (avatarGO, size) => {
      const c = {
        x: MINI_MAP_SIZE * 0.5 + avatarGO.position.x / pixelSize,
        y: MINI_MAP_SIZE * 0.5 - avatarGO.position.y / pixelSize,
      };
      /* Drawing the avatar on the mini map. Set its color thanks to the render color */
      destCtx.fillStyle = this.fetchAvatarColor(avatarGO);

      const rotation = -avatarGO.rotation.z - Math.PI;
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

    this.context.object3D.traverse((child) => {
      //retrieve avatar base on their name maybe it should be another way
      if (child.userData.isAvatar) {
        if (child.uuid === this.context.userData.avatarUUID) {
          drawAvatar(child, userAvatarSize);
        } else {
          drawAvatar(child, AVATAR_SIZE_MIN);
        }
      }
    });

    //draw pings
    for (let i = this.pings.length - 1; i >= 0; i--) {
      const ping = this.pings[i];
      if (ping.draw(destCtx, this.context.dt)) {
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
    this.variables.mini_map_no_teleport.forEach((data) => {
      if (data.avatarUUID == this.context.userData.avatarUUID) {
        const a = new AnimatedText({
          text: "You can't teleport here",
          color: 'red',
        });
        a.spawn(data.mousePosition.x, data.mousePosition.y);
      }
    });

    this.variables.mini_map_ping.forEach((data) => {
      const ping = new Ping({
        position: data.mousePosition,
        color: data.color,
      });
      this.pings.push(ping);
    });
  }

  static get ID_SCRIPT() {
    return 'mini_map_id_ext_script';
  }
}

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
    this.domElement = document.createElement('div');
    this.domElement.classList.add('dropdown');

    const icon = document.createElement('img');
    icon.src = './assets/img/ui/arobase.png';
    icon.classList.add('map_icon');
    this.domElement.appendChild(icon);

    this.content = document.createElement('div');
    this.content.classList.add('dropdown-content');
    this.domElement.appendChild(this.content);
  }

  addItem(label, callback) {
    const item = document.createElement('div');
    item.innerHTML = label;
    item.onclick = callback;
    this.content.appendChild(item);
  }

  fetchPosition() {
    return new THREE.Vector2(
      parseFloat(this.domElement.style.left),
      parseFloat(this.domElement.style.top)
    );
  }

  setPosition(position) {
    this.domElement.style.left = position.x + '%';
    this.domElement.style.top = position.y + '%';
  }

  html() {
    return this.domElement;
  }
}
