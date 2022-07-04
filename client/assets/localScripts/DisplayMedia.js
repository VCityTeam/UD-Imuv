/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;

module.exports = class DisplayMedia {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
  }

  onClick() {
    console.log('display media');
  }
};
