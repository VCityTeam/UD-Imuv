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
  }

  init() {
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();

    const raycaster = new Game.THREE.Raycaster();
    const objectStatic = this.fetchStaticObject.call(this, arguments[0]);

    //toggle post it mode
    const postitButton = document.createElement('button');
    postitButton.innerHTML = 'Post-it';
    gameView.appendToUI(postitButton);
    let postitEnable = false;
    postitButton.onclick = function () {
      postitEnable = !postitEnable;
    };

    manager.addMouseInput(
      gameView.getRootWebGL(),
      'dblclick',
      function (event) {
        if (!postitEnable) return;

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

        const i = raycaster.intersectObject(objectStatic, true);

        if (i.length) {
          const closestI = i[0];
          const point = closestI.point;
          const normal = closestI.face.normal;

          const message = prompt();

          console.log(point, normal, message);
        }
      }
    );
  }

  fetchStaticObject(go) {
    const scriptStaticObject = go.fetchLocalScripts()['static_object'];
    return scriptStaticObject.getObject();
  }

  tick() {}
};
