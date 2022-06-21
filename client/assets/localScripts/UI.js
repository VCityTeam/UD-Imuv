const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;

module.exports = class UI {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;

    this.gameViewFps = null;
    this.worldComputerFps = null;
    this.pingUI = null;
    this.avatarCount = null;
    this.menuButton = null;
    this.menuSettings = null;
    this.menuAvatarButton = null;
  }

  getMenuSettings() {
    return this.menuSettings
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();

    this.gameViewFps = document.createElement('div');
    this.gameViewFps.classList.add('label_controller');
    gameView.appendToUI(this.gameViewFps);

    this.worldComputerFps = document.createElement('div');
    this.worldComputerFps.classList.add('label_controller');
    gameView.appendToUI(this.worldComputerFps);

    this.pingUI = document.createElement('div');
    this.pingUI.classList.add('label_controller');
    gameView.appendToUI(this.pingUI);

    this.avatarCount = document.createElement('div');
    this.avatarCount.classList.add('label_controller');
    gameView.appendToUI(this.avatarCount);

    const menuSettings = new MenuSettings(localCtx);
    this.menuSettings = menuSettings

    this.menuButton = document.createElement('button');
    this.menuButton.innerHTML = 'Settings';
    this.menuButton.onclick = function () {
      if (!menuSettings.html().parentNode) {
        gameView.appendToUI(menuSettings.html());
      } else {
        menuSettings.dispose();
      }
    };
    gameView.appendToUI(this.menuButton);

    //MENU AVATAR
    const ImuvConstants = gameView.getLocalScriptModules()['ImuvConstants'];
    const role = gameView.getUserData('role');
    if (
      role == ImuvConstants.USER.ROLE.ADMIN ||
      role == ImuvConstants.USER.ROLE.USER
    ) {
      this.menuAvatarButton = document.createElement('button');
      this.menuAvatarButton.innerHTML = 'Menu Avatar';
      this.menuAvatarButton.onclick = function () {
        //pause gameview
        gameView.setIsRendering(false);
        gameView.getInputManager().setPause(true);

        //register
        const parentHtml = gameView.html().parentNode;

        //remove html
        gameView.html().remove();

        //create world
        const menuAvatarWorld = new udviz.Game.World({
          name: 'Menu Avatar',
          gameObject: {
            name: 'MenuAvatar',
            static: true,
            components: {
              LocalScript: {
                conf: {},
                idScripts: ['menu_avatar'],
              },
            },
          },
        });

        //launch menu avatar
        udviz.Components.SystemUtils.File.loadJSON(
          './assets/config/config_game.json'
        ).then(function (config) {
          const app = new udviz.Templates.LocalGame();
          app
            .startWithAssetsLoaded(
              menuAvatarWorld,
              gameView.getAssetsManager(),
              config,
              {
                htmlParent: parentHtml,
                // userData: { avatarUUID: avatar.getUUID(), editorMode: true },
                localScriptModules: { ImuvConstants: ImuvConstants },
              }
            )
            .then(function () {
              const menuAvatarGameView = app.getGameView();

              //tweak websocketservice
              console.log('TWEAK WS');
              menuAvatarGameView
                .getLocalContext()
                .setWebSocketService(localCtx.getWebSocketService());

              const closeButton = document.createElement('button');
              closeButton.innerHTML = 'Close';
              closeButton.onclick = function () {
                menuAvatarGameView.dispose(true); //remove menu avatar

                //unpause gameview
                gameView.setIsRendering(true);
                gameView.getInputManager().setPause(false);

                //add html
                parentHtml.appendChild(gameView.html());
              };

              menuAvatarGameView.appendToUI(closeButton);
            });
        });
      };
      gameView.appendToUI(this.menuAvatarButton);
    }
  }

  tick() {
    this.updateUI(arguments[0], arguments[1]);
  }

  updateUI(go, localCtx) {
    //update ui
    this.gameViewFps.innerHTML =
      'Client FPS = ' + Math.round(1000 / localCtx.getDt());

    let worldFps = -1;
    if (this.conf.world_computer_dt)
      worldFps = Math.round(1000 / this.conf.world_computer_dt);
    this.worldComputerFps.innerHTML = 'World FPS = ' + worldFps;

    this.pingUI.innerHTML =
      'Ping = ' + localCtx.getGameView().getInterpolator().getPing();

    let avatarCount = 0;
    localCtx.getRootGameObject().traverse(function (g) {
      if (g.name == 'avatar') avatarCount++;
    });
    this.avatarCount.innerHTML = 'Player: ' + avatarCount;
  }
};

class MenuSettings {
  constructor(localCtx) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root-menu-settings');

    const title = document.createElement('h1');
    title.innerHTML = 'Settings';
    this.rootHtml.appendChild(title);

    this.fogSlider = null;
    this.mouseSensitivitySlider = null;
    this.volumeSlider = null;
    this.sunCheckBox = null;
    this.shadowChecBox = null;
    this.shadowMapSelect = null;

    //differents options
    this.createDirectionalOptions(localCtx);
    this.createVolumeControl(localCtx);
    this.createFogControl(localCtx);
    this.createMouseSensitivty(localCtx)
    this.createSaveButton(localCtx);
  }

  getMouseSensitivityValue() {
    return this.mouseSensitivitySlider.value
  }

  createSaveButton(localCtx) {
    const button = document.createElement('button');
    button.innerHTML = 'Save Settings on Server';
    this.rootHtml.appendChild(button);

    const _this = this;
    button.onclick = function () {
      const ws = localCtx.getWebSocketService();
      const ImuvConstants = localCtx.getGameView().getLocalScriptModules()[
        'ImuvConstants'
      ];
      ws.emit(ImuvConstants.WEBSOCKET.MSG_TYPES.SAVE_SETTINGS, {
        //SETTINGS MODEL IS DESCRIBE HERE
        fogValue: _this.fogSlider.value,
        mouseSensitivitySlider: _this.mouseSensitivitySlider.value,
        volumeValue: _this.volumeSlider.value,
        sunValue: _this.sunCheckBox.checked,
        shadowValue: _this.shadowChecBox.checked,
        shadowMapSize: _this.shadowMapSelect.value,
      });
    };
  }

  createMouseSensitivty(localCtx) {
    const gameView = localCtx.getGameView();

    //init fog according extent
    const max = 40;
    const min = 3;


    //check is settings has been saved
    let init = (min + max) / 2
    if (!isNaN(gameView.getUserData('settings').mouseSensitivitySlider)) {
      init = gameView.getUserData('settings').mouseSensitivitySlider;
    }

    const label = document.createElement('div');
    label.innerHTML = 'Mouse Sensibilité';
    label.classList.add('label-menu-settings');
    this.rootHtml.appendChild(label);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.step = 0.1;
    slider.min = min;
    slider.max = max;
    slider.value = init;
    this.rootHtml.appendChild(slider);

    this.mouseSensitivitySlider = slider;
  }

  createFogControl(localCtx) {
    const gameView = localCtx.getGameView();
    const scene = gameView.getScene();

    //init fog according extent
    const max = gameView.config.game.radiusExtent;
    const min = 50;
    scene.fog = new udviz.THREE.Fog(
      // new udviz.THREE.Color("red"),
      new udviz.THREE.Color('#e1ebef'),
      0,
      max
    );

    //check is settings has been saved
    if (!isNaN(gameView.getUserData('settings').fogValue)) {
      scene.fog.far = gameView.getUserData('settings').fogValue;
    }

    const label = document.createElement('div');
    label.innerHTML = 'Fog Distance';
    label.classList.add('label-menu-settings');
    this.rootHtml.appendChild(label);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.step = 1;
    slider.min = min;
    slider.max = max;
    slider.value = scene.fog.far;
    this.rootHtml.appendChild(slider);

    this.fogSlider = slider;

    //callbakc
    slider.onchange = function () {
      scene.fog.far = this.value;
    };
  }

  createVolumeControl(localCtx) {
    const gameView = localCtx.getGameView();

    const labelGlobalSound = document.createElement('div');
    labelGlobalSound.innerHTML = 'Volume';
    labelGlobalSound.classList.add('label-menu-settings');
    this.rootHtml.appendChild(labelGlobalSound);

    //check is settings has been saved
    if (!isNaN(gameView.getUserData('settings').volumeValue)) {
      Howler.volume(gameView.getUserData('settings').volumeValue);
    }

    const globalVolumeSlider = document.createElement('input');
    globalVolumeSlider.type = 'range';
    globalVolumeSlider.step = 0.05;
    globalVolumeSlider.min = 0;
    globalVolumeSlider.max = 1;
    globalVolumeSlider.value = Howler.volume();
    this.rootHtml.appendChild(globalVolumeSlider);

    this.volumeSlider = globalVolumeSlider;

    //callbakc
    globalVolumeSlider.onchange = function () {
      //Howler is global
      Howler.volume(this.value);
    };
  }

  createDirectionalOptions(localCtx) {
    const gameView = localCtx.getGameView();
    const scene = gameView.getScene();

    for (let index = 0; index < scene.children.length; index++) {
      const element = scene.children[index];
      if (element.isDirectionalLight) {
        //enable directional

        //parent
        const flexParentEnableDirect = document.createElement('div');
        flexParentEnableDirect.style.display = 'flex';
        this.rootHtml.appendChild(flexParentEnableDirect);

        //label
        const labelEnableDirect = document.createElement('div');
        labelEnableDirect.innerHTML = 'Sun';
        labelEnableDirect.classList.add('label-menu-settings');
        flexParentEnableDirect.appendChild(labelEnableDirect);

        //checkbox
        const checkboxDirect = document.createElement('input');
        checkboxDirect.type = 'checkbox';

        //check is settings has been saved
        if (gameView.getUserData('settings').sunValue != undefined) {
          element.visible = gameView.getUserData('settings').sunValue;
        }

        checkboxDirect.checked = element.visible;
        checkboxDirect.onchange = function () {
          element.visible = this.checked;
        };
        flexParentEnableDirect.appendChild(checkboxDirect);

        this.sunCheckBox = checkboxDirect;

        //enable shadow

        //parent
        const flexParentEnable = document.createElement('div');
        flexParentEnable.style.display = 'flex';
        this.rootHtml.appendChild(flexParentEnable);

        //label
        const labelEnable = document.createElement('div');
        labelEnable.innerHTML = 'Ombre';
        labelEnable.classList.add('label-menu-settings');
        flexParentEnable.appendChild(labelEnable);

        //checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';

        //check is settings has been saved
        if (gameView.getUserData('settings').shadowValue != undefined) {
          element.castShadow = gameView.getUserData('settings').shadowValue;
        }

        checkbox.checked = element.castShadow;
        checkbox.onchange = function () {
          element.castShadow = this.checked;
        };
        flexParentEnable.appendChild(checkbox);

        this.shadowChecBox = checkbox;

        //size
        const flexParentSize = document.createElement('div');
        flexParentSize.style.display = 'flex';
        this.rootHtml.appendChild(flexParentSize);
        const labelSize = document.createElement('div');
        labelSize.innerHTML = 'Size';
        labelSize.classList.add('label-menu-settings');
        flexParentSize.appendChild(labelSize);

        //select
        const selectSize = document.createElement('select');
        flexParentSize.appendChild(selectSize);

        const values = [512, 1024, 2048, 4096];
        values.forEach(function (value) {
          const option = document.createElement('option');
          option.innerHTML = value + ' pixels';
          option.value = value;
          selectSize.appendChild(option);
        });

        //check is settings has been saved
        if (!isNaN(gameView.getUserData('settings').shadowMapSize)) {
          element.shadow.mapSize.width =
            gameView.getUserData('settings').shadowMapSize;
          element.shadow.mapSize.height =
            gameView.getUserData('settings').shadowMapSize;
          element.shadow.map = null;
        }

        //init
        selectSize.value = element.shadow.mapSize.width;

        this.shadowMapSelect = selectSize;

        //update shadow map
        selectSize.onchange = function () {
          const valueSelected = parseInt(this.selectedOptions[0].value);
          element.shadow.mapSize.width = valueSelected;
          element.shadow.mapSize.height = valueSelected;
          element.shadow.map = null;
        };
      }
    }
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    this.rootHtml.remove();
  }
}
