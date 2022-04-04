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

    this.raycaster = new udviz.THREE.Raycaster();

    this.go = null;
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
      inputManager.addMouseCommand('mousemove', function () {
        if (
          inputManager.getPointerLock() ||
          (this.isDragging() && !inputManager.getPointerLock())
        ) {
          const event = this.event('mousemove');
          if (event.movementX != 0 || event.movementY != 0) {
            let pixelX = -event.movementX;
            let pixelY = -event.movementY;

            if (this.isDragging()) {
              const dragRatio = 2; //TODO conf ?
              pixelX *= dragRatio;
              pixelY *= dragRatio;
            }

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

    const manager = localContext.getGameView().getLayerManager();
    const ground = [];

    const addObjectToGround = function (nameLayer) {
      if (!manager) return;
      let layerManager = null;
      for (let index = 0; index < manager.tilesManagers.length; index++) {
        const element = manager.tilesManagers[index];
        if (element.layer.id == nameLayer) {
          layerManager = element;
          break;
        }
      }

      if (!layerManager) throw new Error('no ', nameLayer);

      layerManager.tiles.forEach(function (t) {
        const obj = t.getObject3D();
        if (obj) ground.push(obj);
      });
    };

    addObjectToGround('3d-tiles-layer-relief');
    addObjectToGround('3d-tiles-layer-road');

    const zParent = go.parent.getPosition().z;

    const pos = go.computeWorldTransform().position;
    const ref = localContext.getGameView().getObject3D().position;
    const zOffset = 400;

    this.raycaster.ray.origin = new udviz.THREE.Vector3(
      pos.x,
      pos.y,
      zOffset
    ).add(ref);
    this.raycaster.ray.direction = new udviz.THREE.Vector3(0, 0, -1);

    let z = 0;
    for (let index = 0; index < ground.length; index++) {
      const element = ground[index];
      const intersects = this.raycaster.intersectObjects([element], true);

      if (intersects.length) {
        const i = intersects[0];
        z = -i.distance;
      }
    }

    const editorMode = localContext.getGameView().getUserData('editorMode');

    if (editorMode) {
      //add commands to the computer directly because not produce by the inputmanager
      const computer = localContext
        .getGameView()
        .getInterpolator()
        .getLocalComputer();

      computer.onCommands([
        new Game.Command({
          type: 'z_update',
          gameObjectUUID: go.getUUID(),
          data: z - zParent + zOffset,
        }),
      ]);
    } else {
      const userID = localContext.getGameView().getUserData('userID');
      const websocketService = localContext.getWebSocketService();
      websocketService.emit(
        Game.Components.Constants.WEBSOCKET.MSG_TYPES.COMMANDS,
        [
          {
            type: 'z_update',
            gameObjectUUID: go.getUUID(),
            userID: userID,
            data: z - zParent + zOffset,
          },
        ]
      );
    }
  }
};
