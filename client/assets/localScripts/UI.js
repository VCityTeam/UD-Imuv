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
    this.globalVolumeSlider = null;
    this.menuButton = null;
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

    const labelGlobalSound = document.createElement('div');
    labelGlobalSound.classList.add('label_controller');
    labelGlobalSound.innerHTML = 'Volume';
    gameView.appendToUI(labelGlobalSound);

    this.globalVolumeSlider = document.createElement('input');
    this.globalVolumeSlider.type = 'range';
    this.globalVolumeSlider.step = 0.05;
    this.globalVolumeSlider.min = 0;
    this.globalVolumeSlider.max = 1;
    this.globalVolumeSlider.value = Howler.volume();
    gameView.appendToUI(this.globalVolumeSlider);

    //callbakc
    this.globalVolumeSlider.onchange = function () {
      //Howler is global
      Howler.volume(this.value);
    };

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

    this.updateUI(go, localCtx);
  }

  tick() {
    this.updateUI(arguments[0], arguments[1]);
  }

  update() {
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
    go.traverse(function (g) {
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
    this.createVisibilityObject3D(localCtx);
    this.createDirectionalOptions(localCtx);
  }

  createVisibilityObject3D(localCtx) {
    const scene = localCtx.getGameView().getScene();

    const countVertices = function (object) {
      let result = 0;

      object.traverse(function (child) {
        if (child.geometry) {
          result += child.geometry.attributes.position.count;
        }
      });

      return result;
    };

    for (let index = 0; index < scene.children.length; index++) {
      const element = scene.children[index];
      if (!element.isLight) {
        const flexParent = document.createElement('div');
        flexParent.style.display = 'flex';
        this.rootHtml.appendChild(flexParent);

        // console.log(element.name);
        const label = document.createElement('div');
        label.innerHTML =
          element.name.toUpperCase() +
          ': ' +
          countVertices(element) +
          ' vertices';
        label.classList.add('label-menu-settings');
        const checkbox = document.createElement('input');
        checkbox.classList.add('checkbox-menu-settings');
        checkbox.type = 'checkbox';
        checkbox.checked = element.visible;

        checkbox.onchange = function () {
          element.visible = this.checked;
        };
        flexParent.appendChild(label);
        flexParent.appendChild(checkbox);
      }
    }
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
