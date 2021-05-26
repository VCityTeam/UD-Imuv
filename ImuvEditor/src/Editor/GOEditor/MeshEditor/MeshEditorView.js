/** @format */

import { createTileGroupsFromBatchIDs } from "ud-viz/src/Components/3DTiles/3DTilesUtils";
import { TemporalGraphWindow } from "ud-viz/src/Widgets/Temporal/View/TemporalGraphWindow";
import { MeshEditorModel } from "./MeshEditorModel";
import { THREE } from "ud-viz";

export class MeshEditorView {
  constructor(goView) {
    //parent
    this.goView = goView;
    //root UI
    this.rootHtml = document.createElement("div");
    this.rootHtml.classList.add("root_MeshEditorView");

    //MeshEditor Model
    if (!goView.model) throw new Error("no model");
    this.model = new MeshEditorModel(goView.model);

    //raycaster
    this.raycaster = new THREE.Raycaster();

    //html
    this.hiddenMeshesList = null;
    this.selectedObject = null;

    this.intersects = null;
    this.INTERSECTED = null;
    this.OUTLINE_INTERSECTED = null;
    this.outlineMaterial = new THREE.MeshBasicMaterial({
      color: "red",
    });
    this.init();
  }

  html() {
    return this.rootHtml;
  }

  init() {
    this.model.init();

    this.initUI();

    this.initCallbacks();
  }

  initUI() {
    //Selected Object
    const labelSelectedObjected = document.createElement("div");
    labelSelectedObjected.innerHTML = "Selected Object";
    this.rootHtml.appendChild(labelSelectedObjected);
    this.selectedObject = labelSelectedObjected;

    //hidden meshes preview
    const labelHiddenMeshesList = document.createElement("div");
    labelHiddenMeshesList.innerHTML = "Hidden Meshes";
    this.rootHtml.appendChild(labelHiddenMeshesList);
    const hiddenMeshesList = document.createElement("ul");
    this.rootHtml.appendChild(hiddenMeshesList);
    this.hiddenMeshesList = hiddenMeshesList;

    this.updateUI();
  }

  updateUI() {
    //update hidden meshes list
    const list = this.hiddenMeshesList;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    this.model.getHiddenMeshes().forEach(function (mesh) {
      list.appendChild(this.meshHTML(mesh));
    });
  }

  dispose() {
    this.rootHtml.parentElement.removeChild(this.rootHtml);
  }

  initCallbacks() {
    const _this = this;
    const canvas = _this.goView.getRenderer().domElement;

    const getObjectOnHover = function (event) {
      //1. sets the mouse position with a coordinate system where the center of the screen is the origin
      const mouse = new THREE.Vector2(
        -1 + (2 * event.offsetX) / canvas.clientWidth,
        1 - (2 * event.offsetY) / canvas.clientHeight
      );
      //console.log("mouse", mouse);

      //2. set the picking ray from the camera position and mouse coordinates
      const camera = _this.goView.getCamera();
      const oldNear = camera.near;
      camera.near = 0;
      _this.raycaster.setFromCamera(mouse, camera);
      camera.near = oldNear;

      //3. compute intersections
      _this.intersects = _this.raycaster.intersectObjects(
        _this.goView.getModel().getGameObject().fetchObject3D().children,
        true
      );
      const intersects = _this.intersects;
      if (intersects.length > 0) {
        if (
          _this.INTERSECTED != intersects[0].object &&
          _this.OUTLINE_INTERSECTED != intersects[0].object
        ) {
          if (_this.INTERSECTED) {
            _this.INTERSECTED.parent.remove(_this.OUTLINE_INTERSECTED);
            _this.showObject(_this.INTERSECTED);
          }
          _this.INTERSECTED = intersects[0].object;
          _this.selectedObject.innerHTML = "Name : " + _this.INTERSECTED.name;
          _this.OUTLINE_INTERSECTED = _this.INTERSECTED.clone();
          _this.OUTLINE_INTERSECTED.material = _this.outlineMaterial;
          _this.INTERSECTED.parent.add(_this.OUTLINE_INTERSECTED);
          _this.hideObject(_this.INTERSECTED);
        }
      } else {
        if (_this.INTERSECTED) {
          _this.INTERSECTED.parent.remove(_this.OUTLINE_INTERSECTED);
          _this.showObject(_this.INTERSECTED);
        }

        _this.INTERSECTED = null;
        _this.selectedObject.innerHTML = "NULL";
      }
    };

    canvas.onpointermove = function (event) {
      getObjectOnHover(event);
    };
    canvas.onpointerdown = function (event) {
      //if (_this.intersects.length > 0) console.log(_this.intersects);
    };
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
