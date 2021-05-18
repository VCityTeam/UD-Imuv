/** @format */

module.exports = class Video {
  constructor(conf) {
    this.conf = conf;
  }

  tick() {
    const go = arguments[0];
    const r = go.getComponent('Render');
    r.tick();
  }
};
