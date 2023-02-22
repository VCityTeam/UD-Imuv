import { ExternalGame, THREE, Widget, itownsWidgets } from '@ud-viz/browser';
import { Routine } from './Component/Routine';

export class SwitchItowns extends ExternalGame.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    this.itownsCamPos = null;
    this.itownsCamQuat = null;
  }

  init() {
    const cameraScript = this.context.findExternalScriptWithID('Camera');
    const avatarController =
      this.context.findExternalScriptWithID('AvatarController');
    const scriptUI = this.context.findExternalScriptWithID('UI');

    if (this.context.frame3D.itownsView) {
      const promiseFunction = (resolve, reject, onClose) => {
        if (cameraScript.hasRoutine()) {
          resolve(false); //already routine
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

        const duration = 2000;
        let currentTime = 0;

        const startPos = this.context.frame3D.camera.position.clone();
        const startQuat = this.context.frame3D.camera.quaternion.clone();

        if (onClose) {
          //record
          this.itownsCamPos.copy(this.context.frame3D.camera.position);
          this.itownsCamQuat.setFromEuler(this.context.frame3D.camera.rotation);

          this.context.frame3D.enableItownsViewControls(false);

          cameraScript.addRoutine(
            new Routine(
              (dt) => {
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

                this.context.frame3D.camera.position.copy(p);
                this.context.frame3D.camera.quaternion.copy(q);

                this.context.frame3D.camera.updateProjectionMatrix();

                return ratio >= 1;
              },
              () => {
                avatarController.setAvatarControllerMode(true);
                resolve(true);
              }
            )
          );
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

          cameraScript.addRoutine(
            new Routine(
              (dt) => {
                currentTime += dt;
                let ratio = currentTime / duration;
                ratio = Math.min(Math.max(0, ratio), 1);

                const p = this.itownsCamPos.clone().lerp(startPos, 1 - ratio);
                const q = this.itownsCamQuat
                  .clone()
                  .slerp(startQuat, 1 - ratio);

                this.context.frame3D.camera.position.copy(p);
                this.context.frame3D.camera.quaternion.copy(q);

                this.context.frame3D.camera.updateProjectionMatrix();

                return ratio >= 1;
              },
              () => {
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

                const refine =
                  this.context.findExternalScriptWithID('ItownsRefine');
                if (refine) refine.itownsControls();

                resolve(true);
              }
            )
          );
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
}

class MenuItowns {
  /**
   *
   * @param {ExternalGame.Context} externalContext
   */
  constructor(externalContext) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_menu_itowns');
    this.rootHtml.classList.add('contextual_menu');

    const title = document.createElement('h1');
    title.innerHTML = 'Widgets';
    this.rootHtml.appendChild(title);

    //buffer
    this.widgets = {};

    ////ADD UD-VIZ WIDGETS

    //layerchoice
    this.addModuleView(
      'Layer Choice',
      new Widget.LayerChoice(externalContext.frame3D.layerManager)
    );

    //cityObjects
    this.addModuleView(
      'City Object',
      new Widget.CityObjectModule(externalContext.frame3D.layerManager, {
        cityObjects: {
          styles: {
            layerDefault: {
              materialProps: {
                color: '#ffa14f',
              },
            },
            selection: {
              materialProps: {
                color: '#13ddef',
              },
            },
            linkedWithDisplayedDocument: {
              materialProps: {
                color: '#4c5af7',
              },
            },
          },
        },
      }).view
    );

    //cameraPositionner
    this.addModuleView(
      'Camera Positioner',
      new Widget.CameraPositionerView(externalContext.frame3D.itownsView)
    );

    //debug3DTiles
    this.addModuleView(
      'Debug 3DTiles',
      new Widget.Debug3DTilesWindow(externalContext.frame3D.layerManager)
    );

    //geocoding
    const requestService = new Widget.Server.Component.RequestService();
    const geocodingService = new Widget.Server.GeocodingService(
      requestService,
      externalContext.userData.extent,
      {
        geocoding: {
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
        parentElement: this.rootHtml,
      }
    );

    itownsScale.domElement.id = 'itowns-scale';
    itownsScale.update();
  }

  html() {
    return this.rootHtml;
  }

  addModuleView(moduleId, moduleClass) {
    const button = document.createElement('button');
    button.classList.add('button-imuv');

    button.innerHTML = moduleId;
    this.rootHtml.appendChild(button);

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
    this.rootHtml.remove();

    //remove active widgets
    for (const id in this.widgets) {
      this.widgets[id].disable();
    }
  }
}
