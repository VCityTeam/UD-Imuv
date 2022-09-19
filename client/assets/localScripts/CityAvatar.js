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

    this.cityMapGO = null;
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

    //add citymap
    let cityMapGO = null;
    rootGO.traverse(function (child) {
      const scripts = child.fetchLocalScripts();
      if (scripts && scripts['city_map']) {
        cityMapGO = child;
        return true;
      }
      return false;
    });

    if (!cityMapGO) console.error('no city map object');

    this.cityMapGO = cityMapGO;
    this.cityMapGO.fetchLocalScripts()['city_map'].add(this.go, localCtx);

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
    const commandIdRotate = 'cmd_rotate';

    if (value) {
      console.warn('add city avatar control');

      localContext.getGameView().appendToUI(this.labelInfo);

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

      inputManager.addMouseCommand(commandIdRotate, 'mousemove', function () {
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

      inputManager.removeKeyCommand(commandIdForward, ['z', 'ArrowUp']);
      inputManager.removeKeyCommand(commandIdBackward, ['s', 'ArrowDown']);
      inputManager.removeKeyCommand(commandIdRight, ['d', 'ArrowRight']);
      inputManager.removeKeyCommand(commandIdLeft, ['q', 'ArrowLeft']);
      inputManager.removeMouseCommand(commandIdRotate, 'mousemove');
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

    //remove citymap
    this.cityMapGO.fetchLocalScripts()['city_map'].remove(localCtx);

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
          data: elevation + 200, //TODO remove
        },
      ]);
    }
  }
};
