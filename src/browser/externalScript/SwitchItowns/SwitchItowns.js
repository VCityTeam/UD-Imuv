import * as THREE from 'three';
// eslint-disable-next-line no-unused-vars
import { ScriptBase, Context } from '@ud-viz/game_browser';
import { Scale } from 'itowns/widgets';
import { C3DTiles } from '@ud-viz/widget_3d_tiles';

import { ID } from '../../shared/constant';
import { UI } from '../UI';
import { AvatarController } from '../AvatarController';
import { CameraManager } from '../CameraManager';
import { ItownsRefine } from '../ItownsRefine';

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
              this.context.frame3D.domElement.addEventListener(
                'click',
                menuItowns.widget3DTilesListener
              );

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
   * @param {Context} context
   */
  constructor(context) {
    /** @type {} */
    this.context = context;

    this.domElement = document.createElement('div');
    this.domElement.classList.add('root_menu_itowns');
    this.domElement.classList.add('contextual_menu');

    const title = document.createElement('h1');
    title.innerHTML = 'Widgets';
    this.domElement.appendChild(title);

    // ADD UD-VIZ WIDGETS
    const widget3DTiles = new C3DTiles(context.frame3D.itownsView, {
      parentElement: this.domElement,
    });
    const contextSelection = {
      feature: null,
      layer: null,
    };
    this.widget3DTilesListener = (event) => {
      if (contextSelection.feature) {
        // reset feature userData
        contextSelection.feature.userData.selectedColor = null;
        // and update style of its layer
        contextSelection.layer.updateStyle([contextSelection.feature.tileId]);
        // reset context selection
        contextSelection.feature = null;
        contextSelection.layer = null;
      }

      // get intersects based on the click event
      const intersects = context.frame3D.itownsView.pickObjectsAt(
        event,
        0,
        context.frame3D.itownsView
          .getLayers()
          .filter((el) => el.isC3DTilesLayer)
      );

      if (intersects.length) {
        // get featureClicked
        const featureClicked =
          intersects[0].layer.getC3DTileFeatureFromIntersectsArray(intersects);
        if (featureClicked) {
          // write in userData the selectedColor
          featureClicked.userData.selectedColor = 'blue';
          // and update its style layer
          intersects[0].layer.updateStyle();

          // set contextSelection
          contextSelection.feature = featureClicked;
          contextSelection.layer = intersects[0].layer;
        }
      }
      widget3DTiles.displayC3DTFeatureInfo(
        contextSelection.feature,
        contextSelection.layer
      );
      context.frame3D.itownsView.notifyChange(); // need a redraw of the context.frame3D.itownsView
    };

    // layer choice
    const widgetLayerChoice = new LayerChoice

    // ADD ITOWNS WIDGETS
    const itownsScale = new Scale(context.frame3D.itownsView, {
      parentElement: this.domElement,
    });

    itownsScale.domElement.id = 'itowns-scale';
    itownsScale.update();
  }

  // TODO : remove this function
  html() {
    return this.domElement;
  }

  dispose() {
    this.domElement.remove();
    this.context.frame3D.domElement.removeEventListener(
      'click',
      this.widget3DTilesListener
    );
  }
}
