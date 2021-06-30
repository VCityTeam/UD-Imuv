import './ColliderEditor.css';

import { THREE } from 'ud-viz/src/Game/Shared/Shared';

export class ColliderEditorView {
  constructor(parentWEV) {
    this.parentWEV = parentWEV;

    this.model = new ColliderEditorModel();

    this.rootHtml = this.parentWEV.rootHtml;

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_Editor');
    this.ui.classList.add('ui_ColliderEditor');
    this.rootHtml.appendChild(this.ui);

    this.labelColliderTool = null;

    this.closeButton = null;
    this.initUI();
  }

  disposeUI() {
    this.ui.remove();
  }

  disposeCallbacks() {

  }

  dispose() {
    this.disposeUI();
    this.disposeCallbacks();
  }

  initUI() {
    const labelColliderTool = document.createElement('p');
    labelColliderTool.innerHTML =
      'Collider Tool <br>' + this.parentWEV.labelCurrentWorld.innerHTML;
    this.ui.appendChild(labelColliderTool);
    this.labelColliderTool = labelColliderTool;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'Close';
    this.ui.appendChild(closeButton);
    this.closeButton = closeButton;
  }

  initCallbacks() {
    const _this = this;
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }
}

export class ColliderEditorModel {}
