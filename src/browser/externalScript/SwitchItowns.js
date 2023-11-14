import * as THREE from 'three';
import { ScriptBase } from '@ud-viz/game_browser';
import { C3DTiles } from '@ud-viz/widget_3d_tiles';
import { LayerChoice } from '@ud-viz/widget_layer_choice';
import { CameraPositioner } from '@ud-viz/widget_camera_positioner';
import { GeocodingView, GeocodingService } from '@ud-viz/widget_geocoding';
import { RequestService } from '@ud-viz/utils_browser';
import { Scale } from 'itowns/widgets';
import { Style } from 'itowns';

import { UI } from './UI';
import { AvatarController } from './AvatarController';
import { CameraManager } from './CameraManager';
import { ItownsRefine } from './ItownsRefine';
import { ID } from '../../shared/constant';

export class SwitchItowns extends ScriptBase {
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
          resolve(false); // already movement
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
          // record
          this.itownsCamPos.copy(this.context.frame3D.camera.position);
          this.itownsCamQuat.setFromEuler(this.context.frame3D.camera.rotation);

          this.context.frame3D.itownsView.controls.enabled = false;
          cameraManager.moveToAvatar().then(() => {
            avatarController.setAvatarControllerMode(true);
            resolve(true);
          });
        } else {
          // remove avatar controls
          avatarController.setAvatarControllerMode(false);

          if (!this.itownsCamPos && !this.itownsCamQuat) {
            // first time camera in sky

            const currentPosition = new THREE.Vector3().copy(
              this.context.frame3D.camera.position
            );

            // 200 meters up
            const endPosition = new THREE.Vector3(0, 0, 200).add(
              currentPosition
            );

            // look down
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

              this.context.frame3D.itownsView.controls.enabled = true;

              // tweak zoom factor
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
    return ID.EXTERNAL_SCRIPT.SWITCH_ITOWNS;
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
    title.innerText = 'Widgets';
    this.domElement.appendChild(title);

    // //ADD UD-VIZ WIDGETS

    // buffer
    this.widgets = {};

    // layerchoice
    this.addModuleView(
      'Layer Choice',
      new LayerChoice(externalContext.frame3D.itownsView)
    );

    this.widgets['Layer Choice'].domElement.remove();
    this.widgets['Layer Choice'].initHtml();

    // cameraPositionner
    this.addModuleView(
      'Camera Positioner',
      new CameraPositioner(externalContext.frame3D.itownsView)
    );

    // geocoding
    const requestService = new RequestService();
    const geocodingService = new GeocodingService(
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
      new GeocodingView(geocodingService, externalContext.frame3D.itownsView)
    );

    //3d tiles
    this.addModuleView(
      '3D Tiles',
      new C3DTiles(externalContext.frame3D.itownsView, {
        overrideStyle: new Style({
          fill: {
            color: function (feature) {
              return feature.userData.selectedColor
                ? feature.userData.selectedColor
                : 'white';
            },
          },
        }),
        parentElement: this.domElement,
        layerContainerClassName: 'widgets-3dtiles-layer-container',
        c3DTFeatureInfoContainerClassName: 'widgets-3dtiles-feature-container',
        urlContainerClassName: 'widgets-3dtiles-url-container',
      })
    );

    this.widgets['3D Tiles'].domElement.setAttribute('id', 'widgets-3dtiles');
    this.widgets['3D Tiles'].domElement.remove();

    // add on click behavior
    const contextSelection = {
      feature: null,
      layer: null,
    };

    const resetContext = () => {
      if (contextSelection.feature) {
        // reset feature userData
        contextSelection.feature.userData.selectedColor = null;
        // and update style of its layer
        contextSelection.layer.updateStyle();
        // reset context selection
        contextSelection.feature = null;
        contextSelection.layer = null;
      }
    };

    const listener3Dtiles = (event) => {
      resetContext();
      const view = externalContext.frame3D.itownsView;
      // get intersects based on the click event
      const intersects = view.pickObjectsAt(
        event,
        0,
        view.getLayers().filter((el) => el.isC3DTilesLayer)
      );

      if (intersects.length) {
        // get featureClicked
        const featureClicked =
          intersects[0].layer.getC3DTileFeatureFromIntersectsArray(intersects);
        if (featureClicked) {
          // write in userData the selectedColor
          featureClicked.userData.selectedColor = 'red';
          // and update its style layer
          intersects[0].layer.updateStyle();

          // set contextSelection
          contextSelection.feature = featureClicked;
          contextSelection.layer = intersects[0].layer;
        }
      }

      // update widget displayed info
      this.widgets['3D Tiles'].displayC3DTFeatureInfo(
        contextSelection.feature,
        contextSelection.layer
      );

      view.notifyChange(); // need a redraw of the view
    };

    this.widgets['3D Tiles'].domElement.addEventListener(
      'MODULE_CLASS_UI_REMOVED',
      () => {
        this.widgets['3D Tiles'].displayedBBFeature.visible = false;
        resetContext();
        externalContext.frame3D.domElementWebGL.removeEventListener(
          'click',
          listener3Dtiles
        );
      }
    );

    this.widgets['3D Tiles'].domElement.addEventListener(
      'MODULE_CLASS_UI_APPENDED',
      () => {
        externalContext.frame3D.domElementWebGL.addEventListener(
          'click',
          listener3Dtiles
        );
      }
    );

    // //ADD ITOWNS WIDGETS
    const itownsScale = new Scale(externalContext.frame3D.itownsView, {
      parentElement: this.domElement,
    });

    itownsScale.domElement.id = 'itowns-scale';
    itownsScale.update();
  }

  html() {
    return this.domElement;
  }

  addModuleView(moduleId, moduleClass) {
    const button = document.createElement('button');
    button.classList.add('button-imuv');

    button.innerText = moduleId;
    this.domElement.appendChild(button);

    this.widgets[moduleId] = moduleClass;

    // parent
    moduleClass.parentElement = document.body;

    button.onclick = () => {
      if (
        Array.from(this.domElement.children).includes(moduleClass.domElement)
      ) {
        if (moduleClass.dispose) {
          moduleClass.dispose();
        } else {
          moduleClass.domElement.dispatchEvent(
            new Event('MODULE_CLASS_UI_REMOVED')
          );
          this.domElement.removeChild(moduleClass.domElement);
        }
      } else {
        moduleClass.domElement.dispatchEvent(
          new Event('MODULE_CLASS_UI_APPENDED')
        );
        this.domElement.appendChild(moduleClass.domElement);
      }
    };
  }

  dispose() {
    this.domElement.remove();
  }
}
