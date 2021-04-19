/** @format */

import { THREE, Game } from 'ud-viz';

export class GOEditorModel {
  constructor(assetsManager) {
    this.assetsManager = assetsManager;

    // Setup View like itowns (same referential)
    THREE.Object3D.DefaultUp.set(0, 0, 1);
    this.scene = new THREE.Scene();

    //dynamic
    this.gameObject = null;
    this.boundingBox = null;
    this.boxHelper = null;
    this.gizmo = null;
  }

  getScene() {
    return this.scene;
  }

  initScene() {
    Game.Components.THREEUtils.addLights(this.scene);
  }

  getBoundingBox() {
    return this.boundingBox;
  }

  getGameObject() {
    return this.gameObject;
  }

  setGizmoVisibility(value) {
    if (!this.gizmo) return;
    this.gizmo.visible = value;
  }

  setGameObject(g) {
    if (this.gameObject) {
      this.scene.remove(this.gameObject.fetchObject3D());
      this.scene.remove(this.gizmo);
      this.scene.remove(this.boxHelper);
    }

    this.gameObject = g;
    if (g) {
      const object = g.fetchObject3D();

      if (object) {
        this.boundingBox = new THREE.Box3().setFromObject(object);
        const scale =
          this.boundingBox.max.distanceTo(this.boundingBox.min) / 40;
        this.gizmo = this.assetsManager.createModel('gizmo');
        this.gizmo.scale.set(scale, scale, scale);

        //add to scene
        this.scene.add(this.gizmo); //show origin
        this.scene.add(object);
        this.boxHelper = new THREE.BoxHelper(object);
        this.scene.add(this.boxHelper);
      }
    }
  }
}
