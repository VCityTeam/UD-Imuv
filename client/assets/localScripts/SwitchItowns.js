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

    const gameView = localCtx.getGameView();
    const camera = gameView.getCamera();
    const manager = gameView.getInputManager();
    const Routine = Game.Components.Routine;

    const rootGO = localCtx.getRootGameObject();
    const cameraScript = rootGO.fetchLocalScripts()['camera'];
    const avatarController = rootGO.fetchLocalScripts()['avatar_controller'];

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

        if (view.controls) {
          //record
          _this.itownsCamPos.set(
            camera.position.x,
            camera.position.y,
            camera.position.z
          );
          _this.itownsCamQuat.setFromEuler(camera.rotation);

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
                view.controls.dispose();
                view.controls = null;
                avatarController.setAvatarControllerMode(true, localCtx);

                _this.menuWidgets.dispose();
                _this.menuWidgets = null;
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

                //creating controls like put it in _this.view.controls
                const c = new itowns.PlanarControls(view, {
                  handleCollision: false,
                  focusOnMouseOver: false, //TODO itowns bug not working
                  focusOnMouseClick: false,
                  zoomFactor: 0.9, //TODO working ?
                });

                _this.menuWidgets = new MenuWidgets(localCtx);

                const refine = localCtx.getRootGameObject().fetchLocalScripts()[
                  'itowns_refine'
                ];
                if (refine) refine.itownsControls();
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
    localCtx.getGameView().appendToUI(this.rootHtml);

    const title = document.createElement('h1');
    title.innerHTML = 'Widgets';
    this.rootHtml.appendChild(title);

    //buffer
    this.activeWidgets = {};

    //scope
    const _this = this;

    ////ADD WIDGETS

    //layerchoice
    const idLayerChoice = 'Layer Choice';
    const layerchoiceButton = document.createElement('button');
    layerchoiceButton.innerHTML = idLayerChoice;
    this.rootHtml.appendChild(layerchoiceButton);
    layerchoiceButton.onclick = function () {
      if (_this.activeWidgets[idLayerChoice]) {
        _this.activeWidgets[idLayerChoice].disable();
        delete _this.activeWidgets[idLayerChoice];
      } else {
        _this.activeWidgets[idLayerChoice] = new udviz.Widgets.LayerChoice(
          localCtx.getGameView().getLayerManager()
        );
        _this.activeWidgets[idLayerChoice].appendTo(document.body);
      }
    };

    //slideShow
    const idslideShow = 'Slide show';
    const slideShowButton = document.createElement('button');
    slideShowButton.innerHTML = idslideShow;
    this.rootHtml.appendChild(slideShowButton);
    slideShowButton.onclick = function () {
      if (_this.activeWidgets[idslideShow]) {
        _this.activeWidgets[idslideShow].disable();
        delete _this.activeWidgets[idslideShow];
      } else {
        _this.activeWidgets[idslideShow] = new udviz.Widgets.SlideShow(
          {
            view: localCtx.getGameView().getItownsView(),
            extent: localCtx.getGameView().getExtent(),
            update3DView: function () {},
          },
          localCtx.getGameView().getInputManager()
        );
        _this.activeWidgets[idslideShow].appendTo(document.body);
      }
    };

    //cityObjects TODO not working
    // const idcityObjects = 'City Objects';
    // const cityObjectsButton = document.createElement('button');
    // cityObjectsButton.innerHTML = idcityObjects;
    // this.rootHtml.appendChild(cityObjectsButton);
    // cityObjectsButton.onclick = function () {
    //   if (_this.activeWidgets[idcityObjects]) {
    //     _this.activeWidgets[idcityObjects].view.disable();
    //     delete _this.activeWidgets[idcityObjects];
    //   } else {
    //     _this.activeWidgets[idcityObjects] = new udviz.Widgets.CityObjectModule(
    //       localCtx.getGameView().getLayerManager(),
    //       {
    //         cityObjects: {
    //           styles: {
    //             layerDefault: {
    //               materialProps: {
    //                 color: '#ffa14f',
    //               },
    //             },
    //             selection: {
    //               materialProps: {
    //                 color: '#13ddef',
    //               },
    //             },
    //             linkedWithDisplayedDocument: {
    //               materialProps: {
    //                 color: '#4c5af7',
    //               },
    //             },
    //           },
    //         },
    //       }
    //     );
    //     _this.activeWidgets[idcityObjects].view.appendTo(document.body);
    //   }
    // };
  }

  dispose() {
    this.rootHtml.remove();

    //remove active widgets
    for (let id in this.activeWidgets) {
      this.activeWidgets[id].disable();
    }
  }
}
