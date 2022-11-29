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
      function (event) {
        const iconImg = event.target;
        if (iconImg.disable) return;
        iconImg.disable = true;
        const cloneImg = event.target.cloneNode(true);
        iconImg.src = './assets/img/ui/icon_copy.png';
        iconImg.style.backgroundColor = 'var(--imuv-color-four)';

        setTimeout(function () {
          iconImg.src = cloneImg.src;
          iconImg.style.backgroundColor = cloneImg.style.backgroundColor;
          iconImg.disable = cloneImg.disable;
        }, 1000);

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
                closeCross.classList.add('mask_icon', 'close_cross');
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

  displayIframe(localCtx, iframeSrc) {
    const gameView = localCtx.getGameView();

    const closebutton = document.createElement('button');
    closebutton.classList.add('button-imuv');
    closebutton.classList.add('close-button');
    closebutton.title = 'Fermer';

    const closeCross = document.createElement('div');
    closeCross.classList.add('close_cross', 'mask_icon');
    closebutton.appendChild(closeCross);
    gameView.appendToUI(closebutton);

    const content = document.createElement('iframe');
    content.classList.add('ui-iframe');
    content.style.left = gameView.getRootWebGL().style.left;
    content.src = iframeSrc;

    gameView.appendToUI(content);

    //pause avatar command stop rendering
    gameView.setIsRendering(false);
    const avatarController =
      localCtx.findLocalScriptWithID('avatar_controller');
    avatarController.setAvatarControllerMode(false, localCtx);

    closebutton.onclick = function (event) {
      event.stopPropagation();
      content.remove();
      closebutton.remove();

      //restore rendering + avatar command
      gameView.setIsRendering(true);
      avatarController.setAvatarControllerMode(true, localCtx);
    };
  }

  /**
   * Add a tool to toolsbar
   */
  addTool(pathIcon, title, promiseFunction, menuContextual) {
    const icon = document.createElement('img');
    icon.src = pathIcon;
    icon.title = title;

    this.toolsBar.addIcon(icon);

    const toolsContextualMenu = this.toolsContextualMenu;

    // Bind arguments starting after however many are passed in.
    function bind_trailing_args(fn, ...bound_args) {
      return function (...args) {
        return fn(...args, ...bound_args);
      };
    }

    const closeMenu = function () {
      return new Promise(function (resolve) {
        const promise = new Promise(bind_trailing_args(promiseFunction, true)); //true onClose
        promise.then(function (success) {
          if (success) {
            toolsContextualMenu.remove(menuContextual).then(function () {
              resolve(success);
            });
          }
        });
      });
    };

    const openMenu = function () {
      return new Promise(function (resolve) {
        const promise = new Promise(bind_trailing_args(promiseFunction, false)); //false onClose
        promise.then(function (success) {
          if (success) {
            toolsContextualMenu.add(menuContextual, closeMenu);
          }
          resolve(success);
        });
      });
    };

    icon.onclick = function () {
      if (!toolsContextualMenu.isAvailable()) return;

      if (toolsContextualMenu.getCurrentMenu()) {
        if (menuContextual == toolsContextualMenu.getCurrentMenu()) {
          closeMenu();
        } else {
          toolsContextualMenu.closeCurrentMenu().then(openMenu);
        }
      } else {
        openMenu();
      }
    };
  }

  addToMapUI(scriptMap, ImuvConstants) {
    this.mapUI.add(scriptMap, ImuvConstants);
  }

  clearMapUI() {
    this.mapUI.clear();
  }

  displaySocialIframe(iframe) {
    this.socialUI.displayIframe(iframe);
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
    this.gameViewFps.classList.add('debug_label');
    this.rootHtml.appendChild(this.gameViewFps);

    this.worldComputerFps = document.createElement('div');
    this.worldComputerFps.classList.add('debug_label');
    this.rootHtml.appendChild(this.worldComputerFps);

    this.pingUI = document.createElement('div');
    this.pingUI.classList.add('debug_label');
    this.rootHtml.appendChild(this.pingUI);

    this.avatarCount = document.createElement('div');
    this.avatarCount.classList.add('debug_label');
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

    // html elements will be set
    this.closeButton = null;

    // html elements with saved values
    // graphics
    this.sunCheckBox = null;
    this.shadowChecBox = null;
    this.shadowMapSelect = null;
    this.fogSlider = null;
    // audio
    this.volumeSlider = null;
    // controls
    this.mouseSensitivitySlider = null;
    this.zoomFactorSlider = null;

    this.initHtml(localCtx);
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

  initHtml(localCtx) {
    // sections
    this.createTitleSection(this.rootHtml);

    const panelsSection = document.createElement('section');
    panelsSection.classList.add('panels-section');
    this.createGraphicsSection(localCtx, panelsSection);
    this.createAudioSection(localCtx, panelsSection);
    this.createControlsSection(localCtx, panelsSection);
    this.rootHtml.appendChild(panelsSection);

    this.createSaveAndCloseSection(localCtx, this.rootHtml);
  }

  // TITLE SECTION
  createTitleSection(parentElement) {
    const titleSection = document.createElement('section');
    titleSection.classList.add('title-section');
    // Title section
    const title = document.createElement('h1');
    title.innerHTML = 'Paramètres';
    titleSection.appendChild(title);

    parentElement.appendChild(titleSection);
  }

  // SAVE AND CLOSE SECTION
  createSaveAndCloseSection(localCtx, parentElement) {
    const saveAndCloseSection = document.createElement('section');
    saveAndCloseSection.classList.add('save-and-close-section');

    // Close button
    const closeButton = this.createCloseButton();
    saveAndCloseSection.appendChild(closeButton);
    this.closeButton = closeButton;

    // Save button
    const saveButton = this.createSaveButton(localCtx);
    saveAndCloseSection.appendChild(saveButton);

    parentElement.appendChild(saveAndCloseSection);
  }

  createCloseButton() {
    const closeButton = document.createElement('button');
    closeButton.classList.add('button-imuv');
    const closeCross = document.createElement('div');
    closeCross.title = 'Fermer';
    closeCross.classList.add('mask_icon', 'close_cross');
    closeButton.appendChild(closeCross);
    return closeButton;
  }

  createSaveButton(localCtx) {
    const saveButton = document.createElement('button');
    saveButton.classList.add('button-imuv');
    const saveIcon = document.createElement('div');
    saveIcon.title = 'Sauvegarder';
    saveIcon.classList.add('mask_icon', 'save_icon');
    saveButton.appendChild(saveIcon);

    const _this = this;
    saveButton.onclick = function () {
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

    return saveButton;
  }

  //GRAPHICS SECTION
  createGraphicsSection(localCtx, parentElement) {
    const graphicsSection = document.createElement('section');
    graphicsSection.classList.add('graphics-section');

    const graphicsTitle = document.createElement('h2');
    graphicsTitle.innerHTML = 'Graphismes';
    graphicsSection.appendChild(graphicsTitle);

    /* Getting the directional light from the scene. */
    const gameView = localCtx.getGameView();
    const scene = gameView.getScene();
    let dirLight;
    for (let index = 0; index < scene.children.length; index++) {
      const element = scene.children[index];
      if (element.isDirectionalLight) {
        dirLight = element;
      }
    }
    if (!dirLight) {
      console.error('No directional light found');
      return;
    }
    /* ---Directional Light Options---*/
    // Sun option
    const sunOptionDiv = this.createSunOptionDiv(gameView, dirLight);
    graphicsSection.appendChild(sunOptionDiv);
    // Shadow option
    const shadowOptionDiv = this.createShadowOptionDiv(gameView, dirLight);
    graphicsSection.appendChild(shadowOptionDiv);
    // Texture size option
    const textureSizeOptionDiv = this.createTextureSizeOptionDiv(
      gameView,
      dirLight
    );
    graphicsSection.appendChild(textureSizeOptionDiv);

    /*---Other---*/
    // Fog option
    const fogOptionDiv = this.createFogOptionDiv(localCtx);
    graphicsSection.appendChild(fogOptionDiv);

    parentElement.appendChild(graphicsSection);
  }

  createSunOptionDiv(gameView, dirLight) {
    //parent
    const sunOptionDiv = document.createElement('div');

    //label
    const labelEnableDirect = document.createElement('div');
    labelEnableDirect.innerHTML = 'Soleil';
    labelEnableDirect.classList.add('label-menu-settings');
    sunOptionDiv.appendChild(labelEnableDirect);

    //checkbox
    const checkboxDirect = document.createElement('input');
    checkboxDirect.type = 'checkbox';
    sunOptionDiv.appendChild(checkboxDirect);

    //check is settings has been saved
    if (gameView.getUserData('settings').sunValue != undefined) {
      dirLight.visible = gameView.getUserData('settings').sunValue;
    }
    checkboxDirect.checked = dirLight.visible;
    checkboxDirect.onchange = function () {
      dirLight.visible = this.checked;
    };

    this.sunCheckBox = checkboxDirect;

    return sunOptionDiv;
  }

  createShadowOptionDiv(gameView, dirLight) {
    //parent
    const shadowOptionDiv = document.createElement('div');

    //label
    const labelEnable = document.createElement('div');
    labelEnable.innerHTML = 'Ombres';
    labelEnable.classList.add('label-menu-settings');
    shadowOptionDiv.appendChild(labelEnable);

    //checkbox
    const shadowCheckbox = document.createElement('input');
    shadowCheckbox.type = 'checkbox';
    shadowOptionDiv.appendChild(shadowCheckbox);

    //check is settings has been saved
    if (gameView.getUserData('settings').shadowValue != undefined) {
      dirLight.castShadow = gameView.getUserData('settings').shadowValue;
    }

    shadowCheckbox.checked = dirLight.castShadow;
    shadowCheckbox.onchange = function () {
      dirLight.castShadow = this.checked;
    };

    this.shadowChecBox = shadowCheckbox;

    return shadowOptionDiv;
  }

  createTextureSizeOptionDiv(gameView, dirLight) {
    //size
    const textureSizeOptionDiv = document.createElement('div');
    this.rootHtml.appendChild(textureSizeOptionDiv);
    const labelSize = document.createElement('div');
    labelSize.innerHTML = "Taille Texture d'Ombre";
    labelSize.classList.add('label-menu-settings');
    textureSizeOptionDiv.appendChild(labelSize);

    //select
    const selectSize = document.createElement('select');
    textureSizeOptionDiv.appendChild(selectSize);

    const values = [512, 1024, 2048, 4096];
    values.forEach(function (value) {
      const option = document.createElement('option');
      option.innerHTML = value + ' pixels';
      option.value = value;
      selectSize.appendChild(option);
    });

    //check is settings has been saved
    if (!isNaN(gameView.getUserData('settings').shadowMapSize)) {
      dirLight.shadow.mapSize.width =
        gameView.getUserData('settings').shadowMapSize;
      dirLight.shadow.mapSize.height =
        gameView.getUserData('settings').shadowMapSize;
      dirLight.shadow.map = null;
    }

    this.shadowMapSelect = selectSize;

    return textureSizeOptionDiv;
  }

  createFogOptionDiv(localCtx) {
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

    const fogOptionDiv = document.createElement('div');

    const label = document.createElement('label');
    label.innerHTML = 'Distance Brouillard';
    label.classList.add('label-menu-settings');
    fogOptionDiv.appendChild(label);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.step = 1;
    slider.min = min;
    slider.max = max;
    slider.value = scene.fog.far;
    fogOptionDiv.appendChild(slider);

    this.fogSlider = slider;

    //callbakc
    slider.onchange = function () {
      scene.fog.far = this.value;
    };

    return fogOptionDiv;
  }

  // AUDIO SECTION
  createAudioSection(localCtx, parentElement) {
    const audioSection = document.createElement('section');
    audioSection.classList.add('audio-section');

    //title
    const audioTitle = document.createElement('h2');
    audioTitle.innerHTML = 'Audio';
    audioSection.appendChild(audioTitle);

    //audio slider
    const audioSliderDiv = this.createVolumeSliderDiv(localCtx);
    audioSection.appendChild(audioSliderDiv);

    parentElement.appendChild(audioSection);
  }

  createVolumeSliderDiv(localCtx) {
    const gameView = localCtx.getGameView();

    const audioSliderDiv = document.createElement('div');

    const labelGlobalSound = document.createElement('label');
    labelGlobalSound.innerHTML = 'Volume';
    labelGlobalSound.classList.add('label-menu-settings');
    audioSliderDiv.appendChild(labelGlobalSound);

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
    audioSliderDiv.appendChild(globalVolumeSlider);

    this.volumeSlider = globalVolumeSlider;

    //callbakc
    globalVolumeSlider.onchange = function () {
      //Howler is global
      Howler.volume(this.value);
    };

    return audioSliderDiv;
  }

  // CONTROLS SECTION
  createControlsSection(localCtx, parentElement) {
    const controlsSection = document.createElement('section');
    controlsSection.classList.add('controls-section');

    //title
    const controlsTitle = document.createElement('h2');
    controlsTitle.innerHTML = 'Contrôles';
    controlsSection.appendChild(controlsTitle);

    // Mouse sensitivity
    const mouseSensitivityDiv = this.createMouseSensitivitysDiv(localCtx);
    controlsSection.appendChild(mouseSensitivityDiv);

    // Zoom factor
    const zoomFactorDiv = this.createZoomFactorDiv(localCtx);
    controlsSection.appendChild(zoomFactorDiv);

    parentElement.appendChild(controlsSection);
  }

  createMouseSensitivitysDiv(localCtx) {
    const gameView = localCtx.getGameView();

    //init fog according extent
    const max = 40;
    const min = 3;

    //check is settings has been saved
    let init = (min + max) / 2;
    if (!isNaN(gameView.getUserData('settings').mouseSensitivitySlider)) {
      init = gameView.getUserData('settings').mouseSensitivitySlider;
    }

    const mouseSensitivityDiv = document.createElement('div');

    const label = document.createElement('label');
    label.innerHTML = 'Mouse Sensibilité';
    label.classList.add('label-menu-settings');
    mouseSensitivityDiv.appendChild(label);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.step = 0.1;
    slider.min = min;
    slider.max = max;
    slider.value = init;
    mouseSensitivityDiv.appendChild(slider);

    this.mouseSensitivitySlider = slider;

    return mouseSensitivityDiv;
  }

  createZoomFactorDiv(localCtx) {
    const gameView = localCtx.getGameView();

    //init fog according extent
    const max = 2.5;
    const min = 1.2;

    //check is settings has been saved
    let init = (min + max) / 2;
    if (!isNaN(gameView.getUserData('settings').zoomFactor)) {
      init = gameView.getUserData('settings').zoomFactor;
    }

    const zoomFactorDiv = document.createElement('div');
    const label = document.createElement('div');
    label.innerHTML = 'Itowns Zoom Sensibilité';
    label.classList.add('label-menu-settings');
    zoomFactorDiv.appendChild(label);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.step = 0.01;
    slider.min = min;
    slider.max = max;
    slider.value = init;
    zoomFactorDiv.appendChild(slider);

    this.zoomFactorSlider = slider;

    slider.onchange = function () {
      const view = gameView.getItownsView();
      if (view.controls) {
        view.controls.zoomInFactor = this.value;
        view.controls.zoomOutFactor = 1 / this.value;
      }
    };

    return zoomFactorDiv;
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

    this.closeFunction = null;
    this.currentMenu = null;
    this.available = true;
  }

  closeCurrentMenu() {
    return this.closeFunction();
  }

  html() {
    return this.rootHtml;
  }

  isAvailable() {
    return this.available;
  }

  add(menu, closeFunction) {
    const duration = this.getCSSTransitionDuration(this.rootHtml);
    this.closeFunction = closeFunction;
    this.available = false;
    return new Promise((resolve) => {
      this.rootHtml.appendChild(menu.html());
      this.rootHtml.style.transform = 'translate(0%,-50%)';
      this.currentMenu = menu;

      setTimeout(() => {
        this.available = true;
        resolve();
      }, duration);
    });
  }

  getCurrentMenu() {
    return this.currentMenu;
  }

  getCSSTransitionDuration(element, ms = true) {
    return (
      parseFloat(getComputedStyle(element).transitionDuration) * (ms ? 1000 : 1)
    );
  }

  remove(menu) {
    const duration = this.getCSSTransitionDuration(this.rootHtml);
    this.closeFunction = null;
    this.available = false;

    menu.isClosing = true; //TODO LIKE DISPOSE HTML CREATE A ISCLOSING FLAG IN CONTEXTUAL MENU GENERIC WAIT FOR REFACTO (is coming ...)

    return new Promise((resolve) => {
      this.rootHtml.style.transform = 'translate(-100%,-50%)';
      this.currentMenu = null;

      setTimeout(() => {
        menu.dispose();
        menu.isClosing = false; //TODO LIKE DISPOSE HTML CREATE A ISCLOSING FLAG IN CONTEXTUAL MENU GENERIC WAIT FOR REFACTO (is coming ...)
        this.available = true;
        resolve();
      }, duration);
    });
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

  displayIframe(iframe) {
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
