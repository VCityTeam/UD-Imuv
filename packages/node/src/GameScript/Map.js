const { GameScript } = require('@ud-imuv/shared');

module.exports = class Map extends GameScript.AbstractMap {
  load() {
    console.log('MAP');
  }
};
