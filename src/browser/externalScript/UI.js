import { ScriptBase } from '@ud-viz/game_browser';
import { Object3D } from '@ud-viz/game_shared';
import { loadJSON } from '@ud-viz/utils_browser';
import * as THREE from 'three';
import {
  URL_PARAMETER,
  USER,
  WEBSOCKET,
  MAP_CLICK_MODE,
} from '../../shared/constant';

import { AvatarController } from './AvatarController';

export class UI extends ScriptBase {
  constructor(context, object3D, variables) {
    super(context, object3D, variables);

    // menu settings
    this.menuSettings = null;

    // display debug info
    this.debugInfo = new DebugInfo();

    // toolsbar ui
    this.toolsBar = new ToolsBar();

    // contextual menu
    this.toolsContextualMenu = new ToolsContextualMenu();

    // map ui
    this.mapUI = new MapUI();

    // gadget
    this.gadgetUI = new GadgetUI();

    // social ui
    this.socialUI = new SocialUI();

    // label info
    this.labelInfo = new LabelInfo();
  }

  getMenuSettings() {
    return this.menuSettings;
  }

  init() {
    // FILL UI WITH CONTAINER

    // Toolsbar
    this.context.frame3D.domElementUI.appendChild(this.toolsBar.html());

    // contextual
    this.context.frame3D.domElementUI.appendChild(
      this.toolsContextualMenu.html()
    );

    // mapUI
    this.context.frame3D.domElementUI.appendChild(this.mapUI.html());

    // gadget ui
    this.context.frame3D.domElementUI.appendChild(this.gadgetUI.html());

    // social ui
    this.context.frame3D.domElementUI.appendChild(this.socialUI.html());

    // label info
    this.context.frame3D.domElementUI.appendChild(this.labelInfo.html());

    // DEBUG variable is going to be replace by webpack
    // eslint-disable-next-line no-undef
    if (DEBUG) {
      this.context.frame3D.domElementUI.appendChild(this.debugInfo.html());
    }

    // Gadget Menu Settings
    const menuSettings = new MenuSettings(this.context);
    this.menuSettings = menuSettings; // ref to be access from other scripts

    this.gadgetUI.addGadget(
      './assets/img/ui/icon_settings.png',
      'Paramètres',
      () => {
        // pause gameview
        this.context.frame3D.isRendering = false;
        this.context.inputManager.setPause(true);
        this.context.frame3D.domElementUI.appendChild(menuSettings.html());

        menuSettings.setOnClose(() => {
          this.context.frame3D.isRendering = true;
          this.context.inputManager.setPause(false);
          menuSettings.html().remove();
        });
      }
    );

    // Gadget Link URL
    this.gadgetUI.addGadget(
      './assets/img/ui/icon_link.png',
      'Copier Lien',
      (event) => {
        const iconImg = event.target;
        if (iconImg.disable) return;
        iconImg.disable = true;
        const cloneImg = event.target.cloneNode(true);
        iconImg.src = './assets/img/ui/icon_copy.png'; // TODO hardcoded value should be in this.variables
        iconImg.style.backgroundColor = 'var(--imuv-color-four)'; // idem

        setTimeout(function () {
          iconImg.src = cloneImg.src;
          iconImg.style.backgroundColor = cloneImg.style.backgroundColor;
          iconImg.disable = cloneImg.disable;
        }, 1000);

        // get params event
        const avatarGO = this.context.object3D.getObjectByProperty(
          'uuid',
          this.context.userData.avatar.uuid
        );

        const position = avatarGO.position.toArray();
        const rotation = avatarGO.rotation.toArray();

        const urlEvent = URL_PARAMETER.EVENT.TELEPORT_AVATAR_GAMEOBJECT3D;
        const url = new URL(window.location.origin + window.location.pathname);

        url.searchParams.append(
          encodeURI(URL_PARAMETER.ID_KEY),
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
          encodeURI(urlEvent.PARAMS_KEY.GAMEOBJECT3DUUID),
          encodeURIComponent(this.context.userData.gameObject3DUUID)
        );

        // put it in clipboard
        navigator.clipboard.writeText(url);
      }
    );

    // Gadget menu avatar
    if (
      this.context.userData.role == USER.ROLE.ADMIN ||
      this.context.userData.role == USER.ROLE.DEFAULT
    ) {
      this.gadgetUI.addGadget(
        './assets/img/ui/icon_menu_avatar.png',
        'Menu Avatar',
        () => {
          // pause gameview
          this.context.frame3D.isRendering = false;
          this.context.inputManager.setPause(true);

          // register
          // eslint-disable-next-line no-unused-vars
          const parentHtml = this.context.frame3D.html().parentNode;

          // remove html
          this.context.frame3D.html().remove();

          // create world
          // eslint-disable-next-line no-unused-vars
          const menuAvatar = new Object3D({
            name: 'MenuAvatar',
            static: true,
            components: {
              ExternalScript: {
                scriptParams: ['MenuAvatar'],
              },
            },
          });

          // launch menu avatar
          // eslint-disable-next-line no-unused-vars
          loadJSON('./assets/config/config.json').then((config) => {
            console.error('no reimplemented yet');
            // const app = new udviz.Templates.LocalGame();
            // app
            //   .startWithAssetsLoaded(
            //     menuAvatarWorld,
            //     gameView.getAssetsManager(),
            //     config,
            //     {
            //       htmlParent: parentHtml,
            //       localScriptModules: { Constant: Constant },
            //     }
            //   )
            //   .then(function () {
            //     const menuAvatarGameView = app.getGameView();

            //     //tweak websocketservice
            //     menuAvatarGameView
            //       .getLocalContext()
            //       .setWebSocketService(externalContext.getWebSocketService());

            //     const closeButton = document.createElement('button');
            //     closeButton.classList.add('button-imuv');
            //     closeButton.title = 'Fermer';
            //     const closeCross = document.createElement('div');
            //     closeCross.classList.add('mask_icon', 'close_cross');
            //     closeButton.appendChild(closeCross);
            //     closeButton.onclick = function () {
            //       menuAvatarGameView.dispose(); //remove menu avatar

            //       //unpause gameview
            //       gameView.isRendering = (true);
            //       gameView.getInputManager().setPause(false);

            //       //add html
            //       parentHtml.appendChild(gameView.html());
            //     };

            //     //make it accessible in menuavatar localscript
            //     menuAvatarGameView.writeUserData('close_button', closeButton);
            //   });
          });
        }
      );
    }

    // Gadget fullscreen
    this.gadgetUI.addGadget('./assets/img/ui/icon_fullscreen.png', '', () => {
      // toggle fullscreen

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
    });
  }

  displayIframe(iframeSrc) {
    const closebutton = document.createElement('button');
    closebutton.classList.add('button-imuv');
    closebutton.classList.add('close-button');
    closebutton.title = 'Fermer';

    const closeCross = document.createElement('div');
    closeCross.classList.add('close_cross', 'mask_icon');
    closebutton.appendChild(closeCross);
    this.context.frame3D.domElementUI.appendChild(closebutton);

    const content = document.createElement('iframe');
    content.classList.add('ui-iframe');
    content.style.left = this.context.frame3D.domElementWebGL.style.left;
    content.src = iframeSrc;

    this.context.frame3D.domElementUI.appendChild(content);

    // pause avatar command stop rendering
    this.context.frame3D.isRendering = false;
    const avatarController = this.context.findExternalScriptWithID(
      AvatarController.ID_SCRIPT
    );
    avatarController.setAvatarControllerMode(false);

    closebutton.onclick = (event) => {
      event.stopPropagation();
      content.remove();
      closebutton.remove();

      // restore rendering + avatar command
      this.context.frame3D.isRendering = true;
      avatarController.setAvatarControllerMode(true);
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
        const promise = new Promise(bind_trailing_args(promiseFunction, true)); // true onClose
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
        const promise = new Promise(bind_trailing_args(promiseFunction, false)); // false onClose
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

  addToMapUI(scriptMap) {
    this.mapUI.add(scriptMap);
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
    if (this.debugInfo) this.debugInfo.update(this.context, this.variables);
  }

  static get ID_SCRIPT() {
    return 'ui_id_ext_script';
  }
}

class Chart {
  constructor(name, options = {}) {
    this.domElement = document.createElement('div');

    // label
    const labelName = document.createElement('div');
    labelName.innerText = name;
    this.domElement.appendChild(labelName);

    this.canvas = document.createElement('canvas');
    this.domElement.appendChild(this.canvas);

    this.values = [];

    this.timeInterval = options.timeInterval || 5000;

    this.maxNumber = -Infinity;

    this.averageNumber = 0;

    this.offsetY = options.offsetY || 10;

    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = options.fillStyle || 'red';
    ctx.strokeStyle = options.strokeStyle || 'black';

    this.labelMaxNumber = options.labelMaxNumber || '';
  }

  /**
   *
   * @param {object} value
   */
  add(value) {
    this.values.push(value);

    // clear old values
    const now = Date.now();

    this.maxNumber = -Infinity;

    this.values.forEach((v) => {
      this.maxNumber = Math.max(this.maxNumber, v.number);
      this.averageNumber += v.number;
    });

    this.averageNumber /= this.values.length;

    this.values = this.values.filter((a) => {
      return now - a.timestamp < this.timeInterval;
    });
  }

  draw() {
    if (this.values.length < 2) return;

    const ctx = this.canvas.getContext('2d');

    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();

    const worldHeight = this.maxNumber + this.offsetY;

    ctx.scale(
      this.canvas.width / this.timeInterval,
      this.canvas.height / worldHeight
    );

    const now = Date.now();

    ctx.beginPath();

    ctx.moveTo(
      now - this.values[0].timestamp,
      worldHeight - this.values[0].number
    );
    for (let index = 1; index < this.values.length; index++) {
      const value = this.values[index];
      ctx.lineTo(now - value.timestamp, worldHeight - value.number);
    }

    const lastValue = this.values[this.values.length - 1];
    ctx.lineTo(now - lastValue.timestamp, worldHeight);
    ctx.lineTo(now - this.values[0].timestamp, worldHeight);

    ctx.closePath();

    ctx.fill();

    ctx.restore();

    const sizeLine = 10;

    // draw max number
    // const y = (this.offsetY * this.canvas.height) / worldHeight;
    // ctx.beginPath();
    // ctx.moveTo(0, y);
    // ctx.lineTo(sizeLine, y);
    // ctx.closePath();
    // ctx.stroke();
    // ctx.strokeText(this.maxNumber + this.labelMaxNumber, 2 * sizeLine, y);

    // draw average number
    const yAverage =
      this.canvas.height -
      (this.averageNumber * this.canvas.height) / worldHeight;
    ctx.beginPath();
    ctx.moveTo(0, yAverage);
    ctx.lineTo(sizeLine, yAverage);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeText(
      this.averageNumber + this.labelMaxNumber,
      2 * sizeLine,
      yAverage
    );

    // draw time (x)
    ctx.beginPath();
    ctx.moveTo(0, this.canvas.height);
    ctx.lineTo(this.canvas.width, this.canvas.height);
    ctx.lineTo(this.canvas.width, this.canvas.height - sizeLine);
    ctx.lineTo(this.canvas.width, this.canvas.height);
    ctx.closePath();
    ctx.stroke();
    const textValue = this.timeInterval + ' ms';
    const widthText = ctx.measureText(textValue).width;
    ctx.strokeText(
      textValue,
      this.canvas.width - sizeLine - widthText,
      this.canvas.height - sizeLine
    );
  }
}

class DebugInfo {
  constructor() {
    this.domElement = document.createElement('div');
    this.domElement.setAttribute('id', 'debug_info');
    this.domElement.classList.add('root_debug');

    const foldButton = document.createElement('button');
    foldButton.innerText = 'fold/unfold';
    this.domElement.appendChild(foldButton);

    let fold = false;
    foldButton.onclick = () => {
      fold = !fold;
      for (const child of this.domElement.children) {
        if (child == foldButton) continue;
        child.hidden = fold;
      }
    };

    this.gameViewFpsChart = new Chart('client fps', {
      labelMaxNumber: ' ms',
    });
    this.domElement.appendChild(this.gameViewFpsChart.domElement);

    this.worldComputerFpsChart = new Chart('backend fps', {
      labelMaxNumber: ' ms',
    });
    this.domElement.appendChild(this.worldComputerFpsChart.domElement);

    this.pingChart = new Chart('interpolator ping', {
      labelMaxNumber: ' ms',
    });
    this.domElement.appendChild(this.pingChart.domElement);

    this.bandWidthChart = new Chart('down', {
      labelMaxNumber: ' KB',
    });
    this.domElement.appendChild(this.bandWidthChart.domElement);

    this.avatarCount = document.createElement('div');
    this.avatarCount.classList.add('debug_label');
    this.domElement.appendChild(this.avatarCount);

    this.vertexCount = document.createElement('div');
    this.vertexCount.classList.add('debug_label');
    this.domElement.appendChild(this.vertexCount);
  }

  html() {
    return this.domElement;
  }

  /**
   *
   * @param {ExternalGame.Context} context
   * @param {*} variables
   */
  update(context, variables) {
    // update ui
    this.gameViewFpsChart.add({
      timestamp: Date.now(),
      number: context.dt,
    });
    this.gameViewFpsChart.draw();

    if (variables.gameContextDt)
      this.worldComputerFpsChart.add({
        timestamp: Date.now(),
        number: variables.gameContextDt,
      });
    this.worldComputerFpsChart.draw();

    this.pingChart.add(context.interpolator.ping);
    this.pingChart.draw();

    // bandwidth
    this.bandWidthChart.add(context.interpolator.bandWidthStateValue);
    this.bandWidthChart.draw();

    let avatarCount = 0;
    let vertexCount = 0;
    context.object3D.traverse(function (child) {
      if (child.userData.isAvatar) avatarCount++;
      if (child.geometry) {
        vertexCount += child.geometry.attributes.position.count;
      }
    });
    this.avatarCount.innerText = 'Player: ' + avatarCount;
    this.vertexCount.innerText = vertexCount + ' points';
  }
}

class MenuSettings {
  /**
   *
   * @param {ExternalGame.Context} externalContext - external context
   */
  constructor(externalContext) {
    this.context = externalContext;

    this.domElement = document.createElement('div');
    this.domElement.classList.add('root-menu-settings');

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

    this.initHtml();
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

  initHtml() {
    // sections
    this.createTitleSection(this.domElement);

    const panelsSection = document.createElement('section');
    panelsSection.classList.add('panels-section');
    this.createGraphicsSection(panelsSection);
    this.createAudioSection(panelsSection);
    this.createControlsSection(panelsSection);
    this.domElement.appendChild(panelsSection);

    this.createSaveAndCloseSection(this.domElement);
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
  createSaveAndCloseSection(parentElement) {
    const saveAndCloseSection = document.createElement('section');
    saveAndCloseSection.classList.add('save-and-close-section');

    // Close button
    const closeButton = this.createCloseButton();
    saveAndCloseSection.appendChild(closeButton);
    this.closeButton = closeButton;

    // Save button
    const saveButton = this.createSaveButton();
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

  createSaveButton() {
    const saveButton = document.createElement('button');
    saveButton.classList.add('button-imuv');
    const saveIcon = document.createElement('div');
    saveIcon.title = 'Sauvegarder';
    saveIcon.classList.add('mask_icon', 'save_icon');
    saveButton.appendChild(saveIcon);

    saveButton.onclick = () => {
      this.context.socketIOWrapper.emit(WEBSOCKET.MSG_TYPE.SAVE_SETTINGS, {
        // SETTINGS MODEL IS DESCRIBE HERE
        fogValue: this.fogSlider.value,
        zoomFactor: this.zoomFactorSlider.value,
        mouseSensitivitySlider: this.mouseSensitivitySlider.value,
        volumeValue: this.volumeSlider.value,
        sunValue: this.sunCheckBox.checked,
        shadowValue: this.shadowChecBox.checked,
        shadowMapSize: this.shadowMapSelect.value,
      });
    };

    return saveButton;
  }

  // GRAPHICS SECTION
  createGraphicsSection(parentElement) {
    const graphicsSection = document.createElement('section');
    graphicsSection.classList.add('graphics-section');

    const graphicsTitle = document.createElement('h2');
    graphicsTitle.innerHTML = 'Graphismes';
    graphicsSection.appendChild(graphicsTitle);

    /* Getting the directional light from the scene. */
    let dirLight;
    for (
      let index = 0;
      index < this.context.frame3D.scene.children.length;
      index++
    ) {
      const element = this.context.frame3D.scene.children[index];
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
    const sunOptionDiv = this.createSunOptionDiv(dirLight);
    graphicsSection.appendChild(sunOptionDiv);
    // Shadow option
    const shadowOptionDiv = this.createShadowOptionDiv(dirLight);
    graphicsSection.appendChild(shadowOptionDiv);
    // Texture size option
    const textureSizeOptionDiv = this.createTextureSizeOptionDiv(dirLight);
    graphicsSection.appendChild(textureSizeOptionDiv);

    /* ---Other---*/
    // Fog option
    const fogOptionDiv = this.createFogOptionDiv();
    graphicsSection.appendChild(fogOptionDiv);

    parentElement.appendChild(graphicsSection);
  }

  createSunOptionDiv(dirLight) {
    // parent
    const sunOptionDiv = document.createElement('div');

    // label
    const labelEnableDirect = document.createElement('div');
    labelEnableDirect.innerHTML = 'Soleil';
    labelEnableDirect.classList.add('label-menu-settings');
    sunOptionDiv.appendChild(labelEnableDirect);

    // checkbox
    const checkboxDirect = document.createElement('input');
    checkboxDirect.type = 'checkbox';
    sunOptionDiv.appendChild(checkboxDirect);

    // check is settings has been saved
    if (this.context.userData.settings.sunValue != undefined) {
      dirLight.visible = this.context.userData.settings.sunValue;
    }
    checkboxDirect.checked = dirLight.visible;
    checkboxDirect.onchange = function () {
      dirLight.visible = this.checked;
    };

    this.sunCheckBox = checkboxDirect;

    return sunOptionDiv;
  }

  createShadowOptionDiv(dirLight) {
    // parent
    const shadowOptionDiv = document.createElement('div');

    // label
    const labelEnable = document.createElement('div');
    labelEnable.innerHTML = 'Ombres';
    labelEnable.classList.add('label-menu-settings');
    shadowOptionDiv.appendChild(labelEnable);

    // checkbox
    const shadowCheckbox = document.createElement('input');
    shadowCheckbox.type = 'checkbox';
    shadowOptionDiv.appendChild(shadowCheckbox);

    // check is settings has been saved
    if (this.context.userData.settings.shadowValue != undefined) {
      dirLight.castShadow = this.context.userData.settings.shadowValue;
    }

    shadowCheckbox.checked = dirLight.castShadow;
    shadowCheckbox.onchange = function () {
      dirLight.castShadow = this.checked;
    };

    this.shadowChecBox = shadowCheckbox;

    return shadowOptionDiv;
  }

  createTextureSizeOptionDiv(dirLight) {
    // size
    const textureSizeOptionDiv = document.createElement('div');
    this.domElement.appendChild(textureSizeOptionDiv);
    const labelSize = document.createElement('div');
    labelSize.innerHTML = "Taille Texture d'Ombre";
    labelSize.classList.add('label-menu-settings');
    textureSizeOptionDiv.appendChild(labelSize);

    // select
    const selectSize = document.createElement('select');
    textureSizeOptionDiv.appendChild(selectSize);

    const values = [512, 1024, 2048, 4096];
    values.forEach(function (value) {
      const option = document.createElement('option');
      option.innerHTML = value + ' pixels';
      option.value = value;
      selectSize.appendChild(option);
    });

    // check is settings has been saved
    if (!isNaN(this.context.userData.settings.shadowMapSize)) {
      dirLight.shadow.mapSize.width =
        this.context.userData.settings.shadowMapSize;
      dirLight.shadow.mapSize.height =
        this.context.userData.settings.shadowMapSize;
      dirLight.shadow.map = null;
      selectSize.value = this.context.userData.settings.shadowMapSize;
    }

    this.shadowMapSelect = selectSize;

    return textureSizeOptionDiv;
  }

  createFogOptionDiv() {
    // init fog according extent

    const max = Math.max(
      this.context.userData.extent.north - this.context.userData.extent.south,
      this.context.userData.extent.east - this.context.userData.extent.west
    );

    const min = 50;
    this.context.frame3D.scene.fog = new THREE.Fog(
      // new udviz.THREE.Color("red"),
      new THREE.Color('#e1ebef'),
      0,
      max
    );

    // check is settings has been saved
    if (!isNaN(this.context.userData.settings.fogValue)) {
      this.context.frame3D.scene.fog.far =
        this.context.userData.settings.fogValue;
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
    slider.value = this.context.frame3D.scene.fog.far;
    fogOptionDiv.appendChild(slider);

    this.fogSlider = slider;

    // callbakc
    slider.onchange = () => {
      this.context.frame3D.scene.fog.far = slider.value;
    };

    return fogOptionDiv;
  }

  // AUDIO SECTION
  createAudioSection(parentElement) {
    const audioSection = document.createElement('section');
    audioSection.classList.add('audio-section');

    // title
    const audioTitle = document.createElement('h2');
    audioTitle.innerHTML = 'Audio';
    audioSection.appendChild(audioTitle);

    // audio slider
    const audioSliderDiv = this.createVolumeSliderDiv();
    audioSection.appendChild(audioSliderDiv);

    parentElement.appendChild(audioSection);
  }

  createVolumeSliderDiv() {
    const audioSliderDiv = document.createElement('div');

    const labelGlobalSound = document.createElement('label');
    labelGlobalSound.innerHTML = 'Volume';
    labelGlobalSound.classList.add('label-menu-settings');
    audioSliderDiv.appendChild(labelGlobalSound);

    // check is settings has been saved
    if (!isNaN(this.context.userData.settings.volumeValue)) {
      // eslint-disable-next-line no-undef
      Howler.volume(this.context.userData.settings.volumeValue); // Howler is global
    }

    const globalVolumeSlider = document.createElement('input');
    globalVolumeSlider.type = 'range';
    globalVolumeSlider.step = 0.05;
    globalVolumeSlider.min = 0;
    globalVolumeSlider.max = 1;
    // eslint-disable-next-line no-undef
    globalVolumeSlider.value = Howler.volume(); // Howler is global
    audioSliderDiv.appendChild(globalVolumeSlider);

    this.volumeSlider = globalVolumeSlider;

    // callbakc
    globalVolumeSlider.onchange = function () {
      // eslint-disable-next-line no-undef
      Howler.volume(this.value); // Howler is global
    };

    return audioSliderDiv;
  }

  // CONTROLS SECTION
  createControlsSection(parentElement) {
    const controlsSection = document.createElement('section');
    controlsSection.classList.add('controls-section');

    // title
    const controlsTitle = document.createElement('h2');
    controlsTitle.innerHTML = 'Contrôles';
    controlsSection.appendChild(controlsTitle);

    // Mouse sensitivity
    const mouseSensitivityDiv = this.createMouseSensitivitysDiv();
    controlsSection.appendChild(mouseSensitivityDiv);

    // Zoom factor
    const zoomFactorDiv = this.createZoomFactorDiv();
    controlsSection.appendChild(zoomFactorDiv);

    parentElement.appendChild(controlsSection);
  }

  createMouseSensitivitysDiv() {
    // init fog according extent
    const max = 40;
    const min = 3;

    // check is settings has been saved
    let init = (min + max) / 2;
    if (!isNaN(this.context.userData.settings.mouseSensitivitySlider)) {
      init = this.context.userData.settings.mouseSensitivitySlider;
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

  createZoomFactorDiv() {
    // init fog according extent
    const max = 2.5;
    const min = 1.2;

    // check is settings has been saved
    let init = (min + max) / 2;
    if (!isNaN(this.context.userData.settings.zoomFactor)) {
      init = this.context.userData.settings.zoomFactor;
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

    slider.onchange = () => {
      if (this.context.frame3D.itownsView.controls) {
        this.context.frame3D.itownsView.controls.zoomInFactor = slider.value;
        this.context.frame3D.itownsView.controls.zoomOutFactor =
          1 / slider.value;
      }
    };

    return zoomFactorDiv;
  }

  html() {
    return this.domElement;
  }

  dispose() {
    this.domElement.remove();
  }
}

class ToolsBar {
  constructor() {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('root_toolsbar');
  }

  addIcon(icon) {
    this.domElement.appendChild(icon);
  }

  html() {
    return this.domElement;
  }
}

class ToolsContextualMenu {
  constructor() {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('tools_contextual_menu');

    this.closeFunction = null;
    this.currentMenu = null;
    this.available = true;
  }

  closeCurrentMenu() {
    return this.closeFunction();
  }

  html() {
    return this.domElement;
  }

  isAvailable() {
    return this.available;
  }

  add(menu, closeFunction) {
    const duration = this.getCSSTransitionDuration(this.domElement);
    this.closeFunction = closeFunction;
    this.available = false;
    return new Promise((resolve) => {
      this.domElement.appendChild(menu.html());
      this.domElement.style.transform = 'translate(0%,-50%)';
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
    const duration = this.getCSSTransitionDuration(this.domElement);
    this.closeFunction = null;
    this.available = false;

    menu.isClosing = true; // TODO LIKE DISPOSE HTML CREATE A ISCLOSING FLAG IN CONTEXTUAL MENU GENERIC WAIT FOR REFACTO (is coming ...)

    return new Promise((resolve) => {
      this.domElement.style.transform = 'translate(-100%,-50%)';
      this.currentMenu = null;

      setTimeout(() => {
        menu.dispose();
        menu.isClosing = false; // TODO LIKE DISPOSE HTML CREATE A ISCLOSING FLAG IN CONTEXTUAL MENU GENERIC WAIT FOR REFACTO (is coming ...)
        this.available = true;
        resolve();
      }, duration);
    });
  }
}

const MAP_MINIZE_SCALE = 0.5;

class MapUI {
  constructor() {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('mapUI');

    this.minimized = null;
    this.setMinimized(true);

    this.currentMapScript = null;
  }

  setMinimized(value) {
    this.minimized = value;

    if (value) {
      this.domElement.style.transform =
        'scale(' +
        MAP_MINIZE_SCALE +
        ') translate(' +
        MAP_MINIZE_SCALE * 100 +
        '%,' +
        -MAP_MINIZE_SCALE * 100 +
        '%)';
    } else {
      this.domElement.style.transform = 'initial';
    }
  }

  add(scriptMap) {
    this.currentMapScript = scriptMap;

    // Map interface
    this.domElement.appendChild(scriptMap.html());
    scriptMap.setDisplayMap(true);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('map_buttons');
    this.domElement.appendChild(buttonsDiv);

    // add button
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

    scaleButton.onclick = () => {
      this.setMinimized(!this.minimized);
      if (!this.minimized) {
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
      scriptMap.setClickMode(MAP_CLICK_MODE.TELEPORT);
    };

    const pingButton = document.createElement('img');
    pingButton.title = 'Ping';
    pingButton.src = './assets/img/ui/icon_ping.png';
    pingButton.classList.add('map_button');
    buttonsDiv.appendChild(pingButton);

    pingButton.onclick = function () {
      scriptMap.setClickMode(MAP_CLICK_MODE.PING);
    };
  }

  clear() {
    while (this.domElement.firstChild) {
      this.domElement.firstChild.remove();
    }

    // no display for old script map
    if (this.currentMapScript) {
      this.currentMapScript.setDisplayMap(false);
      this.currentMapScript = null;
    }
  }

  html() {
    return this.domElement;
  }
}

class GadgetUI {
  constructor() {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('root_gadget');
  }

  addGadget(path, title, cb) {
    const icon = document.createElement('img');
    icon.src = path;
    icon.title = title;
    icon.onclick = cb;

    this.domElement.appendChild(icon);
  }

  html() {
    return this.domElement;
  }
}

const SOCIAL_MINIZE_SCALE = 0.5;

class SocialUI {
  constructor() {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('root_social_ui');

    this.minimized = null;
    this.setMinimized(true);
  }

  html() {
    return this.domElement;
  }

  setMinimized(value) {
    this.minimized = value;

    if (value) {
      this.domElement.style.transform =
        'scale(' +
        SOCIAL_MINIZE_SCALE +
        ') translate(' +
        SOCIAL_MINIZE_SCALE * 100 +
        '%,' +
        SOCIAL_MINIZE_SCALE * 100 +
        '%)';
    } else {
      this.domElement.style.transform = 'initial';
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
    this.domElement.appendChild(scaleButton);

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

    this.domElement.appendChild(iframe);
  }

  clear() {
    while (this.domElement.firstChild) {
      this.domElement.firstChild.remove();
    }
  }
}

class LabelInfo {
  constructor() {
    this.domElement = document.createElement('div');
    this.domElement.classList.add('root_label_info');

    this.currentID = null;
    this.domElement.classList.add('hidden');
  }

  writeLabel(id, label) {
    this.currentID = id;

    this.domElement.innerHTML = label;
    this.domElement.classList.remove('hidden');
  }

  clear(id) {
    if (id == this.currentID) {
      this.currentID = null;
      this.domElement.innerHTML = '';
      this.domElement.classList.add('hidden');
    }
  }

  html() {
    return this.domElement;
  }
}
