/** @format */

import { THREE } from "ud-viz";

export class MeshEditorModel {
  constructor(gameObjectModel) {
    this.gameObjectModel = gameObjectModel;

    this.hiddenMeshes = [];
    this.dictMeshParent = {};
    this.currentMesh = null;
    this.onHoverMesh = null;

  }

  init() {}

  addIntersectedObjectInHiddenMeshes() {
    const _this = this;
    if (!_this.currentMesh) return;
    _this.hiddenMeshes.push(_this.currentMesh);
    _this.dictMeshParent[_this.currentMesh.uuid] = _this.currentMesh.parent;
    _this.onHoverMesh.parent.remove(_this.onHoverMesh);
    _this.currentMesh.parent.remove(_this.currentMesh);
    _this.currentMesh = null;
  }

  setCurrentMesh(mesh) {
    const _this = this;
    if (mesh) {
      if (_this.currentMesh != mesh && _this.onHoverMesh != mesh) {
        if (_this.currentMesh) {
          _this.currentMesh.parent.remove(_this.onHoverMesh);
          _this.showObject(_this.currentMesh);
        }
        _this.currentMesh = mesh;
        _this.onHoverMesh = _this.currentMesh.clone();
        _this.onHoverMesh.material = _this.onHoverMesh.material.clone();
        _this.onHoverMesh.material.emissive.r =1.0;
        _this.currentMesh.parent.add(_this.onHoverMesh);
        _this.hideObject(_this.currentMesh);
      }
    } else {
      if (_this.currentMesh) {
        _this.currentMesh.parent.remove(_this.onHoverMesh);
        _this.showObject(_this.currentMesh);
      }
      _this.currentMesh = null;
    }
  }
  getNameCurrentMesh() {
    if (this.currentMesh) {
      return this.currentMesh.name;
    } else {
      return'No Current Mesh';
    }
  }

  getHiddenMeshes() {
    return this.hiddenMeshes;
  }

  showObject(object) {
    object.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.visible = true;
      }
    });
  }

  hideObject(object) {
    object.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        child.visible = false;
      }
    });
  }

}
