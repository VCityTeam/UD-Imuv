/**@format */

module.exports = class DefaultInteraction {
  constructor() {}

  init() {}

  onEnter() {
    console.log('onEnter');
  }

  onColliding() {
    console.log('onColliding');
  }

  onLeave() {
    console.log('onLeave');
  }

  interaction() {
    console.log('interaction');
  }
};
