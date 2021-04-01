/** @format */

module.exports = class GameManager {
  constructor(conf) {
    this.conf = conf;
  }

  onCollision() {
    console.log('portal collide');
  }
};
