/** @format */

import './AddPrefabEditor.css';

export class AddPrefabEditorView {
  constructor(params) {
    //where html goes
    this.ui = document.createElement('div');
    this.ui.classList.add('ui_AddPrefabEditor');
    params.parentUIHtml.appendChild(this.ui);

    this.assetsManager = params.assetsManager;

    this.gameView = params.gameView;

    this.parentView = params.parentView;

    //html
    this.prefabList = null;

    this.initUI();
    this.initCallbacks();
  }

  dispose() {
    this.ui.remove();
  }

  initUI() {
    this.prefabList = document.createElement('ul');
    this.ui.appendChild(this.prefabList);

    this.updatePrefabList();
  }

  updatePrefabList() {
    const _this = this;
    const a = this.assetsManager;
    const prefabs = a.getPrefabs();

    const list = this.prefabList;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    for (let key in prefabs) {
      const li = document.createElement('li');
      li.classList.add('li_Editor');
      li.innerHTML = key;
      this.prefabList.appendChild(li);
      li.onclick = function () {
        const newGo = a.createPrefab(key);
        _this.parentView.addGameObject(newGo);
      };
    }
  }

  initCallbacks() {}
}
