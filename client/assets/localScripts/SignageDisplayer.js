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
    if (!this.conf.projects) this.conf.projects = [];

    this.popup = null;
    this.project = null;
  }

  init() {
    this.go = arguments[0];
    this.localCtx = arguments[1];
  }

  interaction() {
    debugger;
    if (!this.popup) {
      this.createPopup();
    }
  }

  onLeave() {
    this.dispose();
  }

  //TODO : Top view ?
  createPopup() {
    this.dispose();
    this.popup = new Popup(this);
  }

  createProject(json) {
    this.dispose();
    this.project = new Project(json, this);
  }

  dispose() {
    if (this.popup) {
      this.popup.dispose();
      this.popup = null;
    }
    if (this.project) {
      this.project.dispose();
      this.project = null;
    }
  }
};

class Popup {
  constructor(signageDisplayer) {
    this.signageDisplayer = signageDisplayer;
    this.projectsJSON = this.signageDisplayer.conf.projects;

    //html
    this.ui = this.signageDisplayer.localCtx.getGameView().ui;
    this.popupHtml = null;
    this.titlePopUp = null;
    this.ulProjects = null;
    this.closeButton = null;

    this.createUI();
  }

  createUI() {
    const popupHtml = document.createElement('div');
    popupHtml.classList.add('popup-signage');
    this.popupHtml = popupHtml;

    const titlePopUp = document.createElement('h1');
    titlePopUp.innerHTML = 'POP UP INFO';
    popupHtml.appendChild(titlePopUp);
    this.titlePopUp = titlePopUp;

    this.fillUlProjects();

    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'Close';
    closeButton.onclick = this.signageDisplayer.dispose.bind(
      this.signageDisplayer
    );
    popupHtml.appendChild(closeButton);
    this.closeButton = closeButton;

    this.ui.appendChild(popupHtml);
  }

  fillUlProjects() {
    const _this = this;
    if (this.ulProjects) {
      this.ulProjects.removeFromParent();
      this.ulProjects = null;
    }
    const ulProjects = document.createElement('ul');
    ulProjects.innerHTML = 'Projets :';
    this.popupHtml.appendChild(ulProjects);
    this.ulProjects = ulProjects;

    this.projectsJSON.forEach(function (projectJSON) {
      const projectLi = document.createElement('li');
      projectLi.innerHTML = projectJSON.title;
      projectLi.onclick = function () {
        _this.signageDisplayer.createProject(projectJSON);
      };

      ulProjects.appendChild(projectLi);
    });
  }

  dispose() {
    if (this.popupHtml) this.popupHtml.remove();
  }
}

class Project {
  constructor(projectJson, signageDisplayer) {
    this.projectJson = projectJson;
    this.signageDisplayer = signageDisplayer;
    this.localCtx = this.signageDisplayer.localCtx;

    this.billboard = null;

    //html
    this.ui = this.localCtx.getGameView().ui;
    this.backButton = null;

    this.initHtml();
    this.initBillboard();
  }

  initHtml() {
    const backButton = document.createElement('button');
    backButton.innerHTML = 'Back';
    this.ui.appendChild(backButton);

    const sD = this.signageDisplayer;
    backButton.onclick = function () {
      sD.createPopup();
    };
    this.backButton = backButton;
  }

  initBillboard() {
    const iframe = document.createElement('iframe');
    iframe.src = this.projectJson.url;

    const billboardPos = new THREE.Vector3(
      this.projectJson.position[0],
      this.projectJson.position[1],
      this.projectJson.position[2]
    );

    const go = this.signageDisplayer.go;
    const object3D = go.computeObject3D();
    const worldDirectiondGO = object3D.getWorldDirection(new THREE.Vector3()); //forward vec
    const worldPositionGO = object3D.getWorldPosition(new THREE.Vector3());

    const vecDir = worldPositionGO.clone().sub(billboardPos);

    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(
      worldDirectiondGO.normalize(),
      vecDir.normalize()
    );

    const euler = new THREE.Euler();
    euler.setFromQuaternion(quaternion);
    euler.z = 0;

    const transform = new THREEUtils.Transform(
      billboardPos,
      euler.toVector3(),
      new THREE.Vector3(5, 5, 5) /*Harcode*/
    );

    const billboard = new udviz.Widgets.Billboard(iframe, transform, 50);
    billboard.getMaskObject().material.color.set(new THREE.Color(0, 0, 0)); //fix in the latest version of ud-viz but not published yet
    this.localCtx.getGameView().appendBillboard(billboard);
    this.billboard = billboard;
  }

  dispose() {
    if (this.backButton) this.backButton.remove();
    if (this.billboard)
      this.localCtx.getGameView().removeBillboard(this.billboard);
  }
}
