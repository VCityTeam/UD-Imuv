/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class Visible {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
    Game = udviz.Game;
  }

  init() {
    this.updateVisible(arguments[0]);
  }

  updateVisible(go) {
    const renderComp = go.getComponent(Game.Render.TYPE);
    renderComp.getObject3D().visible = this.conf.visible;
  }

  update() {
    this.updateVisible(arguments[0]);
  }
};
