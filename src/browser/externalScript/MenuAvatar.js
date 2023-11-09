export class MenuAvatar {
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

    ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPE.QUERY_AVATAR, null);
    ws.on(ImuvConstants.WEBSOCKET.MSG_TYPE.ON_AVATAR, function (avatarJSON) {
      // remove serverside component
      _this.bufferCollider = avatarJSON.components.Collider;
      delete avatarJSON.components.Collider;
      _this.bufferWS = avatarJSON.components.WorldScript;
      delete avatarJSON.components.WorldScript;

      const go = new udviz.Game.GameObject(avatarJSON);
      _this.worldAvatarGO = go;

      // local get world and add it
      const computer = gameView.getInterpolator().getLocalComputer();
      computer.onAddGameObject(go, function () {
        // add orbit controls
        _this.orbitCtrl = new udviz.OrbitControls(
          gameView.getCamera(),
          gameView.getRenderer().domElement
        );

        const obj = go.computeObject3D();
        const bb = new udviz.THREE.Box3().setFromObject(obj);
        const center = bb.min.lerp(bb.max, 0.5);

        const direction = go.computeForwardVector();
        const distance = 2;
        const cameraPosition = center
          .clone()
          .add(direction.clone().multiplyScalar(distance));

        gameView.getCamera().position.copy(cameraPosition);
        _this.orbitCtrl.target.copy(center);

        _this.buildUI(localCtx);
      });
    });

    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_menu_avatar');
    localCtx.getGameView().appendToUI(this.rootHtml);
  }

  buildUI(localCtx) {
    while (this.rootHtml.firstChild) {
      this.rootHtml.firstChild.remove();
    }

    const title = document.createElement('h2');
    title.innerHTML = 'Menu Avatar';
    this.rootHtml.appendChild(title);

    const _this = this;

    // select model
    const flexParentModelId = document.createElement('div');
    this.rootHtml.appendChild(flexParentModelId);

    const labelModelId = document.createElement('div');
    labelModelId.innerHTML = '3D Modèle ';
    labelModelId.classList.add('label-menu-settings');
    flexParentModelId.appendChild(labelModelId);

    const selectModelId = document.createElement('select');
    flexParentModelId.appendChild(selectModelId);
    const values = ['avatar_petit', 'avatar_moyen', 'avatar_grand']; // HARD CODE
    values.forEach(function (value) {
      const option = document.createElement('option');
      option.innerHTML = value;
      option.value = value;
      selectModelId.appendChild(option);
    });

    // init
    selectModelId.value = _this.worldAvatarGO.components.Render.idRenderData;

    // update shadow map
    selectModelId.onchange = function () {
      const valueSelected = this.selectedOptions[0].value;
      const renderComp = _this.worldAvatarGO.getComponent(
        udviz.Game.Render.TYPE
      );
      renderComp.setIdRenderData(valueSelected);
      _this.worldAvatarGO.setOutdated(true);
    };

    // select color
    const flexParentColor = document.createElement('div');
    this.rootHtml.appendChild(flexParentColor);

    const labelColor = document.createElement('div');
    labelColor.innerHTML = 'Couleur ';
    labelColor.classList.add('label-menu-settings');
    flexParentColor.appendChild(labelColor);

    const inputColor = document.createElement('input');
    inputColor.type = 'color';
    flexParentColor.appendChild(inputColor);

    // init
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

    const flexParentImage = document.createElement('div');

    // label select image
    const labelImageInput = document.createElement('label');
    labelImageInput.innerHTML = "Photo tête de l'avatar ";
    flexParentImage.appendChild(labelImageInput);

    // wrap input file
    const wrapInputFile = document.createElement('div');
    wrapInputFile.classList.add('wrap-input-file');
    flexParentImage.appendChild(wrapInputFile);

    const labelDragOrClick = document.createElement('label');
    labelDragOrClick.innerHTML = 'Glisser ou cliquer ici';
    wrapInputFile.appendChild(labelDragOrClick);

    const imgSelected = document.createElement('img');
    imgSelected.id = 'img-selected';

    const updateSrcImgSelected = () => {
      const localScriptComp = this.worldAvatarGO.getComponent(
        udviz.Game.LocalScript.TYPE
      );
      const src = localScriptComp.getConf()['path_face_texture'];
      imgSelected.src = src;
    };
    updateSrcImgSelected();

    wrapInputFile.appendChild(imgSelected);

    // select input image
    const imageInput = document.createElement('input');
    imageInput.id = 'image-input-file';
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    wrapInputFile.appendChild(imageInput);

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
          updateSrcImgSelected();
        }
      );
    };

    ['dragover', 'dragenter'].forEach((eventStr) => {
      imageInput.addEventListener(eventStr, function () {
        wrapInputFile.classList.add('is-dragover');
      });
    });

    ['dragleave', 'dragend', 'drop'].forEach((eventStr) => {
      imageInput.addEventListener(eventStr, function () {
        wrapInputFile.classList.remove('is-dragover');
      });
    });

    this.rootHtml.appendChild(flexParentImage);
    const saveAndCloseSection = document.createElement('section');
    saveAndCloseSection.id = 'menu-avatar-save-and-close-section';
    this.rootHtml.appendChild(saveAndCloseSection);

    // SAVE
    const saveButton = document.createElement('button');
    saveButton.title = 'Sauvegarder';
    saveButton.classList.add('button-imuv');
    const saveIcon = document.createElement('div');
    saveIcon.classList.add('mask_icon', 'save_icon');
    saveButton.appendChild(saveIcon);
    saveAndCloseSection.appendChild(saveButton);

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
        ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPE.SAVE_AVATAR, pM);
      });
    };

    // CLOSE button
    saveAndCloseSection.appendChild(
      localCtx.getGameView().getUserData('close_button')
    );
  }

  dispose() {
    const ws = arguments[1].getWebSocketService();
    const ImuvConstants = arguments[1].getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];

    ws.reset([ImuvConstants.WEBSOCKET.MSG_TYPE.ON_AVATAR]);
  }

  tick() {
    if (this.orbitCtrl) {
      this.orbitCtrl.update();
    }
  }

  static get ID_SCRIPT() {
    return 'menu_avatar_ext_script_id';
  }
}
