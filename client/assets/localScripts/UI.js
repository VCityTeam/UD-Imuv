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
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();

    this.gameViewFps = document.createElement('div');
    this.gameViewFps.classList.add('label_localGameManager');
    gameView.appendToUI(this.gameViewFps);

    this.worldComputerFps = document.createElement('div');
    this.worldComputerFps.classList.add('label_localGameManager');
    gameView.appendToUI(this.worldComputerFps);

    this.pingUI = document.createElement('div');
    this.pingUI.classList.add('label_localGameManager');
    gameView.appendToUI(this.pingUI);

    this.avatarCount = document.createElement('div');
    this.avatarCount.classList.add('label_localGameManager');
    gameView.appendToUI(this.avatarCount);

    const labelGlobalSound = document.createElement('div');
    labelGlobalSound.classList.add('label_localGameManager');
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
