/**@format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class ZeppelinStart {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;

    this.go = null;
    this.orbitCtrl = null;
    this.zeppelinGO = null;

    //buffer
    this.oldPositionZeppelin = null;

    //to know if inetraction must be compute or not
    this.onZeppelinInteraction = false;
  }

  getOnZeppelinInteraction() {
    return this.onZeppelinInteraction;
  }

  init() {
    this.go = arguments[0];
  }

  tick() {
    const localCtx = arguments[1];

    if (this.orbitCtrl) {
      if (!this.zeppelinGO) {
        this.zeppelinGO = localCtx.getRootGameObject().findByName('Zeppelin');
      }

      const obj = this.zeppelinGO.getObject3D();
      let position = new Game.THREE.Vector3();
      obj.matrixWorld.decompose(
        position,
        new Game.THREE.Quaternion(),
        new Game.THREE.Vector3()
      );

      //add to target of orbit ctrl
      this.orbitCtrl.target.copy(position);
      this.orbitCtrl.update();

      //move relatively camera
      if (this.oldPositionZeppelin) {
        let diff = position.clone().sub(this.oldPositionZeppelin);
        const camera = localCtx.getGameView().getCamera();
        camera.position.add(diff);
        camera.updateProjectionMatrix();
      }
      this.oldPositionZeppelin = position;
    }
  }

  interaction(localCtx) {
    //scope variables
    const _this = this;
    const rootGO = localCtx.getRootGameObject();
    const manager = localCtx.getGameView().getInputManager();

    if (this.onZeppelinInteraction) return; //nothing should happen

    this.onZeppelinInteraction = true;

    //avatar_controller
    const avatarController = rootGO.fetchLocalScripts()['avatar_controller'];
    if (!avatarController) throw new Error('no avatar controller script');

    //remove avatar controls
    const avatarUnsetted = avatarController.setAvatarControllerMode(
      false,
      localCtx
    );

    if (!avatarUnsetted) console.error('avatar controller not unsetted');

    //check locally if there is a different pilot still in game
    const pilotUUID = this.conf.pilotUUID;
    const avatarUUID = localCtx.getGameView().getUserData('avatarUUID');
    const inGame = rootGO.find(pilotUUID);

    if (pilotUUID && inGame && pilotUUID != avatarUUID) {
      //new orbitctrl
      this.orbitCtrl = new udviz.OrbitControls(
        localCtx.getGameView().getCamera(),
        manager.getElement()
      );

      //on leave zeppelin cb
      const cb = function () {
        //restore avatar controls
        avatarController.setAvatarControllerMode(true, localCtx);

        //dispose orbit ctrl
        _this.orbitCtrl.dispose();
        _this.orbitCtrl = null;

        //no on zeppelin anymore
        _this.onZeppelinInteraction = false;

        //remove cb
        manager.removeInputListener(cb);
      };
      manager.addKeyInput('e', 'keydown', cb);
    } else {
      const zeppelinController =
        rootGO.fetchLocalScripts()['zeppelin_controller'];

      if (!zeppelinController) throw new Error('no zeppelin controller script');

      const zeppelinSetted = zeppelinController.setZeppelinControllerMode(
        true,
        localCtx
      );

      if (zeppelinSetted) {
        //scope variables need to edit conf server side
        const goUUID = this.go.getUUID();
        const ls = this.go.getComponent(udviz.Game.LocalScript.TYPE);

        //websocket service
        const ws = localCtx.getWebSocketService();

        if (!ws) {
          console.warn('no websocket service');
          return;
        }

        //edit server side
        ws.emit(
          udviz.Game.Components.Constants.WEBSOCKET.MSG_TYPES
            .EDIT_CONF_COMPONENT,
          {
            goUUID: goUUID,
            componentUUID: ls.getUUID(),
            key: 'pilotUUID',
            value: avatarUUID,
          }
        );

        //on leave zeppelin cb
        const cb = function () {
          //remove zeppelin controls
          zeppelinController.setZeppelinControllerMode(false, localCtx);
          //reset avatar controls
          avatarController.setAvatarControllerMode(true, localCtx);

          //edit server side to remove pilot
          ws.emit(
            udviz.Game.Components.Constants.WEBSOCKET.MSG_TYPES
              .EDIT_CONF_COMPONENT,
            {
              goUUID: goUUID,
              componentUUID: ls.getUUID(),
              key: 'pilotUUID',
              value: null,
            }
          );

          //no on zeppelin anymore
          _this.onZeppelinInteraction = false;

          //remove cb
          manager.removeInputListener(cb);
        };
        manager.addKeyInput('e', 'keydown', cb);
      } else {
        console.error('zeppelin controls not setted');
      }
    }
  }
};
