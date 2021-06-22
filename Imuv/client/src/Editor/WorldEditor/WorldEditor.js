/** @format */

import { createTileGroupsFromBatchIDs } from 'ud-viz/src/Widgets/Components/3DTiles/3DTilesUtils';
import './WorldEditor.css';

export class WorldEditorView {
  constructor(parent, config) {
    this.parent = parent;
    this.config = config;

    this.rootHtml = this.parent.rootHtml;

    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_Editor');
    this.ui.classList.add('ui_WorldEditor');
    this.rootHtml.appendChild(this.ui);

    this.closeButton = null;

    this.labelCurrentWorld = null;
    this.toolsList = null;
    this.initUI();
  }

  disposeUI() {
    this.ui.remove();
  }

  initUI() {
    this.labelCurrentWorld = document.createElement('p');
    this.labelCurrentWorld.innerHTML =
    this.parent.model.getCurrentWorld().getName() + ' :';
    this.ui.appendChild(this.labelCurrentWorld);

    const closeButton = document.createElement('button');
    closeButton.innerHTML = 'Close';
    this.ui.appendChild(closeButton);
    this.closeButton = closeButton;
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }
}
