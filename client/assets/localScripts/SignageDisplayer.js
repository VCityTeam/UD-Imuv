/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;
const sharedType = require('ud-viz/src/Game/Shared/Shared');
/** @type {sharedType} */
let Shared = null;
const threeType = require('three');
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
    this.localCtx = arguments[1];
  }

  interaction() {
    const localCtx = this.localCtx;
    if (!this.displayPopUp) {
      this.displayPopUp = this.createPopup(localCtx);
    } else {
      this.displayPopUp.remove();
      this.displayPopUp = null;
    }
  }

  onLeave() {
    if (this.displayPopUp) {
      this.displayPopUp.remove();
      this.displayPopUp = null;
    }
  }

  createPopup(localCtx) {
    const displayPopUp = document.createElement('div');
    displayPopUp.classList.add('popup-signage');

    const titlePopUp = document.createElement('h1');
    titlePopUp.innerHTML = 'POP UP INFO';
    displayPopUp.appendChild(titlePopUp);

    const ulProjects = document.createElement('ul');
    ulProjects.innerHTML = 'Projets :';
    displayPopUp.appendChild(ulProjects);

    const projects = this.conf.projects;
    if (!projects) return;

    /* projects.forEach((project) => {
      const liProject = _this.projectHtml(project);
      ulProjects.appendChild(liProject);
    });*/

    localCtx.getGameView().appendToUI(displayPopUp);
    return displayPopUp;
  }

  projectHtml(projectData) {
    Shared.Components.JSONUtils.parse(projectData);
  }
};
