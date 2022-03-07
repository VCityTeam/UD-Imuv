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
    console.log('write ', this.conf);
  }
};
