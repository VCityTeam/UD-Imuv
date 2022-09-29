/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const gameType = require('ud-viz/src/Game/Game');
/** @type {gameType} */
let Game = null;

const AVATAR_SSE = 400;
const ZEPPELIN_SSE = 100;
const ITOWNS_CONTROLS_SSE = 16;

module.exports = class ItownsRefine {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udvizBundle.Game;

    this.customSSE = AVATAR_SSE;
  }

  avatar() {
    this.customSSE = AVATAR_SSE;
  }

  zeppelin() {
    this.customSSE = ZEPPELIN_SSE;
  }

  itownsControls() {
    this.customSSE = ITOWNS_CONTROLS_SSE;
  }

  init() {
    const _this = this;

    const boundingVolumeBox = new udviz.THREE.Box3();

    function computeNodeSSE(camera, node) {
      node.distance = 0;
      boundingVolumeBox.copy(node.boundingVolume.box);
      boundingVolumeBox.applyMatrix4(node.matrixWorld);
      node.distance = boundingVolumeBox.distanceToPoint(
        camera.camera3D.position
      );
      if (node.distance === 0) {
        // This test is needed in case geometricError = distance = 0
        return Infinity;
      }
      return camera._preSSE * (node.geometricError / node.distance);
    }

    function $3dTilesSubdivisionControl(context, layer, node) {
      if (layer.tileset.tiles[node.tileId].children === undefined) {
        return false;
      }
      if (layer.tileset.tiles[node.tileId].isTileset) {
        return true;
      }
      const sse = computeNodeSSE(context.camera, node);
      return sse > _this.customSSE;
    }

    const localContext = arguments[1];
    const layerManager = localContext.getGameView().getLayerManager();
    layerManager.tilesManagers.forEach(function (tileManager) {
      tileManager.layer.update = udviz.itowns.process3dTilesNode(
        udviz.itowns.$3dTilesCulling,
        $3dTilesSubdivisionControl
      );
    });
  }
};
