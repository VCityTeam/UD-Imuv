let udviz = null;

module.exports = class UI {
  constructor(conf, udvizBundle) {
    this.conf = conf;

    udviz = udvizBundle;
  }

  init() {
    const go = arguments[0];
    const localCtx = arguments[1];
    const gameView = localCtx.getGameView();

    this.fpsLabel = document.createElement('div');
    this.fpsLabel.classList.add('label_localGameManager');
    gameView.appendToUI(this.fpsLabel);

    this.avatarCount = document.createElement('div');
    this.avatarCount.classList.add('label_localGameManager');
    gameView.appendToUI(this.avatarCount);

    this.updateUI(go, localCtx);
  }

  tick() {
    const go = arguments[0];
    const localCtx = arguments[1];
    this.updateUI(go, localCtx);
  }

  updateUI(go, localCtx) {
    //update ui
    this.fpsLabel.innerHTML = 'FPS = ' + Math.round(1000 / localCtx.getDt());
    let avatarCount = 0;
    go.traverse(function (g) {
      if (g.name == 'avatar') avatarCount++;
    });
    this.avatarCount.innerHTML = 'Player: ' + avatarCount;
  }
};
