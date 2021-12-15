/** @format */

import './GOEditor.css';
import GameObjectModule from 'ud-viz/src/Game/Shared/GameObject/GameObject';
import { GameObjectUI } from '../GameObjectUI';

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

    //parentView
    this.parentView = params.parentView;

    //gameview
    this.gameView = params.gameView;

    //controls
    this.transformControls = this.gameView.getTransformControls();
    this.orbitControls = this.gameView.getOrbitControls();

    //go selected
    this.goSelected = null;

    this.initCallbacks();
    this.initUI();
  }

  initCallbacks() {
    const gV = this.gameView;

    const cbPointerUp = function (event) {
      const go = this.goSelected;
      let o = go ? this.computeObject3D(go.getUUID()) : null;
      const controlChanged = gV.hasBeenRotate() || gV.tcHasBeenDragged();
      if (event.button == 0 && !controlChanged) {
        // just a right click no drag
        const intersect = gV.throwRay(event, gV.getObject3D());
        o = intersect ? gV.tryFindGOParent(intersect.object) : null;
      }
      this.setSelectedGO(o);
    };

    gV.setCallbackPointerUp(cbPointerUp.bind(this));
  }

  getSelectedGO() {
    return this.goSelected;
  }

  setSelectedGO(object) {
    this.gameView.attachTCToObject(object);
    //clean
    if (this.goSelectedUI) this.goSelectedUI.remove();

    if (!object) return;

    const world = this.gameView.getInterpolator().getWorldContext().getWorld();
    const worldGo = world.getGameObject();
    const uuid = object.userData.gameObjectUUID;
    this.goSelected = worldGo.find(uuid);

    if (this.goSelected) {
      //attach transform ctrl
      this.goSelectedUI = this.createGOUI(object);
      this.ui.appendChild(this.goSelectedUI);
    }
  }

  createGOUI(object) {
    const go = this.goSelected;
    const goUI = new GameObjectUI(go, object, this);
    const lS = go.fetchLocalScripts();
    if (lS) {
      if (lS['image']) {
        goUI.appendLSImageUI(this.gameView);
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

    return goUI.getRootElementUI();
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
    this.setSelectedGO(selectedGO);
  }

  goButtonClicked(uuid) {
    const obj = this.computeObject3D(uuid);

    if (!obj) return;

    this.parentView.focusObject(obj);

    this.setSelectedGO(obj);
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

    this.updateUI();
  }
}
