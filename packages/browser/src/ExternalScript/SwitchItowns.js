import {
  Game,
  RequestService,
  THREE,
  Widget,
  itownsWidgets,
} from '@ud-viz/browser';

import { UI } from './UI';
import { AvatarController } from './AvatarController';
import { CameraManager } from './CameraManager';
import { ItownsRefine } from './ItownsRefine';

export class SwitchItowns extends Game.External.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.itownsCamPos = null;
    this.itownsCamQuat = null;
  }

  init() {
    /** @type {CameraManager} */
    const cameraManager = this.context.findExternalScriptWithID(
      CameraManager.ID_SCRIPT
    );
    const avatarController = this.context.findExternalScriptWithID(
      AvatarController.ID_SCRIPT
    );
    const scriptUI = this.context.findExternalScriptWithID(UI.ID_SCRIPT);

    if (this.context.frame3D.itownsView) {
      const promiseFunction = (resolve, reject, onClose) => {
        if (cameraManager.currentMovement) {
          resolve(false); //already movement
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
          //record
          this.itownsCamPos.copy(this.context.frame3D.camera.position);
          this.itownsCamQuat.setFromEuler(this.context.frame3D.camera.rotation);

          this.context.frame3D.enableItownsViewControls(false);
          cameraManager.moveToAvatar().then(() => {
            avatarController.setAvatarControllerMode(true);
            resolve(true);
          });
        } else {
          //remove avatar controls
          avatarController.setAvatarControllerMode(false);

          if (!this.itownsCamPos && !this.itownsCamQuat) {
            //first time camera in sky

            const currentPosition = new THREE.Vector3().copy(
              this.context.frame3D.camera.position
            );

            //200 meters up
            const endPosition = new THREE.Vector3(0, 0, 200).add(
              currentPosition
            );

            //look down
            const endQuaternion = new THREE.Quaternion().setFromEuler(
              new THREE.Euler(0.01, 0, 0)
            );

            this.itownsCamPos = endPosition;
            this.itownsCamQuat = endQuaternion;
          }

          cameraManager
            .moveToTransform(this.itownsCamPos, this.itownsCamQuat, 2000)
            .then(() => {
              this.context.inputManager.setPointerLock(false);

              this.context.frame3D.enableItownsViewControls(true);

              //tweak zoom factor
              this.context.frame3D.itownsView.controls.zoomInFactor = scriptUI
                .getMenuSettings()
                .getZoomFactorValue();
              this.context.frame3D.itownsView.controls.zoomOutFactor =
                1 / scriptUI.getMenuSettings().getZoomFactorValue();

              this.context.frame3D.itownsView.notifyChange(
                this.context.frame3D.camera
              );

              const refine = this.context.findExternalScriptWithID(
                ItownsRefine.ID_SCRIPT
              );
              if (refine) refine.itownsControls();

              resolve(true);
            });
        }
      };

      const menuItowns = new MenuItowns(this.context);

      scriptUI.addTool(
        './assets/img/ui/icon_town_white.png',
        'Vue itowns',
        promiseFunction,
        menuItowns
      );
    }
  }

  static get ID_SCRIPT() {
    return 'switch_itowns_id_ext_script';
  }
}

class MenuItowns {
  /**
   *
   * @param {Game.External.Context} externalContext
   */
  constructor(externalContext) {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('root_menu_itowns');
    this.domElement.classList.add('contextual_menu');

    const title = document.createElement('h1');
    title.innerHTML = 'Widgets';
    this.domElement.appendChild(title);

    //buffer
    this.widgets = {};

    ////ADD UD-VIZ WIDGETS

    //layerchoice
    this.addModuleView(
      'Layer Choice',
      new Widget.LayerChoice(externalContext.frame3D.itownsView)
    );

    //cameraPositionner
    this.addModuleView(
      'Camera Positioner',
      new Widget.CameraPositioner(externalContext.frame3D.itownsView)
    );

    //geocoding
    const requestService = new RequestService();
    const geocodingService = new Widget.Server.GeocodingService(
      requestService,
      externalContext.userData.extent,
      {
        url: 'https://nominatim.openstreetmap.org/search',
        credit:
          '© OpenStreetMap contributors under <a href="https://www.openstreetmap.org/copyright">ODbL</a>',
        requestTimeIntervalMs: 1000,
        result: {
          format: 'json',
          basePath: '',
          lng: 'lon',
          lat: 'lat',
        },
        parameters: {
          q: {
            fill: 'query',
          },
          format: {
            fill: 'value',
            value: 'json',
          },
          viewbox: {
            fill: 'extent',
            format: 'WEST,SOUTH,EAST,NORTH',
          },
        },
      }
    );

    this.addModuleView(
      'Geocoding',
      new Widget.Server.GeocodingView(
        geocodingService,
        externalContext.frame3D.itownsView
      )
    );

    ////ADD ITOWNS WIDGETS
    const itownsScale = new itownsWidgets.Scale(
      externalContext.frame3D.itownsView,
      {
        parentElement: this.domElement,
      }
    );

    itownsScale.domElement.id = 'itowns-scale';
    itownsScale.update();
  }

  html() {
    return this.domElement;
  }

  addModuleView(moduleId, moduleClass) {
    const button = document.createElement('button');
    button.classList.add('button-imuv');

    button.innerHTML = moduleId;
    this.domElement.appendChild(button);

    //ref for dispose
    this.widgets[moduleId] = moduleClass;

    //parent
    moduleClass.parentElement = document.body;

    button.onclick = function () {
      if (moduleClass.isVisible) {
        moduleClass.disable();
      } else {
        moduleClass.enable();
      }
    };
  }

  dispose() {
    this.domElement.remove();

    //remove active widgets
    for (const id in this.widgets) {
      this.widgets[id].disable();
    }
  }
}
