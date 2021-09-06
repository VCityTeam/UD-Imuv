/** @format */

import './HeightmapEditor.css';

export class HeightmapEditorView {
  constructor(params) {
    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_HeightmapEditor');
    params.parentUIHtml.appendChild(this.ui);

    this.closeButton = null;

    this.assetsManager = params.assetsManager;

    this.gameView = params.gameView;

    this.parentView = params.parentView;

    this.initUI();
    this.initCallbacks();
  }

  dispose() {
    this.ui.remove();
  }

  initUI() {
    this.closeButton = document.createElement('div');
    this.closeButton.classList.add('button_Editor');
    this.closeButton.innerHTML = 'Close';
    this.ui.appendChild(this.closeButton);
  }

  initCallbacks() {
    const _this = this;
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }
}
