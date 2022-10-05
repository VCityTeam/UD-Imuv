import { LocalScript } from 'ud-viz/src/Game/Game';

export class LocalScriptWhiteboardUI {
  constructor(goUI, gameView) {
    this.content = goUI.content;
    const go = goUI.go;

    const uuid = go.getUUID();
    this.goInGame = gameView.getLastState().getGameObject().find(uuid);

    const lsComp = this.goInGame.getComponent(LocalScript.TYPE);
    if (!lsComp) throw new Error('no localscript');

    const localCtx = gameView.getLocalContext();
    const ImuvConstants = localCtx.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];
    lsComp.conf.iframe_src =
      ImuvConstants.WBO_PUBLIC_URL + '/' + this.goInGame.getUUID();

    this.initHtml();
  }

  initHtml() {
    const content = this.content;
    //title
    const titleDisplayMedia = document.createElement('h3');
    titleDisplayMedia.innerHTML = 'DisplayMedia:';
    content.appendChild(titleDisplayMedia);
  }
}
