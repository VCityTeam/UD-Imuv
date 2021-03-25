/** @format */

const GameManagerModule = class GameManager {
  constructor(conf, udvGameShared) {
    this.conf = conf;
    this.udvGameShared = udvGameShared;
  }

  load() {
    return new Promise((resolve, reject) => {
      console.log('GameManager load');

      resolve();
    });
  }
};

module.exports = GameManagerModule;
