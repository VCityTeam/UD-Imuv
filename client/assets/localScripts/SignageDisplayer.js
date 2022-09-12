/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const GameType = require('ud-viz/src/Game/Game');
/** @type {GameType} */
let Game = null;
const threeType = require('three');
const THREEUtils = require('ud-viz/src/Game/Components/THREEUtils');
/** @type {threeType} */
let THREE = null;

module.exports = class SignageDisplayer {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;
    THREE = Game.THREE;
    if (!this.conf.projects) this.conf.projects = [];

    this.popup = null;
    this.project = null;
  }

  init() {
    this.go = arguments[0];
    this.localCtx = arguments[1];
  }

  interaction() {
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
    closeButton.classList.add('button-imuv');
    closeButton.innerHTML = 'Fermer';
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
    backButton.classList.add('button-imuv');
    backButton.innerHTML = 'Retour en arrière';
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

    const billboard = new udviz.Views.Billboard(iframe, transform, 50);
    this.localCtx.getGameView().appendBillboard(billboard);
    this.billboard = billboard;
  }

  dispose() {
    if (this.backButton) this.backButton.remove();
    if (this.billboard)
      this.localCtx.getGameView().removeBillboard(this.billboard);
  }
}
