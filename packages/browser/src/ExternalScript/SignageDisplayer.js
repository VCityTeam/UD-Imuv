import { Game, THREE, DomElement3D } from '@ud-viz/browser';

// TODO refacto this class

export class SignageDisplayer extends Game.External.ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    if (!this.variables.projects) this.variables.projects = [];

    this.popup = null;
    this.project = null;
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
}

class Popup {
  constructor(signageDisplayer) {
    /** @type {SignageDisplayer} */
    this.signageDisplayer = signageDisplayer;
    this.projectsJSON = this.signageDisplayer.variables.projects;

    //html
    this.ui = this.signageDisplayer.context.frame3D.ui;
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
    closeButton.title = 'Fermer';
    const closeCross = document.createElement('div');
    closeCross.classList.add('mask_icon', 'close_cross');
    closeButton.appendChild(closeCross);
    closeButton.onclick = this.signageDisplayer.dispose.bind(
      this.signageDisplayer
    );
    popupHtml.appendChild(closeButton);
    this.closeButton = closeButton;

    this.ui.appendChild(popupHtml);
  }

  fillUlProjects() {
    if (this.ulProjects) {
      this.ulProjects.removeFromParent();
      this.ulProjects = null;
    }
    const ulProjects = document.createElement('ul');
    ulProjects.innerHTML = 'Projets :';
    this.popupHtml.appendChild(ulProjects);
    this.ulProjects = ulProjects;

    this.projectsJSON.forEach((projectJSON) => {
      const projectLi = document.createElement('li');
      projectLi.innerHTML = projectJSON.title;
      projectLi.onclick = () => {
        this.signageDisplayer.createProject(projectJSON);
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
    /** @type {SignageDisplayer} */
    this.signageDisplayer = signageDisplayer;
    this.context = this.signageDisplayer.context;

    this.billboard = null;

    //html
    this.ui = this.signageDisplayer.context.frame3D.ui;
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

    const go = this.signageDisplayer.object3D;
    const object3D = go;
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

    const billboard = new DomElement3D(
      iframe,
      billboardPos,
      euler,
      new THREE.Vector3(5, 5, 5) /*Harcode*/,
      50
    );
    this.context.frame3D.appendBillboard(billboard);
    this.billboard = billboard;
  }

  dispose() {
    if (this.backButton) this.backButton.remove();
    if (this.billboard) this.context.frame3D.removeBillboard(this.billboard);
  }
}
