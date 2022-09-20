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

    this.worldAvatarGO = null;

    this.bufferCollider = null;
    this.bufferWS = null;
  }

  init() {
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();
    const _this = this;

    const ws = localCtx.getWebSocketService();
    const ImuvConstants = localCtx.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];

    ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPES.QUERY_AVATAR, null);
    ws.on(ImuvConstants.WEBSOCKET.MSG_TYPES.ON_AVATAR, function (avatarJSON) {
      //remove serverside component
      _this.bufferCollider = avatarJSON.components.Collider;
      delete avatarJSON.components.Collider;
      _this.bufferWS = avatarJSON.components.WorldScript;
      delete avatarJSON.components.WorldScript;

      const go = new udviz.Game.GameObject(avatarJSON);
      _this.worldAvatarGO = go;

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

        _this.buildUI(localCtx);
      });
    });

    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root-menu-settings');
    localCtx.getGameView().appendToUI(this.rootHtml);
  }

  buildUI(localCtx) {
    while (this.rootHtml.firstChild) {
      this.rootHtml.firstChild.remove();
    }

    const title = document.createElement('h1');
    title.innerHTML = 'Menu Avatar';
    this.rootHtml.appendChild(title);

    const _this = this;

    //select model
    const flexParentModelId = document.createElement('div');
    flexParentModelId.style.display = 'flex';
    this.rootHtml.appendChild(flexParentModelId);

    const labelModelId = document.createElement('div');
    labelModelId.innerHTML = '3D Modèle ';
    labelModelId.classList.add('label-menu-settings');
    flexParentModelId.appendChild(labelModelId);

    const selectModelId = document.createElement('select');
    flexParentModelId.appendChild(selectModelId);
    const values = ['avatar_petit', 'avatar_moyen', 'avatar_grand']; //HARD CODE
    values.forEach(function (value) {
      const option = document.createElement('option');
      option.innerHTML = value;
      option.value = value;
      selectModelId.appendChild(option);
    });

    //init
    selectModelId.value = _this.worldAvatarGO.components.Render.idRenderData;

    //update shadow map
    selectModelId.onchange = function () {
      const valueSelected = this.selectedOptions[0].value;
      const renderComp = _this.worldAvatarGO.getComponent(
        udviz.Game.Render.TYPE
      );
      renderComp.setIdRenderData(valueSelected);
      _this.worldAvatarGO.setOutdated(true);
    };

    //select color
    const flexParentColor = document.createElement('div');
    flexParentColor.style.display = 'flex';
    this.rootHtml.appendChild(flexParentColor);

    const labelColor = document.createElement('div');
    labelColor.innerHTML = 'Couleur ';
    labelColor.classList.add('label-menu-settings');
    flexParentColor.appendChild(labelColor);

    const inputColor = document.createElement('input');
    inputColor.type = 'color';
    flexParentColor.appendChild(inputColor);

    //init
    inputColor.value =
      '#' + _this.worldAvatarGO.components.Render.color.getHexString();

    inputColor.oninput = function () {
      const color = new udviz.THREE.Color(this.value);
      const renderComp = _this.worldAvatarGO.getComponent(
        udviz.Game.Render.TYPE
      );
      renderComp.setColor(color);
      _this.worldAvatarGO.setOutdated(true);
    };

    //select image
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    this.rootHtml.appendChild(imageInput);
    imageInput.onchange = function (e) {
      udviz.Components.SystemUtils.File.readSingleFileAsDataUrl(
        e,
        function (data) {
          const url = data.target.result;
          const localScriptComp = _this.worldAvatarGO.getComponent(
            udviz.Game.LocalScript.TYPE
          );
          localScriptComp.getConf()['path_face_texture'] = url;
          _this.worldAvatarGO.setOutdated(true);
        }
      );
    };

    //SAVE
    const saveButton = document.createElement('button');
    saveButton.classList.add('button-imuv');
    saveButton.innerHTML = 'Sauvegarder Avatar';
    this.rootHtml.appendChild(saveButton);

    saveButton.onclick = function () {
      const content = _this.worldAvatarGO.toJSON(true);
      content.components.Collider = _this.bufferCollider;
      content.components.WorldScript = _this.bufferWS;

      console.log(content);

      const ws = localCtx.getWebSocketService();
      const messageSplitted = udviz.Game.Components.Pack.splitMessage(content);
      const ImuvConstants = localCtx.getGameView().getLocalScriptModules()[
        'ImuvConstants'
      ];

      messageSplitted.forEach(function (pM) {
        ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPES.SAVE_AVATAR, pM);
      });
    };
  }

  dispose() {
    const ws = arguments[1].getWebSocketService();
    const ImuvConstants = arguments[1].getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];

    ws.reset([ImuvConstants.WEBSOCKET.MSG_TYPES.ON_AVATAR]);
  }

  tick() {
    if (this.orbitCtrl) {
      this.orbitCtrl.update();
    }
  }
};
