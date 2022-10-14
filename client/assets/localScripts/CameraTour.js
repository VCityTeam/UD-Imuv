/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

const TRAVELING_DURATION = 1500;

module.exports = class CameraTour {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;
  }

  init() {
    const go = arguments[0];
    const localContext = arguments[1];

    const avatarController =
      localContext.findLocalScriptWithID('avatar_controller');
    const camera = localContext.getGameView().getCamera();
    const cameraScript = localContext.findLocalScriptWithID('camera');
    const Routine = Game.Components.Routine;
    const _this = this;

    //ui
    const scriptUI = localContext.findLocalScriptWithID('ui');
    const menuTour = new MenuTour(localContext, this.conf, go);

    scriptUI.addTool(
      './assets/img/ui/icon_town_white.png',
      'Tour Images',
      function (resolve, reject, onClose) {
        if (cameraScript.hasRoutine()) {
          resolve(false); //cant open/close menu while camera routine
          return;
        }

        if (onClose) {
          //menu is open close it
          let currentTime = 0;
          const startPos = camera.position.clone();
          const startQuat = camera.quaternion.clone();

          cameraScript.addRoutine(
            new Routine(
              function (dt) {
                const t = cameraScript
                  .getFocusCamera()
                  .computeTransformTarget(null, 5);

                currentTime += dt;
                let ratio = currentTime / TRAVELING_DURATION;
                ratio = Math.min(Math.max(0, ratio), 1);

                const p = t.position.lerp(startPos, 1 - ratio);
                const q = t.quaternion.slerp(startQuat, 1 - ratio);

                camera.position.copy(p);
                camera.quaternion.copy(q);

                camera.updateProjectionMatrix();

                return ratio >= 1;
              },
              function () {
                avatarController.setAvatarControllerMode(true, localContext);
                resolve(true); // success
              }
            )
          );
        } else {
          avatarController.setAvatarControllerMode(false, localContext);
          menuTour
            .travelToCurrentIndex(localContext, _this.conf)
            .then(function (success) {
              resolve(success);
            });
        }
      },
      menuTour
    );
  }
};

class MenuTour {
  constructor(localContext, conf, go) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('contextual_menu');

    const title = document.createElement('h1');
    title.innerHTML = go.name;
    this.rootHtml.appendChild(title);

    //init state camera
    if (conf.camera_transforms.length <= 0) return;

    this.currentIndex = 0;
    this.isTraveling = false;

    //slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = conf.camera_transforms.length - 1;
    slider.step = 1;
    slider.value = this.currentIndex;
    this.rootHtml.appendChild(slider);

    //next previous
    const parentPreviousNext = document.createElement('div');
    this.rootHtml.appendChild(parentPreviousNext);

    const previousButton = document.createElement('button');
    previousButton.classList.add('button-imuv');
    previousButton.innerHTML = '<';
    parentPreviousNext.appendChild(previousButton);

    const nextButton = document.createElement('button');
    nextButton.classList.add('button-imuv');
    nextButton.innerHTML = '>';
    parentPreviousNext.appendChild(nextButton);

    //cb
    const _this = this;

    previousButton.onclick = function () {
      const oldIndex = _this.currentIndex;
      _this.setCurrentIndex(Math.max(_this.currentIndex - 1, 0));

      _this.travelToCurrentIndex(localContext, conf).then(function (success) {
        if (success) {
          slider.value = _this.currentIndex;
        } else {
          _this.setCurrentIndex(oldIndex);
        }
      });
    };

    nextButton.onclick = function () {
      const oldIndex = _this.currentIndex;

      _this.setCurrentIndex(
        Math.min(_this.currentIndex + 1, conf.camera_transforms.length - 1)
      );

      _this.travelToCurrentIndex(localContext, conf).then(function (success) {
        if (success) {
          slider.value = _this.currentIndex;
        } else {
          _this.setCurrentIndex(oldIndex);
        }
      });
    };

    slider.onchange = function () {
      const oldIndex = _this.currentIndex;
      _this.setCurrentIndex(slider.value);

      _this.travelToCurrentIndex(localContext, conf).then(function (success) {
        if (!success) {
          _this.setCurrentIndex(oldIndex);
        }
      });
    };
  }

  setCurrentIndex(value) {
    this.currentIndex = parseInt(value);
  }

  travelToCurrentIndex(localContext, conf) {
    return new Promise((resolve) => {
      if (this.isTraveling) {
        console.warn('already traveling');
        resolve(false);
        return;
      }

      this.isTraveling = true;

      const camera = localContext.getGameView().getCamera();
      const cameraScript = localContext.findLocalScriptWithID('camera');
      const Routine = Game.Components.Routine;
      const _this = this;

      let currentTime = 0;
      const startPos = camera.position.clone();
      const startQuat = camera.quaternion.clone();
      const destPos = new Game.THREE.Vector3().fromArray(
        conf.camera_transforms[this.currentIndex].position
      );
      const destQuat = new Game.THREE.Quaternion().fromArray(
        conf.camera_transforms[this.currentIndex].quaternion
      );

      cameraScript.addRoutine(
        new Routine(
          function (dt) {
            currentTime += dt;
            let ratio = currentTime / TRAVELING_DURATION;
            ratio = Math.min(Math.max(0, ratio), 1);

            const p = destPos.clone().lerp(startPos, 1 - ratio);
            const q = destQuat.clone().slerp(startQuat, 1 - ratio);

            camera.position.copy(p);
            camera.quaternion.copy(q);

            camera.updateProjectionMatrix();

            return ratio >= 1;
          },
          function () {
            _this.isTraveling = false;
            resolve(true);
          }
        )
      );
    });
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    this.rootHtml.remove();
  }
}
