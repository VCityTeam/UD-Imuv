/**@format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class Clickable {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;

    this.currentDt = 0;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    const manager = gameView.getInputManager();

    const raycaster = new Game.THREE.Raycaster();

    const renderComp = go.getComponent(Game.Render.TYPE);
    const object = renderComp.getObject3D();

    manager.addMouseInput(gameView.getRootWebGL(), 'click', function (event) {
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
        const lss = go.fetchLocalScripts();
        for (let id in lss) {
          const script = lss[id];
          if (script.onClick) script.onClick(go, localCtx);
        }
      }
    });
  }

  tick() {
    const go = arguments[0];
    const localCtx = arguments[1];

    const renderComp = go.getComponent(Game.Render.TYPE);
    const obj = renderComp.getObject3D();

    this.currentDt += localCtx.getDt();

    const min = 0.8;
    const bounce = (1 - min) * Math.abs(Math.sin(this.currentDt * 0.001)) + min;

    obj.scale.set(bounce, bounce, bounce);
  }
};
