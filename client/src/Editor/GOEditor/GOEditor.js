/** @format */

import './GOEditor.css';
import GameObjectModule from 'ud-viz/src/Game/GameObject/GameObject';
import { GameObjectUI } from './GameObjectUI/GameObjectUI';

export class GOEditorView {
  constructor(params) {
    //html
    this.ui = document.createElement('div');
    this.ui.classList.add('root_GOEditor');
    params.parentUIHtml.appendChild(this.ui);

    //html
    this.goList = null;
    this.goSelectedUI = null;
    this.labelCurrentWorld = null;
    this.typeCbPU = null;

    //parentView
    this.parentView = params.parentView;

    //gameview
    this.gameView = params.gameView;

    //assetsManagers
    this.assetsManager = params.assetsManager;

    //controls
    this.transformControls = this.gameView.getTransformControls();
    this.orbitControls = this.gameView.getOrbitControls();

    //go selected
    this.goSelected = null;

    this.initUI();
    this.initPointerUpCallback();
  }

  initPointerUpCallback() {
    const gV = this.gameView;

    const cbPointerUp = function (event) {
      if (gV.hasBeenRotated()) return;
      const go = this.goSelected;
      let o = go ? this.computeObject3D(go.getUUID()) : null;
      if (event.button == 0 && !gV.tcHasBeenDragged()) {
        // just a right click no drag
        const intersect = gV.throwRay(event, gV.getObject3D());
        o = intersect ? gV.tryFindGOParent(intersect.object) : null;
      }
      //update UI
      this.setSelectedGOWithObject3D(o);
    };

    gV.setCallbackPointerUp(cbPointerUp.bind(this), 'GameObject');
  }

  getSelectedGO() {
    return this.goSelected;
  }

  setSelectedGOWithObject3D(object) {
    this.gameView.attachTCToObject(object);
    //clean
    if (this.goSelectedUI) this.goSelectedUI.dispose();

    if (!object) return;

    const world = this.gameView.getInterpolator().getWorldContext().getWorld();
    const worldGo = world.getGameObject();
    const uuid = object.userData.gameObjectUUID;
    this.goSelected = worldGo.find(uuid);
    this.initPointerUpCallback();
    if (this.goSelected) {
      //attach transform ctrl
      this.goSelectedUI = this.createGOUI(object);
      this.ui.appendChild(this.goSelectedUI.getRootElementUI());
    }
  }

  createGOUI(object) {
    const go = this.goSelected;
    const goUI = new GameObjectUI(go, object, this);
    go.setTransformFromObject3D(object);
    const lS = go.fetchLocalScripts();
    if (lS) {
      if (lS['image']) {
        goUI.appendLSImageUI(this.gameView);
      }
      if (lS['signage_displayer']) {
        goUI.appendLSSignageDisplayerUI(this.gameView);
      }
      if (lS['display_media']) {
        goUI.appendLSDisplayMediaUI();
      }
      if (lS['jitsi_area']) {
        goUI.appendLSJitsiAreaUI();
      }
      if (lS['geo_project']) {
        goUI.appendLSGeoProjectUI(this.gameView);
      }
      if (lS['camera_tour']) {
        goUI.appendLSCameraTourUI(this.gameView);
      }
    }

    const wS = go.fetchWorldScripts();
    if (wS) {
      if (wS['portal']) {
        goUI.appendWSPortalUI(wS, this.gameView);
      }
      if (wS['teleporter']) {
        goUI.appendWSTeleporterUI(wS);
      }
    }

    return goUI;
  }

  dispose() {
    this.ui.remove();
  }

  updateUI() {
    //clean worlds list and rebuild it
    const list = this.goList;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    const world = this.gameView.getInterpolator().getWorldContext().getWorld();
    const go = world.getGameObject();
    const _this = this;
    go.traverse(function (child) {
      const li = document.createElement('li');
      li.classList.add('li_Editor');
      list.appendChild(li);
      li.innerHTML = child.getName();
      li.title = child.getUUID();

      li.onclick = _this.goButtonClicked.bind(_this, child.getUUID());
    });

    let selectedGO = null;
    //goeditor view
    if (this.goSelected) {
      selectedGO = this.computeObject3D(this.goSelected.getUUID());
    }
    this.setSelectedGOWithObject3D(selectedGO);
  }

  goButtonClicked(uuid) {
    const obj = this.computeObject3D(uuid);

    if (!obj) return;

    this.parentView.focusObject(obj);

    this.setSelectedGOWithObject3D(obj);
  }

  computeObject3D(uuid) {
    return GameObjectModule.findObject3D(
      uuid,
      this.gameView.getObject3D(),
      false
    );
  }

  initUI() {
    const labelCurrentWorld = document.createElement('h2');
    labelCurrentWorld.innerHTML =
      this.gameView.getInterpolator().getWorldContext().getWorld().getName() +
      ' :';
    this.ui.appendChild(labelCurrentWorld);
    this.labelCurrentWorld = labelCurrentWorld;

    this.goList = document.createElement('ul');
    this.goList.classList.add('ul_Editor');
    this.ui.appendChild(this.goList);

    const typeCbPU = document.createElement('p');
    this.ui.appendChild(typeCbPU);
    this.gameView.linkedHtmlElementTypeCbPointerUp = typeCbPU;

    this.updateUI();
  }
}
