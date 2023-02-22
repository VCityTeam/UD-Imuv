export class ZeppelinStart {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;

    this.orbitCtrl = null;

    //buffer
    this.oldPositionZeppelin = null;

    this.zeppelinGO = null;

    this.menuZeppelin = null;

    this.onCloseCallbackMenu = null;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];

    //ADD UI to toolbar
    const menuZeppelin = new MenuZeppelin();
    this.menuZeppelin = menuZeppelin;

    const scriptUI = localCtx.findExternalScriptWithID('ui');
    const cameraScript = localCtx.findExternalScriptWithID('camera');
    const avatarController =
      localCtx.findExternalScriptWithID('avatar_controller');
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
    const refine = localCtx.findExternalScriptWithID('itowns_refine');

    scriptUI.addTool(
      './assets/img/ui/icon_zeppelin.png',
      'Zeppelyon',
      (resolve, reject, onClose) => {
        if (cameraScript.hasRoutine()) {
          resolve(false); //camera is moving
          return;
        }

        //check if city avatar
        if (avatarGO.findByName('city_avatar')) {
          resolve(false); //cant zeppelin while city avatar
          return;
        }

        const duration = 2000;
        let currentTime = 0;

        const startPos = camera.position.clone();
        const startQuat = camera.quaternion.clone();

        if (onClose) {
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
              () => {
                this.onCloseCallbackMenu(); //should not ne null

                //reset avatar controls
                avatarController.setAvatarControllerMode(true, localCtx);

                ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPE.EDIT_CONF_COMPONENT, {
                  goUUID: avatarGO.getUUID(),
                  componentUUID: localScriptAvatar.getUUID(),
                  key: 'visible',
                  value: true,
                });

                resolve(true);
              }
            )
          );
        } else {
          //remove avatar controls
          avatarController.setAvatarControllerMode(false, localCtx);

          //avatar invisible
          ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPE.EDIT_CONF_COMPONENT, {
            goUUID: avatarGO.getUUID(),
            componentUUID: localScriptAvatar.getUUID(),
            key: 'visible',
            value: false,
          });

          //check locally if there is a different pilot still in game
          const pilot = rootGO.find(this.conf.pilotUUID);

          //update html
          menuZeppelin.update(localCtx, this.conf);

          if (pilot && this.conf.pilotUUID != avatarUUID) {
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
            this.onCloseCallbackMenu = () => {
              //dispose orbit ctrl
              this.orbitCtrl.dispose();
              this.orbitCtrl = null;
            };
          } else {
            this.claimPiloting(localCtx, go);
          }

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
                resolve(true);
              }
            )
          );
        }
      },
      menuZeppelin
    );

    //callback to become the pilot
    //update claimPilotingButton callback
    //should be only necessary here since when init the user cannot claim the piloting
    this.menuZeppelin.setClaimPilotingButtonCallback(() => {
      const pilot = localCtx.getRootGameObject().find(this.conf.pilotUUID);
      if (!pilot) {
        //no pilot meaning user was passenger and the piot leave
        if (this.orbitCtrl) {
          this.orbitCtrl.dispose();
          this.orbitCtrl = null;

          this.claimPiloting(localCtx, go);

          //routine
          const cameraScript = localCtx.findExternalScriptWithID('camera');
          const camera = localCtx.getGameView().getCamera();
          const duration = 2000;
          let currentTime = 0;

          const startPos = camera.position.clone();
          const startQuat = camera.quaternion.clone();

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
              () => {}
            )
          );
        } else {
          console.warn('There was not orbit control ???');
        }
      }
    });
  }

  claimPiloting(localCtx, go) {
    const ImuvConstants = localCtx.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];
    const avatarUUID = localCtx.getGameView().getUserData('avatarUUID');
    const ws = localCtx.getWebSocketService();
    const zeppelinController = localCtx.findExternalScriptWithID(
      'zeppelin_controller'
    );

    if (!zeppelinController) throw new Error('no zeppelin controller script');

    const zeppelinSetted = zeppelinController.setZeppelinControllerMode(
      true,
      localCtx
    );

    if (!zeppelinSetted) throw 'zeppelin controller not set';

    //scope variables need to edit conf server side
    const goUUID = go.getUUID();
    const ls = go.getComponent(udviz.Game.LocalScript.TYPE);

    //edit server side
    ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPE.EDIT_CONF_COMPONENT, {
      goUUID: goUUID,
      componentUUID: ls.getUUID(),
      key: 'pilotUUID',
      value: avatarUUID,
    });

    this.onCloseCallbackMenu = () => {
      //remove zeppelin controls
      zeppelinController.setZeppelinControllerMode(false, localCtx);

      //edit server side to remove pilot
      ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPE.EDIT_CONF_COMPONENT, {
        goUUID: goUUID,
        componentUUID: ls.getUUID(),
        key: 'pilotUUID',
        value: null,
      });
    };
  }

  onOutdated() {
    //update ui
    this.menuZeppelin.update(arguments[1], this.conf);
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
}

class MenuZeppelin {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('contextual_menu');

    this.claimPilotingButton = document.createElement('div');
    this.claimPilotingButton.classList.add('button-imuv');
    this.claimPilotingButton.innerHTML = 'Devenir Pilote';
  }

  setClaimPilotingButtonCallback(f) {
    this.claimPilotingButton.onclick = f;
  }

  update(localCtx, conf) {
    if (this.isClosing) return; //TODO WAIT REFACTO TO MAKE A GENERIC ISCLOSING FLAG ON CONTEXTUAL MENU

    const pilot = localCtx.getRootGameObject().find(conf.pilotUUID);

    if (pilot) {
      const avatarUUID = localCtx.getGameView().getUserData('avatarUUID');
      if (conf.pilotUUID == avatarUUID) {
        this.rootHtml.innerHTML = 'Vous pilotez le Zeppelyon';
      } else {
        const namePilot = pilot.getComponent(Game.LocalScript.TYPE).conf.name;
        this.rootHtml.innerHTML = namePilot + ' est le pilote';
      }

      this.claimPilotingButton.remove();
    } else {
      this.rootHtml.innerHTML = 'Personne ne pilote le Zeppelyon';
      this.rootHtml.appendChild(this.claimPilotingButton);
    }
  }

  dispose() {
    this.rootHtml.remove();
  }

  html() {
    return this.rootHtml;
  }
}
