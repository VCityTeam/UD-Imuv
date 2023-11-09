import * as itowns from 'itowns';
import * as THREE from 'three';
import { ScriptBase } from '@ud-viz/game_browser';
import { ID } from '../../shared/constant';

const AVATAR_SSE = 10000; // in avatar mode none tiles are being subdivided
const ZEPPELIN_SSE = 100;
const ITOWNS_CONTROLS_SSE = 16;

export class ItownsRefine extends ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

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

    const boundingVolumeBox = new THREE.Box3();

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
      if (!layer.tileset.tiles[node.tileId].children) {
        return false;
      }
      if (layer.tileset.tiles[node.tileId].isTileset) {
        return true;
      }
      const sse = computeNodeSSE(context.camera, node);
      return sse > _this.customSSE;
    }

    this.context.frame3D.itownsView
      .getLayers()
      .filter((el) => el.isC3DTilesLayer)
      .forEach((layer) => {
        layer.update = itowns.process3dTilesNode(
          itowns.$3dTilesCulling,
          $3dTilesSubdivisionControl
        );
      });
  }

  static get ID_SCRIPT() {
    return ID.EXTERNAL_SCRIPT.ITOWNS_REFINE;
  }
}
