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
      manager.addKeyInput('a', 'keydown', function () {
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

                view.notifyChange(); //trigger camera event

                return ratio >= 1;
              },
              function () {
                view.controls.dispose();
                view.controls = null;
                avatarController.setAvatarControllerMode(true, localCtx);
              }
            )
          );
        } else {
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
            const endQuaternion = new Game.THREE.Quaternion();

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

                view.notifyChange(); //trigger camera event

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

                avatarController.setAvatarControllerMode(false, localCtx);
              }
            )
          );
        }
      });
    }
  }
};
