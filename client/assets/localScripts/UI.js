const udvizType = require('ud-viz');
/** @type {udvizType} */
let udviz = null;

module.exports = class UI {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;

    //menu settings
    this.menuSettings = null;

    //display debug info
    this.debugInfo = new DebugInfo();

    //toolsbar ui
    this.toolsBar = new ToolsBar();

    //contextual menu
    this.toolsContextualMenu = new ToolsContextualMenu();

    //map ui
    this.mapUI = new MapUI();

    //gadget
    this.gadgetUI = new GadgetUI();

    //social ui
    this.socialUI = new SocialUI();

    //label info
    this.labelInfo = new LabelInfo();
  }

  getMenuSettings() {
    return this.menuSettings;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();

    //FILL UI WITH CONTAINER

    //Toolsbar
    gameView.appendToUI(this.toolsBar.html());

    //contextual
    gameView.appendToUI(this.toolsContextualMenu.html());

    //mapUI
    gameView.appendToUI(this.mapUI.html());

    //gadget ui
    gameView.appendToUI(this.gadgetUI.html());

    //social ui
    gameView.appendToUI(this.socialUI.html());

    //label info
    gameView.appendToUI(this.labelInfo.html());

    //Debug Info
    if (__DEBUG__) {
      gameView.appendToUI(this.debugInfo.html());
    }

    //Gadget Menu Settings
    const menuSettings = new MenuSettings(localCtx);
    this.menuSettings = menuSettings; //ref to be access from other scripts

    this.gadgetUI.addGadget(
      './assets/img/ui/icon_settings.png',
      'Paramètres',
      function () {
        //pause gameview
        gameView.setIsRendering(false);
        gameView.getInputManager().setPause(true);
        gameView.appendToUI(menuSettings.html());

        menuSettings.setOnClose(function () {
          gameView.setIsRendering(true);
          gameView.getInputManager().setPause(false);
          menuSettings.html().remove();
        });
      }
    );

    //Gadget Link URL
    this.gadgetUI.addGadget(
      './assets/img/ui/icon_link.png',
      'Copier Lien',
      function () {
        //get params event
        const avatarGO = go
          .computeRoot()
          .find(gameView.getUserData('avatarUUID'));

        const position = avatarGO.getPosition().toArray();
        const rotation = avatarGO.getRotation().toArray();
        const worldUUID = gameView.getLastState().getWorldUUID();

        const urlEvent =
          ImuvConstants.URL_PARAMETER.EVENT.TELEPORT_AVATAR_WORLD;
        const url = new URL(window.location.origin + window.location.pathname);

        url.searchParams.append(
          encodeURI(ImuvConstants.URL_PARAMETER.ID_KEY),
          encodeURIComponent(urlEvent.ID_VALUE)
        );
        url.searchParams.append(
          encodeURI(urlEvent.PARAMS_KEY.POSITION),
          encodeURIComponent(position)
        );
        url.searchParams.append(
          encodeURI(urlEvent.PARAMS_KEY.ROTATION),
          encodeURIComponent(rotation)
        );
        url.searchParams.append(
          encodeURI(urlEvent.PARAMS_KEY.WORLDUUID),
          encodeURIComponent(worldUUID)
        );

        //put it in clipboard
        navigator.clipboard.writeText(url);
      }
    );

    //Gadget menu avatar
    const ImuvConstants = gameView.getLocalScriptModules()['ImuvConstants'];
    const role = gameView.getUserData('role');
    if (
      role == ImuvConstants.USER.ROLE.ADMIN ||
      role == ImuvConstants.USER.ROLE.DEFAULT
    ) {
      this.gadgetUI.addGadget(
        './assets/img/ui/icon_menu_avatar.png',
        'Menu Avatar',
        function () {
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
                  localScriptModules: { ImuvConstants: ImuvConstants },
                }
              )
              .then(function () {
                const menuAvatarGameView = app.getGameView();

                //tweak websocketservice
                menuAvatarGameView
                  .getLocalContext()
                  .setWebSocketService(localCtx.getWebSocketService());

                const closeButton = document.createElement('button');
                closeButton.classList.add('button-imuv');
                closeButton.title = 'Fermer';
                const closeCross = document.createElement('div');
                closeCross.classList.add('close_cross');
                closeButton.appendChild(closeCross);
                closeButton.onclick = function () {
                  menuAvatarGameView.dispose(); //remove menu avatar

                  //unpause gameview
                  gameView.setIsRendering(true);
                  gameView.getInputManager().setPause(false);

                  //add html
                  parentHtml.appendChild(gameView.html());
                };

                //make it accessible in menuavatar localscript
                menuAvatarGameView.writeUserData('close_button', closeButton);
              });
          });
        }
      );
    }

    //Gadget fullscreen
    this.gadgetUI.addGadget(
      './assets/img/ui/icon_fullscreen.png',
      '',
      function () {
        //toggle fullscreen

        const elem = document.documentElement;
        function openFullscreen() {
          if (elem.requestFullscreen) {
            elem.requestFullscreen();
          } else if (elem.webkitRequestFullscreen) {
            /* Safari */
            elem.webkitRequestFullscreen();
          } else if (elem.msRequestFullscreen) {
            /* IE11 */
            elem.msRequestFullscreen();
          }
        }

        function closeFullscreen() {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            /* Safari */
            document.webkitExitFullscreen();
          } else if (document.msExitFullscreen) {
            /* IE11 */
            document.msExitFullscreen();
          }
        }

        if (!document.fullscreenElement) {
          openFullscreen();
        } else {
          closeFullscreen();
        }
      }
    );
  }

  /**
   * Add a tool to toolsbar
   */
  addTool(pathIcon, title, promiseFunction, menuContextual) {
    const icon = document.createElement('img');
    icon.src = pathIcon;
    icon.title = title;

    this.toolsBar.addIcon(icon);

    let toolEnabled = false;
    const toolsContextualMenu = this.toolsContextualMenu;

    icon.onclick = function () {
      toolEnabled = !toolEnabled;

      const promise = new Promise(promiseFunction);

      promise.then(function () {
        if (toolEnabled) {
          toolsContextualMenu.add(menuContextual);
        } else {
          toolsContextualMenu.remove(menuContextual);
        }
      });
    };
  }

  addToMapUI(scriptMap, ImuvConstants) {
    this.mapUI.add(scriptMap, ImuvConstants);
  }

  clearMapUI() {
    this.mapUI.clear();
  }

  addSocialIframe(iframe) {
    this.socialUI.addIframe(iframe);
  }

  removeSocialIframe() {
    this.socialUI.clear();
  }

  getLabelInfo() {
    return this.labelInfo;
  }

  tick() {
    const localCtx = arguments[1];

    if (this.debugInfo) this.debugInfo.update(localCtx, this.conf);
  }
};

class DebugInfo {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_debug');

    this.gameViewFps = document.createElement('div');
    this.gameViewFps.classList.add('label_controller');
    this.rootHtml.appendChild(this.gameViewFps);

    this.worldComputerFps = document.createElement('div');
    this.worldComputerFps.classList.add('label_controller');
    this.rootHtml.appendChild(this.worldComputerFps);

    this.pingUI = document.createElement('div');
    this.pingUI.classList.add('label_controller');
    this.rootHtml.appendChild(this.pingUI);

    this.avatarCount = document.createElement('div');
    this.avatarCount.classList.add('label_controller');
    this.rootHtml.appendChild(this.avatarCount);
  }

  html() {
    return this.rootHtml;
  }

  update(localCtx, conf) {
    //update ui
    this.gameViewFps.innerHTML =
      'Client FPS = ' + Math.round(1000 / localCtx.getDt());

    let worldFps = -1;
    if (conf.world_computer_dt)
      worldFps = Math.round(1000 / conf.world_computer_dt);
    this.worldComputerFps.innerHTML = 'World FPS = ' + worldFps;

    this.pingUI.innerHTML =
      'Ping = ' + localCtx.getGameView().getInterpolator().getPing();

    let avatarCount = 0;
    localCtx.getRootGameObject().traverse(function (g) {
      if (g.name == 'avatar') avatarCount++;
    });
    this.avatarCount.innerHTML = 'Player: ' + avatarCount;
  }
}

class MenuSettings {
  constructor(localCtx) {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root-menu-settings');

    const title = document.createElement('h1');
    title.innerHTML = 'Paramètres';
    this.rootHtml.appendChild(title);

    this.fogSlider = null;
    this.mouseSensitivitySlider = null;
    this.zoomFactorSlider = null;
    this.volumeSlider = null;
    this.sunCheckBox = null;
    this.shadowChecBox = null;
    this.shadowMapSelect = null;

    this.closeButton = document.createElement('button');
    this.closeButton.classList.add('button-imuv');
    const closeCross = document.createElement('div');
    closeCross.classList.add('close_cross');
    this.closeButton.appendChild(closeCross);
    this.rootHtml.appendChild(this.closeButton);

    //differents options
    this.createDirectionalOptions(localCtx);
    this.createVolumeControl(localCtx);
    this.createFogControl(localCtx);
    this.createMouseSensitivtySlider(localCtx);
    this.createZoomFactorSlider(localCtx);
    this.createSaveButton(localCtx);
  }

  setOnClose(f) {
    this.closeButton.onclick = f;
  }

  getMouseSensitivityValue() {
    return this.mouseSensitivitySlider.value;
  }

  getZoomFactorValue() {
    return this.zoomFactorSlider.value;
  }

  createSaveButton(localCtx) {
    const button = document.createElement('button');
    button.classList.add('button-imuv');
    button.innerHTML = 'Sauvegarder';
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
        zoomFactor: _this.zoomFactorSlider.value,
        mouseSensitivitySlider: _this.mouseSensitivitySlider.value,
        volumeValue: _this.volumeSlider.value,
        sunValue: _this.sunCheckBox.checked,
        shadowValue: _this.shadowChecBox.checked,
        shadowMapSize: _this.shadowMapSelect.value,
      });
    };
  }

  createMouseSensitivtySlider(localCtx) {
    const gameView = localCtx.getGameView();

    //init fog according extent
    const max = 40;
    const min = 3;

    //check is settings has been saved
    let init = (min + max) / 2;
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

  createZoomFactorSlider(localCtx) {
    const gameView = localCtx.getGameView();

    //init fog according extent
    const max = 2.5;
    const min = 1.2;

    //check is settings has been saved
    let init = (min + max) / 2;
    if (!isNaN(gameView.getUserData('settings').zoomFactor)) {
      init = gameView.getUserData('settings').zoomFactor;
    }

    const label = document.createElement('div');
    label.innerHTML = 'Itowns Zoom Sensibilité';
    label.classList.add('label-menu-settings');
    this.rootHtml.appendChild(label);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.step = 0.01;
    slider.min = min;
    slider.max = max;
    slider.value = init;
    this.rootHtml.appendChild(slider);

    this.zoomFactorSlider = slider;

    slider.onchange = function () {
      const view = gameView.getItownsView();
      if (view.controls) {
        view.controls.zoomInFactor = this.value;
        view.controls.zoomOutFactor = 1 / this.value;
      }
    };
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
    label.innerHTML = 'Distance Brouillard';
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
        labelEnableDirect.innerHTML = 'Soleil';
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
        labelEnable.innerHTML = 'Ombres';
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
        labelSize.innerHTML = "Taille Texture d'Ombre";
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

class ToolsBar {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_toolsbar');
  }

  addIcon(icon) {
    this.rootHtml.appendChild(icon);
  }

  html() {
    return this.rootHtml;
  }
}

class ToolsContextualMenu {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('tools_contextual_menu');
  }

  html() {
    return this.rootHtml;
  }

  add(menu) {
    this.rootHtml.appendChild(menu.html());
    this.rootHtml.style.transform = 'translate(0%,-50%)';
  }

  remove(menu) {
    this.rootHtml.style.transform = 'translate(-100%,-50%)';

    function getCSSTransitionDuration(element, ms = true) {
      return (
        parseFloat(getComputedStyle(element).transitionDuration) *
        (ms ? 1000 : 1)
      );
    }

    setTimeout(function () {
      menu.dispose();
    }, getCSSTransitionDuration(this.rootHtml));
  }
}

const MAP_MINIZE_SCALE = 0.5;

class MapUI {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('mapUI');

    this.minimized = null;
    this.setMinimized(true);

    this.currentMapScript = null;
  }

  setMinimized(value) {
    this.minimized = value;

    if (value) {
      this.rootHtml.style.transform =
        'scale(' +
        MAP_MINIZE_SCALE +
        ') translate(' +
        MAP_MINIZE_SCALE * 100 +
        '%,' +
        -MAP_MINIZE_SCALE * 100 +
        '%)';
    } else {
      this.rootHtml.style.transform = 'initial';
    }
  }

  add(scriptMap, ImuvConstants) {
    this.currentMapScript = scriptMap;

    //Map interface
    this.rootHtml.appendChild(scriptMap.getRootHtml());
    scriptMap.setDisplayMap(true);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('map_buttons');
    this.rootHtml.appendChild(buttonsDiv);

    //add button
    const minimizeTitle = 'Réduire';
    const minimizeSrc = './assets/img/ui/icon_minimize.png';
    const maximizeTitle = 'Agrandir';
    const maximizeSrc = './assets/img/ui/icon_maximize.png';

    const scaleButton = document.createElement('img');
    if (!this.minimized) {
      scaleButton.title = minimizeTitle;
      scaleButton.src = minimizeSrc;
    } else {
      scaleButton.title = maximizeTitle;
      scaleButton.src = maximizeSrc;
    }
    scaleButton.classList.add('map_button');
    buttonsDiv.appendChild(scaleButton);

    const _this = this;
    scaleButton.onclick = function () {
      _this.setMinimized(!_this.minimized);
      if (!_this.minimized) {
        scaleButton.title = minimizeTitle;
        scaleButton.src = minimizeSrc;
      } else {
        scaleButton.title = maximizeTitle;
        scaleButton.src = maximizeSrc;
      }
    };

    const teleportButton = document.createElement('img');
    teleportButton.title = 'Teleportation';
    teleportButton.src = './assets/img/ui/icon_teleport_white.png';
    teleportButton.classList.add('map_button');
    buttonsDiv.appendChild(teleportButton);

    teleportButton.onclick = function () {
      scriptMap.setClickMode(ImuvConstants.MAP_CLICK_MODE.TELEPORT);
    };

    const pingButton = document.createElement('img');
    pingButton.title = 'Ping';
    pingButton.src = './assets/img/ui/icon_ping.png';
    pingButton.classList.add('map_button');
    buttonsDiv.appendChild(pingButton);

    pingButton.onclick = function () {
      scriptMap.setClickMode(ImuvConstants.MAP_CLICK_MODE.PING);
    };
  }

  clear() {
    while (this.rootHtml.firstChild) {
      this.rootHtml.firstChild.remove();
    }

    //no display for old script map
    if (this.currentMapScript) {
      this.currentMapScript.setDisplayMap(false);
      this.currentMapScript = null;
    }
  }

  html() {
    return this.rootHtml;
  }
}

class GadgetUI {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_gadget');
  }

  addGadget(path, title, cb) {
    const icon = document.createElement('img');
    icon.src = path;
    icon.title = title;
    icon.onclick = cb;

    this.rootHtml.appendChild(icon);
  }

  html() {
    return this.rootHtml;
  }
}

const SOCIAL_MINIZE_SCALE = 0.5;

class SocialUI {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_social_ui');

    this.minimized = null;
    this.setMinimized(true);
  }

  html() {
    return this.rootHtml;
  }

  setMinimized(value) {
    this.minimized = value;

    if (value) {
      this.rootHtml.style.transform =
        'scale(' +
        SOCIAL_MINIZE_SCALE +
        ') translate(' +
        SOCIAL_MINIZE_SCALE * 100 +
        '%,' +
        SOCIAL_MINIZE_SCALE * 100 +
        '%)';
    } else {
      this.rootHtml.style.transform = 'initial';
    }
  }

  addIframe(iframe) {
    const minimizeTitle = 'Réduire';
    const minimizeSrc = './assets/img/ui/icon_minimize.png';
    const maximizeTitle = 'Agrandir';
    const maximizeSrc = './assets/img/ui/icon_maximize.png';

    const scaleButton = document.createElement('img');
    if (!this.minimized) {
      scaleButton.title = minimizeTitle;
      scaleButton.src = minimizeSrc;
    } else {
      scaleButton.title = maximizeTitle;
      scaleButton.src = maximizeSrc;
    }
    scaleButton.classList.add('map_button');
    this.rootHtml.appendChild(scaleButton);

    const _this = this;
    scaleButton.onclick = function () {
      _this.setMinimized(!_this.minimized);
      if (!_this.minimized) {
        scaleButton.title = minimizeTitle;
        scaleButton.src = minimizeSrc;
      } else {
        scaleButton.title = maximizeTitle;
        scaleButton.src = maximizeSrc;
      }
    };

    this.rootHtml.appendChild(iframe);
  }

  clear() {
    while (this.rootHtml.firstChild) {
      this.rootHtml.firstChild.remove();
    }
  }
}

class LabelInfo {
  constructor() {
    this.rootHtml = document.createElement('div');
    this.rootHtml.classList.add('root_label_info');

    this.currentID = null;
    this.rootHtml.classList.add('hidden');
  }

  writeLabel(id, label) {
    this.currentID = id;

    this.rootHtml.innerHTML = label;
    this.rootHtml.classList.remove('hidden');
  }

  clear(id) {
    if (id == this.currentID) {
      this.currentID = null;
      this.rootHtml.innerHTML = '';
      this.rootHtml.classList.add('hidden');
    }
  }

  html() {
    return this.rootHtml;
  }
}
