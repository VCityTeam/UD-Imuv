/** @format */

const GameManagerModule = class GameManager {
  constructor(conf, udvShared) {
    this.conf = conf;
    this.udvShared = udvShared;
  }

  load() {
    return new Promise((resolve, reject) => {
      console.log('GameManager load');

      resolve();
    });
  }
};

GameManagerModule.ID = 'gameManager';

module.exports = GameManagerModule;
