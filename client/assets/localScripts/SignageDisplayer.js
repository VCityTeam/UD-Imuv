/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const sharedType = require('ud-viz/src/Game/Shared/Shared');
/** @type {sharedType} */
let Shared = null;
const threeType = require('three');
const THREEUtils = require('ud-viz/src/Game/Shared/Components/THREEUtils');
/** @type {threeType} */
let THREE = null;

module.exports = class SignageDisplayer {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Shared = udviz.Game.Shared;
    THREE = Shared.THREE;
    this.displayPopUp = null;
    if (!this.conf.projects) this.conf.projects = [];
  }

  init() {
    this.go = arguments[0];
    this.localCtx = arguments[1];
  }

  interaction() {
    const localCtx = this.localCtx;
    if (!this.displayPopUp) {
      this.displayPopUp = this.createPopup(localCtx);
    }

    console.log('interaction', this);
  }

  onLeave() {}

  //TODO : create a Popup Class in order to dispose correctly ; Top view ? ; Rotate billboard look at avatar ?
  createPopup(localCtx) {
    const _this = this;
    const displayPopUp = document.createElement('div');
    displayPopUp.classList.add('popup-signage');
    localCtx.getGameView().appendToUI(displayPopUp);

    const titlePopUp = document.createElement('h1');
    titlePopUp.innerHTML = 'POP UP INFO';
    displayPopUp.appendChild(titlePopUp);

    const ulProjects = document.createElement('ul');
    ulProjects.innerHTML = 'Projets :';
    displayPopUp.appendChild(ulProjects);

    const projects = this.conf.projects;
    projects.forEach((project) => {
      const projectLi = document.createElement('li');
      projectLi.innerHTML = project.title;

      projectLi.onclick = function () {
        console.log('show project', project, localCtx);
        displayPopUp.hidden = true;

        const iframe = document.createElement('iframe');
        iframe.src = project.url;

        const billboardPos = new THREE.Vector3(
          project.position[0],
          project.position[1],
          project.position[2]
        );

        const vecForward = _this.go
          .computeObject3D()
          .getWorldDirection(new THREE.Vector3());

        const realPositionGO = _this.go
          .computeObject3D()
          .getWorldPosition(new THREE.Vector3());

        const dirVec = realPositionGO.clone().sub(billboardPos);

        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(
          vecForward.normalize(),
          dirVec.normalize()
        );

        const euler = new THREE.Euler();
        euler.setFromQuaternion(quaternion);
        euler.z = 0;
        const transform = new THREEUtils.Transform(
          billboardPos,
          euler.toVector3(),
          new THREE.Vector3(5, 5, 5)
        );

        const billboard = new udviz.Widgets.Billboard(iframe, transform, 50);
        billboard.getMaskObject().material.color.set(new THREE.Color(0, 0, 0));

        localCtx.getGameView().appendBillboard(billboard);

        const backButton = document.createElement('button');
        backButton.innerHTML = 'Back';
        displayPopUp.parentElement.appendChild(backButton);
        backButton.onclick = function () {
          displayPopUp.hidden = false;
          backButton.remove();
          localCtx.getGameView().removeBillboard(billboard);
        };
      };

      ulProjects.appendChild(projectLi);
    });
    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'Close';
    closeButton.onclick = function () {
      displayPopUp.remove();
      _this.displayPopUp = null;
    };
    displayPopUp.appendChild(closeButton);

    return displayPopUp;
  }
};
