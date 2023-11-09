import { ScriptBase } from '@ud-viz/game_browser';
import { Command, ExternalScriptComponent } from '@ud-viz/game_shared';
import { constant } from '@ud-viz/game_shared_template';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';

import { UI } from './UI';
import { CameraManager } from './CameraManager';
import { AvatarController } from './AvatarController';
import { ItownsRefine } from './ItownsRefine';
import { ZeppelinController } from './ZeppelinController';
import { ID } from '../../shared/constant';

export class ZeppelinStart extends ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.orbitCtrl = null;

    // buffer
    this.oldPositionZeppelin = null;

    this.zeppelinGO = null;

    this.menuZeppelin = null;

    this.onCloseCallbackMenu = null;
  }

  init() {
    // ADD UI to toolbar
    const menuZeppelin = new MenuZeppelin(this);
    this.menuZeppelin = menuZeppelin;

    const scriptUI = this.context.findExternalScriptWithID(UI.ID_SCRIPT);
    const cameraManager = this.context.findExternalScriptWithID(
      CameraManager.ID_SCRIPT
    );
    const avatarController = this.context.findExternalScriptWithID(
      AvatarController.ID_SCRIPT
    );
    this.zeppelinGO = null;
    this.context.object3D.traverse((child) => {
      if (child.userData.isZeppelin) {
        this.zeppelinGO = child;
        return true; // stop propagation
      }
      return false; // continue to traverse
    });
    if (!this.zeppelinGO) throw new Error('no zeppelin go');

    const refine = this.context.findExternalScriptWithID(
      ItownsRefine.ID_SCRIPT
    );

    scriptUI.addTool(
      './assets/img/ui/icon_zeppelin.png',
      'Zeppelyon',
      (resolve, reject, onClose) => {
        if (cameraManager.currentMovement) {
          resolve(false); // camera is moving
          return;
        }

        // check if city avatar
        const avatarGO = this.context.object3D.getObjectByProperty(
          'uuid',
          this.context.userData.avatar.uuid
        );
        if (avatarGO.getObjectByProperty('name', 'city_avatar')) {
          resolve(false); // cant itowns while city avatar
          return;
        }

        if (onClose) {
          cameraManager.moveToAvatar().then(() => {
            this.onCloseCallbackMenu(); // should not ne null

            // reset avatar controls
            avatarController.setAvatarControllerMode(true);

            this.context.sendCommandsToGameContext([
              new Command({
                type: constant.COMMAND.UPDATE_EXTERNALSCRIPT_VARIABLES,
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
          // remove avatar controls
          avatarController.setAvatarControllerMode(false);

          // avatar invisible
          this.context.sendCommandsToGameContext([
            new Command({
              type: constant.COMMAND.UPDATE_EXTERNALSCRIPT_VARIABLES,
              data: {
                object3DUUID: avatarGO.uuid,
                variableName: 'visible',
                variableValue: false,
              },
            }),
          ]);

          // check locally if there is a different pilot still in game
          const pilot = this.context.object3D.getObjectByProperty(
            'uuid',
            this.variables.pilotUUID
          );

          // update html
          menuZeppelin.update();

          if (
            pilot &&
            this.variables.pilotUUID != this.context.userData.avatar.uuid
          ) {
            // cant listen to canvas because zIndex is 0 and labelRenderer zIndex is 1
            // cant listen to domElementWebGL because the icon cant be clicked cause of the orbit control
            // have to listen the labelRenderer domElement

            const elementToListen =
              this.context.frame3D.itownsView.mainLoop.gfxEngine.label2dRenderer
                .domElement;

            // new orbitctrl
            this.orbitCtrl = new OrbitControls(
              this.context.frame3D.camera,
              elementToListen
            );
            this.oldPositionZeppelin = null; // reset

            if (refine) refine.itownsControls();

            // on leave zeppelin cb
            this.onCloseCallbackMenu = () => {
              // dispose orbit ctrl
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

    // callback to become the pilot
    // update claimPilotingButton callback
    // should be only necessary here since when init the user cannot claim the piloting
    this.menuZeppelin.setClaimPilotingButtonCallback(() => {
      const pilot = this.context.object3D.getObjectByProperty(
        'uuid',
        this.variables.pilotUUID
      );
      if (!pilot) {
        // no pilot meaning user was passenger and the piot leave
        if (this.orbitCtrl) {
          this.orbitCtrl.dispose();
          this.orbitCtrl = null;

          this.claimPiloting();

          // routine
          const cameraManager = this.context.findExternalScriptWithID(
            CameraManager.ID_SCRIPT
          );
          cameraManager.moveToZeppelin();
        } else {
          console.warn('There was not orbit control ???');
        }
      }
    });
  }

  claimPiloting() {
    const zeppelinController = this.context.findExternalScriptWithID(
      ZeppelinController.ID_SCRIPT
    );

    if (!zeppelinController) throw new Error('no zeppelin controller script');

    const zeppelinSetted = zeppelinController.setZeppelinControllerMode(true);

    if (!zeppelinSetted) throw 'zeppelin controller not set';

    // edit server side
    this.context.sendCommandsToGameContext([
      new Command({
        type: constant.COMMAND.UPDATE_EXTERNALSCRIPT_VARIABLES,
        data: {
          object3DUUID: this.object3D.uuid,
          variableName: 'pilotUUID',
          variableValue: this.context.userData.avatar.uuid,
        },
      }),
    ]);

    this.onCloseCallbackMenu = () => {
      // remove zeppelin controls
      zeppelinController.setZeppelinControllerMode(false);

      // edit server side to remove pilot
      this.context.sendCommandsToGameContext([
        new Command({
          type: constant.COMMAND.UPDATE_EXTERNALSCRIPT_VARIABLES,
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
    // update ui
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

      // add to target of orbit ctrl
      this.orbitCtrl.target.copy(position);
      this.orbitCtrl.update();

      // move relatively camera
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
    return ID.EXTERNAL_SCRIPT.ZEPPELIN_START;
  }
}

class MenuZeppelin {
  constructor(zeppelinStart) {
    /** @type {ZeppelinStart} */
    this.zeppelinStart = zeppelinStart;

    this.domElement = document.createElement('div');
    this.domElement.classList.add('contextual_menu');

    this.claimPilotingButton = document.createElement('div');
    this.claimPilotingButton.classList.add('button-imuv');
    this.claimPilotingButton.innerHTML = 'Devenir Pilote';
  }

  setClaimPilotingButtonCallback(f) {
    this.claimPilotingButton.onclick = f;
  }

  update() {
    if (this.isClosing) return; // TODO WAIT REFACTO TO MAKE A GENERIC ISCLOSING FLAG ON CONTEXTUAL MENU

    const pilot = this.zeppelinStart.context.object3D.getObjectByProperty(
      'uuid',
      this.zeppelinStart.variables.pilotUUID
    );

    if (pilot) {
      if (
        this.zeppelinStart.variables.pilotUUID ==
        this.zeppelinStart.context.userData.avatar.uuid
      ) {
        this.domElement.innerHTML = 'Vous pilotez le Zeppelyon';
      } else {
        const namePilot = pilot
          .getComponent(ExternalScriptComponent.TYPE)
          .getModel().variables.name;
        this.domElement.innerHTML = namePilot + ' est le pilote';
      }

      this.claimPilotingButton.remove();
    } else {
      this.domElement.innerHTML = 'Personne ne pilote le Zeppelyon';
      this.domElement.appendChild(this.claimPilotingButton);
    }
  }

  dispose() {
    this.domElement.remove();
  }

  html() {
    return this.domElement;
  }
}
