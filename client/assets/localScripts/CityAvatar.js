/**@format */

const udvizType = require('ud-viz');
const { Command } = require('ud-viz/src/Game/Game');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;

module.exports = class CityAvatar {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;

    this.raycaster = new udviz.THREE.Raycaster();
  }

  init() {
    const localContext = arguments[1];

    //Input manager of the game
    const inputManager = localContext.getGameView().getInputManager();

    //FORWARD
    inputManager.addKeyCommand(
      Game.Command.TYPE.MOVE_FORWARD,
      ['z', 'ArrowUp'],
      function () {
        return new Game.Command({ type: Game.Command.TYPE.MOVE_FORWARD });
      }
    );

    //BACKWARD
    inputManager.addKeyCommand(
      Game.Command.TYPE.MOVE_BACKWARD,
      ['s', 'ArrowDown'],
      function () {
        return new Game.Command({ type: Game.Command.TYPE.MOVE_BACKWARD });
      }
    );

    //LEFT
    inputManager.addKeyCommand(
      Game.Command.TYPE.MOVE_LEFT,
      ['q', 'ArrowLeft'],
      function () {
        return new Game.Command({ type: Game.Command.TYPE.MOVE_LEFT });
      }
    );

    //RIGHT
    inputManager.addKeyCommand(
      Game.Command.TYPE.MOVE_RIGHT,
      ['d', 'ArrowRight'],
      function () {
        return new Game.Command({ type: Game.Command.TYPE.MOVE_RIGHT });
      }
    );
  }

  tick() {
    //the gameobject parent of this script
    const go = arguments[0];

    //a context containing all data to script clientside script
    const localContext = arguments[1];

    const manager = localContext.getGameView().getLayerManager();
    const ground = [];

    const addObjectToGround = function (nameLayer) {
      if (!manager) return;
      let layerManager = null;
      for (let index = 0; index < manager.tilesManagers.length; index++) {
        const element = manager.tilesManagers[index];
        if (element.layer.id == nameLayer) {
          layerManager = element;
          break;
        }
      }

      if (!layerManager) throw new Error('no ', nameLayer);

      layerManager.tiles.forEach(function (t) {
        const obj = t.getObject3D();
        if (obj) ground.push(obj);
      });
    };

    addObjectToGround('3d-tiles-layer-relief');
    addObjectToGround('3d-tiles-layer-road');

    const zParent = go.parent.getPosition().z;

    const pos = go.computeWorldTransform().position;
    const ref = localContext.getGameView().getObject3D().position;
    const zOffset = 400;

    this.raycaster.ray.origin = new udviz.THREE.Vector3(
      pos.x,
      pos.y,
      zOffset
    ).add(ref);
    this.raycaster.ray.direction = new udviz.THREE.Vector3(0, 0, -1);

    let z = 0;
    for (let index = 0; index < ground.length; index++) {
      const element = ground[index];
      const intersects = this.raycaster.intersectObjects([element], true);

      if (intersects.length) {
        const i = intersects[0];
        z = -i.distance;
      }
    }

    const userID = localContext.getGameView().getUserData('userID');
    const websocketService = localContext.getWebSocketService();
    websocketService.emit(
      Game.Components.Constants.WEBSOCKET.MSG_TYPES.COMMANDS,
      [
        {
          type: 'z_update',
          gameObjectUUID: go.getUUID(),
          userID: userID,
          data: z - zParent + zOffset,
        },
      ]
    );
  }
};
