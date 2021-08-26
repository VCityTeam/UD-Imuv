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
    const _this = this;
    const a = this.assetsManager;
    const prefabs = a.getPrefabs();
    for (let key in prefabs) {
      const li = document.createElement('li');
      li.classList.add('li_Editor');
      li.innerHTML = key;
      this.prefabList.appendChild(li);
      li.onclick = function () {
        const newGo = a.createPrefab(key);
        //find the map
        const wCxt = _this.gameView.getStateComputer().getWorldContext();
        const world = wCxt.getWorld();

        const go = world.getGameObject();
        const wS = go.fetchWorldScripts()['worldGameManager'];
        const mapGo = wS.getMap();

        if (!mapGo) throw new Error('no map object in world');

        world.addGameObject(newGo, wCxt, mapGo, function () {
          //TODO code replicate

          //force update gameview
          _this.gameView.setUpdateGameObject(true);
          _this.gameView.update(world.computeWorldState());
          _this.gameView.setUpdateGameObject(false);

          //force ui update
          _this.parentView.getGOEditorView().updateUI();
        });
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
