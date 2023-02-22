export class PortalSweep {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Game = udviz.Game;
  }

  init() {
    this.go = arguments[0];
    this.localCtxt = arguments[1];
  }

  onEnter() {
    if (this.localCtxt.getGameView().getUserData('editorMode')) {
      console.warn('no portal sweep in editor mode');
      return;
    }

    const go = this.go;
    const audioComp = go.getComponent(Game.Audio.TYPE);
    if (!audioComp) return;

    const sounds = audioComp.getSounds();
    if (!sounds) debugger;
    sounds['portal_in'].play();

    const gV = this.localCtxt.getGameView();

    const fadeInHtmlEl = document.createElement('div');
    fadeInHtmlEl.classList.add('fadeIn_GameView');
    gV.ui.parentElement.parentElement.appendChild(fadeInHtmlEl);

    //TODO fade out when avatar arrived in world
  }
}
