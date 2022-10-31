/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const gameType = require('ud-viz/src/Game/Game');
/** @type {gameType} */
let Game = null;

module.exports = class CityMockUp {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udvizBundle.Game;
  }

  init() {
    const go = arguments[0];
    const localContext = arguments[1];

    if (localContext.getGameView().getUserData('isEditorGameView')) {
      //add a plane 1,1 to well adjust the go transform then the mockup has to be 1,1 bounding box x,y
      const geometry = new Game.THREE.PlaneGeometry(1, 1);
      const material = new Game.THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: Game.THREE.DoubleSide,
      });
      const plane = new Game.THREE.Mesh(geometry, material);

      const renderComp = go.getComponent(Game.Render.TYPE);
      renderComp.addObject3D(plane);
    }

    //add tool
    
  }
};
