/** @format */

import './GOEditor.css';
import { THREE } from 'ud-viz';

export class GOEditorView {
  constructor(params) {
    //html
    this.ui = document.createElement('div');
    this.ui.classList.add('root_GOEditor');
    params.parentUIHtml.appendChild(this.ui);

    //html
    this.goList = null;

    //gameview
    this.gameView = params.gameView;

    this.orbitControls = params.orbitControls;

    this.initUI();
    this.initCallbacks();
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

    const world = this.gameView.getStateComputer().getWorldContext().getWorld();
    const go = world.getGameObject();
    const _this = this;
    go.traverse(function (child) {
      const li = document.createElement('li');
      li.classList.add('li_Editor');
      list.appendChild(li);
      li.innerHTML = child.getName();

      li.onclick = _this.focusGOCamera.bind(_this, child.getUUID());
    });
  }

  focusGOCamera(uuid) {
    const object3D = this.gameView.getObject3D();
    let objToFocus = null;
    object3D.traverse(function (c) {
      if (c.userData.gameObjectUUID == uuid) {
        objToFocus = c;
      }
    });

    if (!objToFocus) return;

    const camera = this.gameView.getItownsView().camera.camera3D;

    const bb = new THREE.Box3().setFromObject(objToFocus);
    const center = bb.getCenter(new THREE.Vector3());
    const radius = bb.min.distanceTo(bb.max) * 0.5;

    // compute new distance between camera and center of object/sphere
    const h = radius / Math.tan((camera.fov / 2) * THREE.Math.DEG2RAD);

    // get direction of camera
    const dir = new THREE.Vector3().subVectors(camera.position, center);

    // compute new camera position
    const newPos = new THREE.Vector3().addVectors(center, dir.setLength(h));

    camera.position.set(newPos.x, newPos.y, newPos.z);
    camera.lookAt(center);
    camera.updateProjectionMatrix();

    this.orbitControls.target.copy(center);
    this.orbitControls.update();
  }

  initUI() {
    this.goList = document.createElement('ul');
    this.goList.classList.add('ul_Editor');
    this.ui.appendChild(this.goList);

    this.updateUI();
  }

  initCallbacks() {}
}

class GOEditorModel {
  constructor() {}
}
