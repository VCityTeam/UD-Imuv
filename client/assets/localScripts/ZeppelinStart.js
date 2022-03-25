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

    this.avatarOnZeppelin = false;
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
      this.orbitCtrl.target.copy(position);
      this.orbitCtrl.update();
    }
  }

  interaction(localCtx) {
    //scope variables
    const _this = this;
    const rootGO = localCtx.getRootGameObject();
    const manager = localCtx.getGameView().getInputManager();

    if (this.avatarOnZeppelin) return; //nothing should happen

    this.avatarOnZeppelin = true;

    //avatar_controller
    const avatarController = rootGO.fetchLocalScripts()['avatar_controller'];
    if (!avatarController) throw new Error('no avatar controller script');

    //remove avatar controls
    const avatarUnsetted = avatarController.setAvatarControllerMode(
      false,
      localCtx
    );

    if (!avatarUnsetted) console.error('avatar controller not unsetted');

    //check locally if there is a pilot still in game
    const pilotUUID = this.conf.pilotUUID;
    const inGame = rootGO.find(pilotUUID);

    if (pilotUUID && inGame) {
      console.log('There is a pilot => orbit ctrl mode');

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
        _this.avatarOnZeppelin = false;

        //remove cb
        manager.removeInputListener(cb);
      };
      manager.addKeyInput('e', 'keydown', cb);
    } else {
      console.log('Nobody pilot zeppelin');

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
        const avatarUUID = localCtx.getGameView().getUserData('avatarUUID');

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
          _this.avatarOnZeppelin = false;

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
