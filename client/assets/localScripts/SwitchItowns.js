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

    //buffer DEBUG
    this.itownsCamPos = null;
    this.itownsCamQuat = null;

    this.menuWidgets = null;
    this.menuWidgetsButton = null;
  }

  setWidgetButtonVisible(value) {
    if (value) {
      this.menuWidgetsButton.classList.remove('hidden');
    } else {
      this.menuWidgetsButton.classList.add('hidden');
    }
  }

  //DEBUG
  init() {
    const _this = this;

    const localCtx = arguments[1];

    this.menuWidgets = new MenuWidgets(localCtx);

    const gameView = localCtx.getGameView();
    const camera = gameView.getCamera();
    const manager = gameView.getInputManager();
    const Routine = Game.Components.Routine;

    const rootGO = localCtx.getRootGameObject();
    const cameraScript = rootGO.fetchLocalScripts()['camera'];
    const avatarController = rootGO.fetchLocalScripts()['avatar_controller'];

    //fetch ui script
    let scriptUI = null;
    rootGO.traverse(function (child) {
      const scripts = child.fetchLocalScripts();
      if (scripts && scripts['ui']) {
        scriptUI = scripts['ui'];
        return true;
      }
    });

    //SWITCH CONTROLS
    const view = gameView.getItownsView();
    if (view) {
      this.menuWidgetsButton = document.createElement('button');
      this.menuWidgetsButton.innerHTML = 'Widgets';
      this.menuWidgetsButton.onclick = function () {
        if (cameraScript.hasRoutine()) return; //already routine

        let onZeppelin = false;
        const zeppelinStart = rootGO.findByName('ZeppelinStart');
        if (zeppelinStart) {
          const scriptZeppelinStart =
            zeppelinStart.fetchLocalScripts()['zeppelin_start'];
          onZeppelin = scriptZeppelinStart.getOnZeppelinInteraction();
        }

        if (onZeppelin) return; //cant itowns while zeppelin

        const duration = 2000;
        let currentTime = 0;

        let startPos = camera.position.clone();
        let startQuat = camera.quaternion.clone();

        if (gameView.isItownsRendering()) {
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
                  .computeTransformTarget(null, 3);

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

                _this.menuWidgets.dispose();
              }
            )
          );
        } else {
          //remove avatar controls
          avatarController.setAvatarControllerMode(false, localCtx);
          //restore widget button visibility to permit to close it
          _this.setWidgetButtonVisible(true);

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

                const refine = localCtx.getRootGameObject().fetchLocalScripts()[
                  'itowns_refine'
                ];
                if (refine) refine.itownsControls();
                gameView.appendToUI(_this.menuWidgets.html());
              }
            )
          );
        }
      };
      gameView.appendToUI(this.menuWidgetsButton);
    }
  }
};

class MenuWidgets {
  constructor(localCtx) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root-menu-settings');

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
      'City Objects',
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
    // this.addModuleView("Debug 3DTiles", new udviz.Widgets.Extensions.Debug3DTilesWindow(
    //   localCtx.getGameView().getLayerManager()
    // ))

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
      'geocoding',
      new udviz.Widgets.Extensions.GeocodingView(geocodingService, view)
    );

    //TODO widgets travaux
    //geocoding + camera positioner isVisible not working
    // + bugs throw in console ...

    ////ADD ITOWNS WIDGETS
    // new udviz.itownsWidgets.Scale(localCtx.getGameView().getItownsView(),
    //   { parentElement: this.rootHtml })
  }

  html() {
    return this.rootHtml;
  }

  addModuleView(moduleId, moduleClass, options = {}) {
    const button = document.createElement('button');
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
    for (let id in this.widgets) {
      this.widgets[id].disable();
    }
  }
}
