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

    this.orbitCtrl = null;

    //buffer
    this.oldPositionZeppelin = null;

    this.zeppelinGO = null;

    this.menuZeppelin = null;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];

    //ADD UI to toolbar
    const menuZeppelin = new MenuZeppelin(localCtx, this.conf);
    this.menuZeppelin = menuZeppelin;

    const scriptUI = localCtx.findLocalScriptWithID('ui');
    const cameraScript = localCtx.findLocalScriptWithID('camera');
    const avatarController =
      localCtx.findLocalScriptWithID('avatar_controller');
    const gameView = localCtx.getGameView();
    const camera = gameView.getCamera();
    const avatarUUID = localCtx.getGameView().getUserData('avatarUUID');
    const ws = localCtx.getWebSocketService();
    const rootGO = localCtx.getRootGameObject();
    this.zeppelinGO = rootGO.findByName('Zeppelin');

    const avatarGO = rootGO.find(avatarUUID);
    const localScriptAvatar = avatarGO.getComponent(
      udviz.Game.LocalScript.TYPE
    );
    const ImuvConstants = localCtx.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];
    const refine = localCtx.findLocalScriptWithID('itowns_refine');

    let onCloseCallback = null; //record the onClose callback when opening the tool

    scriptUI.addTool(
      './assets/img/ui/icon_zeppelin.png',
      'Zeppelyon',
      (resolve, reject, onClose) => {
        if (cameraScript.hasRoutine()) {
          resolve(false); //camera is moving
          return;
        }

        //check if city avatar
        const avatarGO = localCtx
          .getRootGameObject()
          .find(localCtx.getGameView().getUserData('avatarUUID'));
        if (avatarGO.findByName('city_avatar')) {
          resolve(false); //cant zeppelin while city avatar
          return;
        }

        const duration = 2000;
        let currentTime = 0;

        const startPos = camera.position.clone();
        const startQuat = camera.quaternion.clone();

        if (onClose) {
          const avatarGO = rootGO.find(avatarUUID);

          cameraScript.addRoutine(
            new udviz.Game.Components.Routine(
              function (dt) {
                cameraScript.focusCamera.setTarget(avatarGO);
                const t = cameraScript
                  .getFocusCamera()
                  .computeTransformTarget(
                    null,
                    cameraScript.getDistanceCameraAvatar()
                  );

                currentTime += dt;
                let ratio = currentTime / duration;
                ratio = Math.min(Math.max(0, ratio), 1);

                const p = t.position.lerp(startPos, 1 - ratio);
                const q = t.quaternion.slerp(startQuat, 1 - ratio);

                camera.position.copy(p);
                camera.quaternion.copy(q);

                camera.updateProjectionMatrix();

                return ratio >= 1;
              },
              function () {
                onCloseCallback(); //should not ne null

                resolve(true);
              }
            )
          );
        } else {
          //remove avatar controls
          avatarController.setAvatarControllerMode(false, localCtx);

          //avatar invisible
          ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPES.EDIT_CONF_COMPONENT, {
            goUUID: avatarGO.getUUID(),
            componentUUID: localScriptAvatar.getUUID(),
            key: 'visible',
            value: false,
          });

          cameraScript.addRoutine(
            new udviz.Game.Components.Routine(
              (dt) => {
                cameraScript.focusCamera.setTarget(this.zeppelinGO);
                const t = cameraScript.focusCamera.computeTransformTarget(
                  null,
                  cameraScript.getDistanceCameraZeppelin()
                );

                currentTime += dt;
                const ratio = Math.min(Math.max(0, currentTime / duration), 1);

                const p = t.position.lerp(startPos, 1 - ratio);
                const q = t.quaternion.slerp(startQuat, 1 - ratio);

                camera.position.copy(p);
                camera.quaternion.copy(q);

                camera.updateProjectionMatrix();

                return ratio >= 1;
              },
              () => {
                //check locally if there is a different pilot still in game
                const pilotUUID = this.conf.pilotUUID;
                const inGame = rootGO.find(pilotUUID);

                if (pilotUUID && inGame && pilotUUID != avatarUUID) {
                  //cant listen to canvas because zIndex is 0 and labelRenderer zIndex is 1
                  //cant listen to rootWebGL because the icon cant be clicked cause of the orbit control
                  //have to listen the labelRenderer domElement

                  const elementToListen =
                    gameView.getItownsView().mainLoop.gfxEngine.label2dRenderer
                      .domElement;

                  //new orbitctrl
                  this.orbitCtrl = new udviz.OrbitControls(
                    localCtx.getGameView().getCamera(),
                    elementToListen
                  );
                  this.oldPositionZeppelin = null; //reset

                  if (refine) refine.itownsControls();

                  //on leave zeppelin cb
                  onCloseCallback = () => {
                    //restore avatar controls
                    avatarController.setAvatarControllerMode(true, localCtx);

                    //dispose orbit ctrl
                    this.orbitCtrl.dispose();
                    this.orbitCtrl = null;

                    ws.emit(
                      ImuvConstants.WEBSOCKET.MSG_TYPES.EDIT_CONF_COMPONENT,
                      {
                        goUUID: avatarGO.getUUID(),
                        componentUUID: localScriptAvatar.getUUID(),
                        key: 'visible',
                        value: true,
                      }
                    );
                  };
                } else {
                  const zeppelinController = localCtx.findLocalScriptWithID(
                    'zeppelin_controller'
                  );

                  if (!zeppelinController)
                    throw new Error('no zeppelin controller script');

                  const zeppelinSetted =
                    zeppelinController.setZeppelinControllerMode(
                      true,
                      localCtx
                    );

                  if (refine) refine.zeppelin();

                  if (zeppelinSetted) {
                    //scope variables need to edit conf server side
                    const goUUID = go.getUUID();
                    const ls = go.getComponent(udviz.Game.LocalScript.TYPE);

                    //edit server side
                    ws.emit(
                      ImuvConstants.WEBSOCKET.MSG_TYPES.EDIT_CONF_COMPONENT,
                      {
                        goUUID: goUUID,
                        componentUUID: ls.getUUID(),
                        key: 'pilotUUID',
                        value: avatarUUID,
                      }
                    );

                    //on leave zeppelin cb
                    onCloseCallback = () => {
                      //remove zeppelin controls
                      zeppelinController.setZeppelinControllerMode(
                        false,
                        localCtx
                      );
                      //reset avatar controls
                      avatarController.setAvatarControllerMode(true, localCtx);

                      //edit server side to remove pilot
                      ws.emit(
                        ImuvConstants.WEBSOCKET.MSG_TYPES.EDIT_CONF_COMPONENT,
                        {
                          goUUID: goUUID,
                          componentUUID: ls.getUUID(),
                          key: 'pilotUUID',
                          value: null,
                        }
                      );

                      ws.emit(
                        ImuvConstants.WEBSOCKET.MSG_TYPES.EDIT_CONF_COMPONENT,
                        {
                          goUUID: avatarGO.getUUID(),
                          componentUUID: localScriptAvatar.getUUID(),
                          key: 'visible',
                          value: true,
                        }
                      );
                    };
                  } else {
                    console.error('zeppelin controls not setted');
                  }
                }

                resolve(true);
              }
            )
          );
        }
      },
      menuZeppelin
    );
  }

  onOutdated() {
    this.menuZeppelin.updateLabel(arguments[1], this.conf);
  }

  tick() {
    const localCtx = arguments[1];

    if (this.orbitCtrl) {
      const obj = this.zeppelinGO.getObject3D();
      const position = new Game.THREE.Vector3();
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
        const camera = localCtx.getGameView().getCamera();
        camera.position.add(position.clone().sub(this.oldPositionZeppelin));
        camera.updateProjectionMatrix();
      }
      this.oldPositionZeppelin = position;
    }
  }
};

class MenuZeppelin {
  constructor(localCtx, conf) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('contextual_menu');

    this.updateLabel(localCtx, conf);
  }

  updateLabel(localCtx, conf) {
    const pilot = localCtx.getRootGameObject().find(conf.pilotUUID);
    console.log('Pilote est ' + pilot);
    if (pilot) {
      const avatarUUID = localCtx.getGameView().getUserData('avatarUUID');
      if (conf.pilotUUID == avatarUUID) {
        this.rootHtml.innerHTML = 'Vous pilotez le Zeppelyon';
      } else {
        const namePilot = pilot.getComponent(Game.LocalScript.TYPE).conf.name;
        this.rootHtml.innerHTML = namePilot + ' est le pilote';
      }
    } else {
      this.rootHtml.innerHTML = 'Personne ne pilote le Zeppelyon';
    }
  }

  dispose() {
    this.rootHtml.remove();
  }

  html() {
    return this.rootHtml;
  }
}
