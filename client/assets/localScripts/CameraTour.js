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

    this.menuTour = null;
  }

  init() {
    const go = arguments[0];
    const localContext = arguments[1];
    const gameView = localContext.getGameView();
    const rootGO = localContext.getRootGameObject();
    const avatarController = rootGO.fetchLocalScripts()['avatar_controller'];
    const camera = localContext.getGameView().getCamera();
    const cameraScript = rootGO.fetchLocalScripts()['camera'];
    const Routine = Game.Components.Routine;
    const _this = this;

    //ui
    const startTour = document.createElement('button');
    startTour.innerHTML = go.name;
    gameView.appendToUI(startTour);

    startTour.onclick = function () {
      if (_this.menuTour) {
        let currentTime = 0;
        let startPos = camera.position.clone();
        let startQuat = camera.quaternion.clone();

        cameraScript.addRoutine(
          new Routine(
            function (dt) {
              const t = cameraScript
                .getFocusCamera()
                .computeTransformTarget(null, 3);

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
              _this.menuTour.dispose();
              _this.menuTour = null;
              avatarController.setAvatarControllerMode(true, localContext);
            }
          )
        );
      } else {
        avatarController.setAvatarControllerMode(false, localContext);
        _this.menuTour = new MenuTour(localContext, _this.conf, go);
        gameView.appendToUI(_this.menuTour.html());
      }
    };
  }
};

class MenuTour {
  constructor(localContext, conf, go) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root-menu-settings');

    const title = document.createElement('h1');
    title.innerHTML = go.name;
    this.rootHtml.appendChild(title);

    //init state camera
    if (conf.camera_transforms.length <= 0) return;

    this.currentIndex = 0;
    this.isTraveling = false;
    this.travelToCurrentIndex(localContext, conf);

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
    previousButton.innerHTML = 'Precedent';
    parentPreviousNext.appendChild(previousButton);

    const nextButton = document.createElement('button');
    nextButton.innerHTML = 'Suivant';
    parentPreviousNext.appendChild(nextButton);

    //cb
    const _this = this;

    previousButton.onclick = function () {
      const oldIndex = _this.currentIndex;
      _this.setCurrentIndex(Math.max(_this.currentIndex - 1, 0));

      if (_this.travelToCurrentIndex(localContext, conf)) {
        slider.value = _this.currentIndex;
      } else {
        _this.setCurrentIndex(oldIndex);
      }
    };

    nextButton.onclick = function () {
      const oldIndex = _this.currentIndex;

      _this.setCurrentIndex(
        Math.min(_this.currentIndex + 1, conf.camera_transforms.length - 1)
      );

      if (_this.travelToCurrentIndex(localContext, conf)) {
        slider.value = _this.currentIndex;
      } else {
        _this.setCurrentIndex(oldIndex);
      }
    };

    slider.onchange = function () {
      const oldIndex = _this.currentIndex;
      _this.setCurrentIndex(slider.value);

      if (!_this.travelToCurrentIndex(localContext, conf)) {
        _this.setCurrentIndex(oldIndex);
      }
    };
  }

  setCurrentIndex(value) {
    this.currentIndex = parseInt(value);
  }

  travelToCurrentIndex(localContext, conf) {
    if (this.isTraveling) {
      console.warn('already traveling');
      return false;
    }

    const rootGO = localContext.getRootGameObject();
    const camera = localContext.getGameView().getCamera();
    const cameraScript = rootGO.fetchLocalScripts()['camera'];
    const Routine = Game.Components.Routine;
    const _this = this;

    let currentTime = 0;
    let startPos = camera.position.clone();
    let startQuat = camera.quaternion.clone();
    const destPos = new Game.THREE.Vector3().fromArray(
      conf.camera_transforms[this.currentIndex].position
    );
    const destQuat = new Game.THREE.Quaternion().fromArray(
      conf.camera_transforms[this.currentIndex].quaternion
    );

    cameraScript.addRoutine(
      new Routine(
        function (dt) {
          _this.isTraveling = true;

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
        }
      )
    );

    return true;
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    this.rootHtml.remove();
  }
}
