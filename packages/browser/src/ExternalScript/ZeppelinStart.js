import { OrbitControls, THREE, Game, Shared } from '@ud-viz/browser';

export class ZeppelinStart extends Game.External.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.orbitCtrl = null;

    //buffer
    this.oldPositionZeppelin = null;

    this.zeppelinGO = null;

    this.menuZeppelin = null;

    this.onCloseCallbackMenu = null;
  }

  init() {
    //ADD UI to toolbar
    const menuZeppelin = new MenuZeppelin(this);
    this.menuZeppelin = menuZeppelin;

    const scriptUI = this.context.findExternalScriptWithID('UI');
    const cameraManager =
      this.context.findExternalScriptWithID('CameraManager');
    const avatarController =
      this.context.findExternalScriptWithID('AvatarController');
    this.zeppelinGO = null;
    this.context.object3D.traverse((child) => {
      if (child.userData.isZeppelin) {
        this.zeppelinGO = child;
        return true; // stop propagation
      }
      return false; // continue to traverse
    });
    if (!this.zeppelinGO) throw new Error('no zeppelin go');

    const refine = this.context.findExternalScriptWithID('ItownsRefine');

    scriptUI.addTool(
      './assets/img/ui/icon_zeppelin.png',
      'Zeppelyon',
      (resolve, reject, onClose) => {
        if (cameraManager.currentMovement) {
          resolve(false); //camera is moving
          return;
        }

        //check if city avatar
        const avatarGO = this.context.object3D.getObjectByProperty(
          'uuid',
          this.context.userData.avatarUUID
        );
        if (avatarGO.getObjectByProperty('name', 'city_avatar')) {
          resolve(false); //cant itowns while city avatar
          return;
        }

        if (onClose) {
          cameraManager.moveToAvatar().then(() => {
            this.onCloseCallbackMenu(); //should not ne null

            //reset avatar controls
            avatarController.setAvatarControllerMode(true);

            this.context.sendCommandToGameContext([
              new Shared.Command({
                type: Shared.Game.ScriptTemplate.Constants.COMMAND
                  .UPDATE_EXTERNALSCRIPT_VARIABLES,
                data: {
                  object3DUUID: avatarGO.uuid,
                  variableName: 'visible',
                  variableValue: true,
                },
              }),
            ]);
            resolve(true);
          });
        } else {
          //remove avatar controls
          avatarController.setAvatarControllerMode(false);

          //avatar invisible
          this.context.sendCommandToGameContext([
            new Shared.Command({
              type: Shared.Game.ScriptTemplate.Constants.COMMAND
                .UPDATE_EXTERNALSCRIPT_VARIABLES,
              data: {
                object3DUUID: avatarGO.uuid,
                variableName: 'visible',
                variableValue: false,
              },
            }),
          ]);

          //check locally if there is a different pilot still in game
          const pilot = this.context.object3D.getObjectByProperty(
            'uuid',
            this.variables.pilotUUID
          );

          //update html
          menuZeppelin.update();

          if (
            pilot &&
            this.variables.pilotUUID != this.context.userData.avatarUUID
          ) {
            //cant listen to canvas because zIndex is 0 and labelRenderer zIndex is 1
            //cant listen to rootWebGL because the icon cant be clicked cause of the orbit control
            //have to listen the labelRenderer domElement

            const elementToListen =
              this.context.frame3D.itownsView.mainLoop.gfxEngine.label2dRenderer
                .domElement;

            //new orbitctrl
            this.orbitCtrl = new OrbitControls(
              this.context.frame3D.camera,
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
            this.claimPiloting();
          }

          cameraManager.moveToZeppelin().then(() => {
            resolve(true);
          });
        }
      },
      menuZeppelin
    );

    //callback to become the pilot
    //update claimPilotingButton callback
    //should be only necessary here since when init the user cannot claim the piloting
    this.menuZeppelin.setClaimPilotingButtonCallback(() => {
      const pilot = this.context.object3D.getObjectByProperty(
        'uuid',
        this.variables.pilotUUID
      );
      if (!pilot) {
        //no pilot meaning user was passenger and the piot leave
        if (this.orbitCtrl) {
          this.orbitCtrl.dispose();
          this.orbitCtrl = null;

          this.claimPiloting();

          //routine
          const cameraManager =
            this.context.findExternalScriptWithID('CameraManager');
          cameraManager.moveToZeppelin();
        } else {
          console.warn('There was not orbit control ???');
        }
      }
    });
  }

  claimPiloting() {
    const zeppelinController =
      this.context.findExternalScriptWithID('ZeppelinController');

    if (!zeppelinController) throw new Error('no zeppelin controller script');

    const zeppelinSetted = zeppelinController.setZeppelinControllerMode(true);

    if (!zeppelinSetted) throw 'zeppelin controller not set';

    //edit server side
    this.context.sendCommandToGameContext([
      new Shared.Command({
        type: Shared.Game.ScriptTemplate.Constants.COMMAND
          .UPDATE_EXTERNALSCRIPT_VARIABLES,
        data: {
          object3DUUID: this.object3D.uuid,
          variableName: 'pilotUUID',
          variableValue: this.context.userData.avatarUUID,
        },
      }),
    ]);

    this.onCloseCallbackMenu = () => {
      //remove zeppelin controls
      zeppelinController.setZeppelinControllerMode(false);

      //edit server side to remove pilot
      this.context.sendCommandToGameContext([
        new Shared.Command({
          type: Shared.Game.ScriptTemplate.Constants.COMMAND
            .UPDATE_EXTERNALSCRIPT_VARIABLES,
          data: {
            object3DUUID: this.object3D.uuid,
            variableName: 'pilotUUID',
            variableValue: null,
          },
        }),
      ]);
    };
  }

  onOutdated() {
    //update ui
    this.menuZeppelin.update();
  }

  tick() {
    if (this.orbitCtrl) {
      const position = new THREE.Vector3();
      this.zeppelinGO.matrixWorld.decompose(
        position,
        new THREE.Quaternion(),
        new THREE.Vector3()
      );

      //add to target of orbit ctrl
      this.orbitCtrl.target.copy(position);
      this.orbitCtrl.update();

      //move relatively camera
      if (this.oldPositionZeppelin) {
        this.context.frame3D.camera.position.add(
          position.clone().sub(this.oldPositionZeppelin)
        );
        this.context.frame3D.camera.updateProjectionMatrix();
      }
      this.oldPositionZeppelin = position;
    }
  }

  static get ID_SCRIPT() {
    return 'zeppelin_start_id_ext_script';
  }
}

class MenuZeppelin {
  constructor(zeppelinStart) {
    /** @type {ZeppelinStart} */
    this.zeppelinStart = zeppelinStart;

    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('contextual_menu');

    this.claimPilotingButton = document.createElement('div');
    this.claimPilotingButton.classList.add('button-imuv');
    this.claimPilotingButton.innerHTML = 'Devenir Pilote';
  }

  setClaimPilotingButtonCallback(f) {
    this.claimPilotingButton.onclick = f;
  }

  update() {
    if (this.isClosing) return; //TODO WAIT REFACTO TO MAKE A GENERIC ISCLOSING FLAG ON CONTEXTUAL MENU

    const pilot = this.zeppelinStart.context.object3D.getObjectByProperty(
      'uuid',
      this.zeppelinStart.variables.pilotUUID
    );

    if (pilot) {
      if (
        this.zeppelinStart.variables.pilotUUID ==
        this.zeppelinStart.context.userData.avatarUUID
      ) {
        this.rootHtml.innerHTML = 'Vous pilotez le Zeppelyon';
      } else {
        const namePilot = pilot
          .getComponent(Shared.Game.Component.ExternalScript.TYPE)
          .getModel()
          .getVariables().name;
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
