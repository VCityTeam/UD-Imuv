/** @format */

const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;

module.exports = class MenuAvatar {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;

    this.orbitCtrl = null;
    this.rootHtml = null;
  }

  init() {
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    const _this = this;

    const ws = localCtx.getWebSocketService();
    console.log(
      'init ',
      ws,
      udviz.Game.Components.Constants.WEBSOCKET.MSG_TYPES.QUERY_AVATAR
    );
    ws.emit(
      udviz.Game.Components.Constants.WEBSOCKET.MSG_TYPES.QUERY_AVATAR,
      null
    );
    ws.on(
      udviz.Game.Components.Constants.WEBSOCKET.MSG_TYPES.ON_AVATAR,
      function (avatarJSON) {
        //remove serverside component
        delete avatarJSON.components.Collider;
        delete avatarJSON.components.WorldScript;

        const go = new udviz.Game.GameObject(avatarJSON);

        //local get world and add it
        const computer = gameView.getInterpolator().getLocalComputer();
        computer.onAddGameObject(go, function () {
          //add orbit controls
          _this.orbitCtrl = new udviz.OrbitControls(
            gameView.getCamera(),
            gameView.getRenderer().domElement
          );

          const obj = go.computeObject3D();
          const bb = new udviz.THREE.Box3().setFromObject(obj);

          const center = bb.min.lerp(bb.max, 0.5);

          _this.orbitCtrl.target.copy(center);

          //hard coded tweak values (TODO could be computed with the bb)
          gameView.getCamera().position.x = -0.89;
          gameView.getCamera().position.y = 1.92;
          gameView.getCamera().position.z = 0.97;
        });
      }
    );

    this.rootHtml = document.createElement('div');
    localCtx.getGameView().appendToUI(this.rootHtml);
  }

  onNewGameObject() {
    const newGO = arguments[2];

    if (newGO.getName() == 'avatar') {
      this.rebuildUI(arguments[1], newGO);
    }
  }

  rebuildUI(localCtx, avatarGO) {
    while (this.rootHtml.firstChild) {
      this.rootHtml.firstChild.remove();
    }

    const _this = this;

    //select model
    const flexParentModelId = document.createElement('div');
    flexParentModelId.style.display = 'flex';
    this.rootHtml.appendChild(flexParentModelId);

    const labelModelId = document.createElement('div');
    labelModelId.innerHTML = 'ModelId';
    labelModelId.classList.add('label-menu-settings');
    flexParentModelId.appendChild(labelModelId);

    const selectModelId = document.createElement('select');
    flexParentModelId.appendChild(selectModelId);
    const values = ['avatar_petit', 'avatar_moyen', 'avatar_grand'];
    values.forEach(function (value) {
      const option = document.createElement('option');
      option.innerHTML = value;
      option.value = value;
      selectModelId.appendChild(option);
    });

    //init
    selectModelId.value = avatarGO.components.Render.idRenderData;

    //update shadow map
    selectModelId.onchange = function () {
      const valueSelected = this.selectedOptions[0].value;
      const renderComp = avatarGO.getComponent(udviz.Game.Render.TYPE);
      renderComp.idRenderData = valueSelected;
      renderComp.initAssets(localCtx.getGameView().getAssetsManager());
    };

    //select color
    //select image
  }

  dispose() {
    const ws = arguments[1].getWebSocketService();
    ws.reset([udviz.Game.Components.Constants.WEBSOCKET.MSG_TYPES.ON_AVATAR]);
  }

  tick() {
    if (this.orbitCtrl) {
      this.orbitCtrl.update();
    }
  }
};