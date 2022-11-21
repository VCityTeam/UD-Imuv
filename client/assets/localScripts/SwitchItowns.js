/**@format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;
const itownsType = require('itowns');
/** @type {itownsType} */
let itowns = null;

module.exports = class SwitchItowns {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;
    itowns = udviz.itowns;

    //buffer
    this.itownsCamPos = null;
    this.itownsCamQuat = null;
  }

  init() {
    const _this = this;

    const localCtx = arguments[1];

    const gameView = localCtx.getGameView();
    const camera = gameView.getCamera();
    const manager = gameView.getInputManager();
    const Routine = Game.Components.Routine;

    const cameraScript = localCtx.findLocalScriptWithID('camera');
    const avatarController =
      localCtx.findLocalScriptWithID('avatar_controller');

    //fetch ui script
    const scriptUI = localCtx.findLocalScriptWithID('ui');

    //SWITCH CONTROLS
    const view = gameView.getItownsView();
    if (view) {
      const promiseFunction = function (resolve, reject, onClose) {
        if (cameraScript.hasRoutine()) {
          resolve(false); //already routine
          return;
        }

        //check if city avatar
        const avatarGO = localCtx
          .getRootGameObject()
          .find(localCtx.getGameView().getUserData('avatarUUID'));
        if (avatarGO.findByName('city_avatar')) {
          resolve(false); //cant itowns while city avatar
          return;
        }

        const duration = 2000;
        let currentTime = 0;

        const startPos = camera.position.clone();
        const startQuat = camera.quaternion.clone();

        if (onClose) {
          //record
          _this.itownsCamPos.set(
            camera.position.x,
            camera.position.y,
            camera.position.z
          );
          _this.itownsCamQuat.setFromEuler(camera.rotation);

          gameView.setItownsRendering(false);

          cameraScript.addRoutine(
            new Routine(
              function (dt) {
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
                avatarController.setAvatarControllerMode(true, localCtx);

                resolve(true);
              }
            )
          );
        } else {
          //remove avatar controls
          avatarController.setAvatarControllerMode(false, localCtx);

          if (!_this.itownsCamPos && !_this.itownsCamQuat) {
            //first time camera in sky

            const currentPosition = new Game.THREE.Vector3().copy(
              camera.position
            );

            //200 meters up
            const endPosition = new Game.THREE.Vector3(0, 0, 200).add(
              currentPosition
            );

            //look down
            const endQuaternion = new Game.THREE.Quaternion().setFromEuler(
              new Game.THREE.Euler(0.01, 0, 0)
            );

            _this.itownsCamPos = endPosition;
            _this.itownsCamQuat = endQuaternion;
          }

          cameraScript.addRoutine(
            new Routine(
              function (dt) {
                currentTime += dt;
                let ratio = currentTime / duration;
                ratio = Math.min(Math.max(0, ratio), 1);

                const p = _this.itownsCamPos.clone().lerp(startPos, 1 - ratio);
                const q = _this.itownsCamQuat
                  .clone()
                  .slerp(startQuat, 1 - ratio);

                camera.position.copy(p);
                camera.quaternion.copy(q);

                camera.updateProjectionMatrix();

                return ratio >= 1;
              },
              function () {
                manager.setPointerLock(false);

                gameView.setItownsRendering(true);

                //tweak zoom factor
                view.controls.zoomInFactor = scriptUI
                  .getMenuSettings()
                  .getZoomFactorValue();
                view.controls.zoomOutFactor =
                  1 / scriptUI.getMenuSettings().getZoomFactorValue();

                gameView.getItownsView().notifyChange(gameView.getCamera());

                const refine = localCtx.findLocalScriptWithID('itowns_refine');
                if (refine) refine.itownsControls();

                resolve(true);
              }
            )
          );
        }
      };

      const menuItowns = new MenuItowns(localCtx);

      scriptUI.addTool(
        './assets/img/ui/icon_town_white.png',
        'Vue itowns',
        promiseFunction,
        menuItowns
      );
    }
  }
};

class MenuItowns {
  constructor(localCtx) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_menu_itowns');
    this.rootHtml.classList.add('contextual_menu');

    const title = document.createElement('h1');
    title.innerHTML = 'Widgets';
    this.rootHtml.appendChild(title);

    //buffer
    this.widgets = {};

    ////ADD UD-VIZ WIDGETS
    const view = localCtx.getGameView().getItownsView();

    //layerchoice
    this.addModuleView(
      'Layer Choice',
      new udviz.Widgets.LayerChoice(localCtx.getGameView().getLayerManager())
    );

    //cityObjects
    this.addModuleView(
      'City Object',
      new udviz.Widgets.CityObjectModule(
        localCtx.getGameView().getLayerManager(),
        {
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
        }
      ).view
    );

    //cameraPositionner
    this.addModuleView(
      'Camera Positioner',
      new udviz.Widgets.CameraPositionerView(view)
    );

    //debug3DTiles
    this.addModuleView(
      'Debug 3DTiles',
      new udviz.Widgets.Debug3DTilesWindow(
        localCtx.getGameView().getLayerManager()
      )
    );

    //geocoding
    const requestService = new udviz.Components.RequestService();
    const geocodingService = new udviz.Widgets.Extensions.GeocodingService(
      requestService,
      localCtx.getGameView().getExtent(),
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
      new udviz.Widgets.Extensions.GeocodingView(geocodingService, view)
    );

    ////ADD ITOWNS WIDGETS
    const itownsScale = new udviz.itownsWidgets.Scale(
      localCtx.getGameView().getItownsView(),
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

  addModuleView(moduleId, moduleClass, options = {}) {
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
