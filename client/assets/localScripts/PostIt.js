/**@format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class PostIt {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;

    this.htmlPostIt = null;
  }

  init() {
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();

    const raycaster = new Game.THREE.Raycaster();
    const object = arguments[0].getObject3D();

    const _this = this;

    manager.addMouseInput(
      gameView.getRootWebGL(),
      'dblclick',
      function (event) {
        if (_this.htmlPostIt) {
          _this.htmlPostIt.remove();
          _this.htmlPostIt = null;
          return;
        }
        const mouse = new Game.THREE.Vector2(
          -1 +
            (2 * event.offsetX) /
              (gameView.getRootWebGL().clientWidth -
                parseInt(gameView.getRootWebGL().offsetLeft)),
          1 -
            (2 * event.offsetY) /
              (gameView.getRootWebGL().clientHeight -
                parseInt(gameView.getRootWebGL().offsetTop))
        );

        raycaster.setFromCamera(mouse, gameView.getCamera());

        const i = raycaster.intersectObject(object, true);

        if (i.length) {
          _this.htmlPostIt = document.createElement('div');
          _this.htmlPostIt.classList.add('post-it');
          _this.htmlPostIt.innerHTML = _this.conf.content;
          gameView.appendToUI(_this.htmlPostIt);
        }
      }
    );
  }
};
