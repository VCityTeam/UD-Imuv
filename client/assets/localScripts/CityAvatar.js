/**@format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class CityAvatar {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;

    this.go = null;

    this.labelInfo = document.createElement('div');
    this.labelInfo.classList.add('middle_screen_label');
    this.labelInfo.innerHTML = "Appuyez sur E pour revenir sur l'île";

    this.cityMap = null;
  }

  init() {
    this.go = arguments[0];
    const localCtx = arguments[1];

    const rootGO = localCtx.getRootGameObject();

    if (
      localCtx.getGameView().getUserData('avatarUUID') !=
      this.go.getParentUUID()
    ) {
      //ignore city avatar other
      return;
    }

    //avatar_controller
    const avatarController = rootGO.fetchLocalScripts()['avatar_controller'];
    if (!avatarController) throw new Error('no avatar controller script');

    //remove avatar controls
    avatarController.setAvatarControllerMode(false, localCtx);

    const _this = this;

    //routine camera
    const camera = localCtx.getGameView().getCamera();
    const cameraScript = rootGO.fetchLocalScripts()['camera'];

    //buffer
    const duration = 2000;
    let startPos = camera.position.clone();
    let startQuat = camera.quaternion.clone();
    let currentTime = 0;

    //first travelling
    cameraScript.addRoutine(
      new Game.Components.Routine(
        function (dt) {
          cameraScript.focusCamera.setTarget(_this.go);
          const t = cameraScript.focusCamera.computeTransformTarget(null, 3);

          currentTime += dt;
          const ratio = Math.min(Math.max(0, currentTime / duration), 1);

          const p = t.position.lerp(startPos, 1 - ratio);
          const q = t.quaternion.slerp(startQuat, 1 - ratio);

          camera.position.copy(p);
          camera.quaternion.copy(q);

          camera.updateProjectionMatrix();

          return ratio >= 1;
        },
        function () {
          _this.setCityAvatarController(true, localCtx);
        }
      )
    );
  }

  setCityAvatarController(value, localContext) {
    const avatarUUID = localContext.getGameView().getUserData('avatarUUID');
    if (this.go.getParent().getUUID() != avatarUUID) return; //only controls its own city avatar

    const goUUID = this.go.getUUID();
    const parentGoUUID = this.go.getParentUUID();

    const userID = localContext.getGameView().getUserData('userID');

    //Input manager of the game
    const inputManager = localContext.getGameView().getInputManager();

    const commandIdForward = 'cmd_forward';
    const commandIdBackward = 'cmd_backward';
    const commandIdLeft = 'cmd_left';
    const commandIdRight = 'cmd_right';
    const commandIdEscape = 'cmd_escape';

    if (value) {
      console.warn('add city avatar control');

      this.cityMap = new CityMap(localContext);
      localContext.getGameView().appendToUI(this.labelInfo);
      localContext.getGameView().appendToUI(this.cityMap.html());

      //FORWARD
      inputManager.addKeyCommand(
        commandIdForward,
        ['z', 'ArrowUp'],
        function () {
          inputManager.setPointerLock(true);
          return new Game.Command({
            gameObjectUUID: goUUID,
            userID: userID,
            type: Game.Command.TYPE.MOVE_FORWARD,
          });
        }
      );

      //BACKWARD
      inputManager.addKeyCommand(
        commandIdBackward,
        ['s', 'ArrowDown'],
        function () {
          inputManager.setPointerLock(true);
          return new Game.Command({
            gameObjectUUID: goUUID,
            userID: userID,
            type: Game.Command.TYPE.MOVE_BACKWARD,
          });
        }
      );

      //LEFT
      inputManager.addKeyCommand(
        commandIdLeft,
        ['q', 'ArrowLeft'],
        function () {
          inputManager.setPointerLock(true);
          return new Game.Command({
            gameObjectUUID: goUUID,
            userID: userID,
            type: Game.Command.TYPE.MOVE_LEFT,
          });
        }
      );

      //RIGHT
      inputManager.addKeyCommand(
        commandIdRight,
        ['d', 'ArrowRight'],
        function () {
          inputManager.setPointerLock(true);
          return new Game.Command({
            gameObjectUUID: goUUID,
            userID: userID,
            type: Game.Command.TYPE.MOVE_RIGHT,
          });
        }
      );

      //ROTATE

      //fetch ui script
      let scriptUI = null;
      localContext.getRootGameObject().traverse(function (child) {
        const scripts = child.fetchLocalScripts();
        if (scripts && scripts['ui']) {
          scriptUI = scripts['ui'];
          return true;
        }
      });

      inputManager.addMouseCommand('mousemove', function () {
        if (
          inputManager.getPointerLock() ||
          (this.isDragging() && !inputManager.getPointerLock())
        ) {
          const event = this.event('mousemove');
          if (event.movementX != 0 || event.movementY != 0) {
            let pixelX = -event.movementX;
            let pixelY = -event.movementY;

            const dragRatio = scriptUI
              .getMenuSettings()
              .getMouseSensitivityValue();

            pixelX *= dragRatio;
            pixelY *= dragRatio;

            return new Game.Command({
              type: Game.Command.TYPE.ROTATE,
              data: {
                vector: new Game.THREE.Vector3(pixelY, 0, pixelX),
              },
              userID: userID,
              gameObjectUUID: goUUID,
            });
          }
        }
        return null;
      });

      //Esc city avatar mode
      inputManager.addKeyCommand(commandIdEscape, ['e'], function () {
        return new Game.Command({
          gameObjectUUID: parentGoUUID,
          userID: userID,
          type: Game.Command.TYPE.ESCAPE,
        });
      });
    } else {
      console.warn('remove city avatar command');

      this.labelInfo.remove();
      this.cityMap.dispose();
      this.cityMap = null;

      inputManager.removeKeyCommand(commandIdForward, ['z', 'ArrowUp']);
      inputManager.removeKeyCommand(commandIdBackward, ['s', 'ArrowDown']);
      inputManager.removeKeyCommand(commandIdRight, ['d', 'ArrowRight']);
      inputManager.removeKeyCommand(commandIdLeft, ['q', 'ArrowLeft']);
      inputManager.removeMouseCommand('mousemove');
      inputManager.removeKeyCommand(commandIdEscape, ['e']);
      inputManager.setPointerLock(false);
    }
  }

  onRemove() {
    const localCtx = arguments[1];
    const rootGO = localCtx.getRootGameObject();

    if (
      localCtx.getGameView().getUserData('avatarUUID') !=
      this.go.getParentUUID()
    ) {
      //ignore city avatar other
      return;
    }

    this.setCityAvatarController(false, localCtx);

    //routine camera
    const camera = localCtx.getGameView().getCamera();
    const cameraScript = rootGO.fetchLocalScripts()['camera'];

    //buffer
    const duration = 2000;
    let startPos = camera.position.clone();
    let startQuat = camera.quaternion.clone();
    let currentTime = 0;

    //first travelling
    cameraScript.addRoutine(
      new Game.Components.Routine(
        function (dt) {
          cameraScript.focusCamera.setTarget(cameraScript.getAvatarGO());
          const t = cameraScript.focusCamera.computeTransformTarget(null, 3);

          currentTime += dt;
          const ratio = Math.min(Math.max(0, currentTime / duration), 1);

          const p = t.position.lerp(startPos, 1 - ratio);
          const q = t.quaternion.slerp(startQuat, 1 - ratio);

          camera.position.copy(p);
          camera.quaternion.copy(q);

          camera.updateProjectionMatrix();

          return ratio >= 1;
        },
        function () {
          //avatar_controller
          const avatarController =
            rootGO.fetchLocalScripts()['avatar_controller'];
          if (!avatarController) throw new Error('no avatar controller script');
          //restore avatar controls
          avatarController.setAvatarControllerMode(true, localCtx);
        }
      )
    );
  }

  tick() {
    //the gameobject parent of this script
    const go = arguments[0];

    //a context containing all data to script clientside script
    const localContext = arguments[1];

    const wT = go.computeWorldTransform();
    const pos = wT.position;
    const rotation = wT.rotation;
    const ref = localContext.getGameView().getObject3D().position;
    const zParent = go.parent.getPosition().z + ref.z;

    const worldPos = new udviz.THREE.Vector3(pos.x, pos.y, 0).add(ref);

    const editorMode = localContext.getGameView().getUserData('editorMode');

    const gameView = localContext.getGameView();

    const elevation =
      udviz.itowns.DEMUtils.getElevationValueAt(
        gameView.getItownsView().tileLayer,
        new udviz.itowns.Coordinates(gameView.projection, worldPos),
        1 //PRECISE_READ_Z
      ) - zParent;

    if (this.cityMap) {
      const [lng, lat] = udviz.Game.proj4
        .default(gameView.projection)
        .inverse([worldPos.x, worldPos.y]);

      const avatarColor = go.getComponent('Render').color;

      this.cityMap.draw(
        lng,
        lat,
        localContext,
        rotation,
        'rgb(' +
          avatarColor.r * 255 +
          ',' +
          avatarColor.g * 255 +
          ',' +
          avatarColor.b * 255 +
          ')'
      );
    }

    if (editorMode) {
      //add commands to the computer directly because not produce by the inputmanager
      const computer = localContext
        .getGameView()
        .getInterpolator()
        .getLocalComputer();

      computer.onCommands([
        new Game.Command({
          type: Game.Command.TYPE.Z_UPDATE,
          gameObjectUUID: go.getUUID(),
          data: elevation,
        }),
      ]);
    } else {
      const userID = localContext.getGameView().getUserData('userID');
      const websocketService = localContext.getWebSocketService();
      const ImuvConstants = localContext.getGameView().getLocalScriptModules()[
        'ImuvConstants'
      ];

      websocketService.emit(ImuvConstants.WEBSOCKET.MSG_TYPES.COMMANDS, [
        {
          type: Game.Command.TYPE.Z_UPDATE,
          gameObjectUUID: go.getUUID(),
          userID: userID,
          data: elevation + 200,
        },
      ]);
    }
  }
};

const CITY_MAP_SIZE = 500;
const AVATAR_SIZE_MIN = 15;
const AVATAR_SIZE_MAX = 25;
const CLICK_MODE = {
  DEFAULT: 0,
  TELEPORT: 1,
  PING: 2,
};

class CityMap {
  constructor(localContext) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root-menu-settings');

    const title = document.createElement('h1');
    title.innerHTML = 'City Map';
    this.rootHtml.appendChild(title);

    this.canvas = document.createElement('canvas');
    this.canvas.width = CITY_MAP_SIZE;
    this.canvas.height = CITY_MAP_SIZE;
    this.rootHtml.appendChild(this.canvas);

    this.imageCityMap = document.createElement('img');
    const ImuvConstants = localContext.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];
    this.imageCityMap.src = ImuvConstants.CITY_MAP.PATH;

    this.currentDt = 0;

    this.currentZoom = 1;

    const _this = this;
    this.canvas.onwheel = function (event) {
      const newZoom = _this.currentZoom - event.wheelDelta * 0.0002;
      _this.setCurrentZoom(newZoom);
    };

    //BUTTON
    const pingButton = document.createElement('button');
    pingButton.innerHTML = 'Ping';
    this.rootHtml.appendChild(pingButton);

    const teleportButton = document.createElement('button');
    teleportButton.innerHTML = 'Teleportation';
    this.rootHtml.appendChild(teleportButton);

    this.clickMode = this.setClickMode(CLICK_MODE.DEFAULT);

    teleportButton.onclick = function () {
      _this.setClickMode(CLICK_MODE.TELEPORT);
    };

    pingButton.onclick = function () {
      _this.setClickMode(CLICK_MODE.PING);
    };

    this.canvas.onclick = function (event) {
      console.log(event);
    };
  }

  setCursorPointer(value) {
    if (value) {
      this.canvas.style.cursor = 'pointer';
    } else {
      this.canvas.style.cursor = 'auto';
    }
  }

  setClickMode(mode) {
    this.clickMode = mode;

    if (mode == CLICK_MODE.DEFAULT) {
      this.setCursorPointer(false);
    } else if (mode == CLICK_MODE.PING) {
      this.setCursorPointer(true);
    } else if (mode == CLICK_MODE.TELEPORT) {
      this.setCursorPointer(true);
    }
  }

  //zoom is clamp between 0->1
  setCurrentZoom(value) {
    this.currentZoom = Math.min(1, Math.max(0.02, value));
  }

  draw(lng, lat, localContext, rotation, color) {
    const ctx = this.canvas.getContext('2d');

    //draw citymap
    const ImuvConstants = localContext.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];

    const sizeSrc =
      Math.min(this.imageCityMap.width, this.imageCityMap.height) *
      this.currentZoom;

    const pixelSrcX =
      (this.imageCityMap.width * (lng - ImuvConstants.CITY_MAP.LEFT)) /
      (ImuvConstants.CITY_MAP.RIGHT - ImuvConstants.CITY_MAP.LEFT);

    const pixelSrcY =
      this.imageCityMap.height *
      (1 -
        (lat - ImuvConstants.CITY_MAP.BOTTOM) /
          (ImuvConstants.CITY_MAP.TOP - ImuvConstants.CITY_MAP.BOTTOM));

    const clampX = Math.min(
      Math.max(0, pixelSrcX - sizeSrc * 0.5),
      this.imageCityMap.width - sizeSrc
    );

    const clampY = Math.min(
      Math.max(0, pixelSrcY - sizeSrc * 0.5),
      this.imageCityMap.height - sizeSrc
    );

    ctx.drawImage(
      this.imageCityMap,
      clampX,
      clampY,
      sizeSrc,
      sizeSrc,
      0,
      0,
      CITY_MAP_SIZE,
      CITY_MAP_SIZE
    );

    //draw avatar
    this.currentDt += localContext.getDt() * 0.002;
    const userAvatarSize =
      AVATAR_SIZE_MIN +
      (AVATAR_SIZE_MAX - AVATAR_SIZE_MIN) * Math.abs(Math.cos(this.currentDt));

    const rotationValue = -rotation.z - Math.PI;
    const cos = Math.cos(rotationValue);
    const sin = Math.sin(rotationValue);

    const xRot = function (x, y) {
      return x * cos - y * sin;
    };

    const yRot = function (x, y) {
      return y * cos + x * sin;
    };

    //draw triangle

    const avatarPosX =
      CITY_MAP_SIZE * 0.5 +
      (pixelSrcX - clampX - sizeSrc * 0.5) * (CITY_MAP_SIZE / sizeSrc);
    const avatarPosY =
      CITY_MAP_SIZE * 0.5 +
      (pixelSrcY - clampY - sizeSrc * 0.5) * (CITY_MAP_SIZE / sizeSrc);

    const ratioTriangle = 0.6;
    ctx.beginPath();
    ctx.moveTo(
      avatarPosX + xRot(-userAvatarSize * 0.5, -userAvatarSize * ratioTriangle),
      avatarPosY + yRot(-userAvatarSize * 0.5, -userAvatarSize * ratioTriangle)
    );
    ctx.lineTo(
      avatarPosX + xRot(userAvatarSize * 0.5, -userAvatarSize * ratioTriangle),
      avatarPosY + yRot(userAvatarSize * 0.5, -userAvatarSize * ratioTriangle)
    );
    ctx.lineTo(
      avatarPosX + xRot(0, userAvatarSize * ratioTriangle),
      avatarPosY + yRot(0, userAvatarSize * ratioTriangle)
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    this.rootHtml.remove();
  }
}
