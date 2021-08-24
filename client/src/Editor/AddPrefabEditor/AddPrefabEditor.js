/** @format */

import './AddPrefabEditor.css';

export class AddPrefabEditorView {
  constructor(params) {
    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_AddPrefabEditor');
    params.parentUIHtml.appendChild(this.ui);

    this.assetsManager = params.assetsManager;

    //html
    this.prefabList = null;
    this.closeButton = null;

    this.initUI();
    this.initCallbacks();
  }

  dispose() {
    this.ui.remove();
  }

  initUI() {
    const closeButton = document.createElement('div');
    closeButton.classList.add('button_Editor');
    closeButton.innerHTML = 'Close';
    this.ui.appendChild(closeButton);
    this.closeButton = closeButton;

    this.prefabList = document.createElement('ul');
    this.ui.appendChild(this.prefabList);

    this.updatePrefabList();
  }

  updatePrefabList() {
    const prefabs = this.assetsManager.getPrefabs();
    for (let key in prefabs) {
      const li = document.createElement('li');
      li.innerHTML = key;
      this.prefabList.appendChild(li);
      li.onclick = function () {
        console.log(key);
      };
    }
  }

  initCallbacks() {
    const _this = this;
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }
}
