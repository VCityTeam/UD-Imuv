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
    this.menuAvatarButton = null;
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

    let menuSettings = null;
    this.menuButton = document.createElement('button');
    this.menuButton.innerHTML = 'Settings';
    this.menuButton.onclick = function () {
      if (!menuSettings) {
        menuSettings = new MenuSettings(localCtx);
        gameView.appendToUI(menuSettings.html());
      } else {
        menuSettings.dispose();
        menuSettings = null;
      }
    };
    gameView.appendToUI(this.menuButton);

    //MENU AVATAR
    const ImuvConstants = gameView.getLocalScriptModules()['ImuvConstants'];
    const role = gameView.getUserData('role');
    if (
      role == ImuvConstants.USER.ROLE.ADMIN ||
      role == ImuvConstants.USER.ROLE.USER ||
      true
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
                // localScriptModules: { ImuvConstants: ImuvConstants },
              }
            )
            .then(function () {

              const menuAvatarGameView = app.getGameView();

              //tweak websocketservice
              menuAvatarGameView
                .getLocalContext()
                .setWebSocketService(localCtx.getWebSocketService());

              const closeButton = document.createElement('button');
              closeButton.innerHTML = 'Close';
              closeButton.onclick = function () {
                menuAvatarGameView.dispose(); //remove menu avatar

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

    //differents options
    this.createDirectionalOptions(localCtx);
    this.createVolumeControl(localCtx);
  }

  createVolumeControl(localCtx) {
    const labelGlobalSound = document.createElement('div');
    labelGlobalSound.innerHTML = 'Volume';
    labelGlobalSound.classList.add('label-menu-settings');
    this.rootHtml.appendChild(labelGlobalSound);

    const globalVolumeSlider = document.createElement('input');
    globalVolumeSlider.type = 'range';
    globalVolumeSlider.step = 0.05;
    globalVolumeSlider.min = 0;
    globalVolumeSlider.max = 1;
    globalVolumeSlider.value = Howler.volume();
    this.rootHtml.appendChild(globalVolumeSlider);

    //callbakc
    globalVolumeSlider.onchange = function () {
      //Howler is global
      Howler.volume(this.value);
    };
  }

  createDirectionalOptions(localCtx) {
    const scene = localCtx.getGameView().getScene();

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
        checkboxDirect.checked = element.visible;
        checkboxDirect.onchange = function () {
          element.visible = this.checked;
        };
        flexParentEnableDirect.appendChild(checkboxDirect);

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
        checkbox.checked = element.castShadow;
        checkbox.onchange = function () {
          element.castShadow = this.checked;
        };
        flexParentEnable.appendChild(checkbox);

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

        //init
        selectSize.value = element.shadow.mapSize.x;

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
