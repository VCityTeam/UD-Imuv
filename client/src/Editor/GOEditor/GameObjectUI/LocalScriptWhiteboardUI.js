import { LocalScript } from 'ud-viz/src/Game/Game';

const INIT_CONF = {
  factorHeight: 3,
  factorWidth: 3,
  iframe_src: null,
};

export class LocalScriptWhiteboardUI {
  constructor(goUI, gameView) {
    this.content = goUI.content;
    const go = goUI.go;

    const uuid = go.getUUID();
    this.goInGame = gameView.getLastState().getGameObject().find(uuid);

    const lsComp = this.goInGame.getComponent(LocalScript.TYPE);
    if (!lsComp) throw new Error('no localscript');
    Object.assign(lsComp.conf, INIT_CONF);

    const localCtx = gameView.getLocalContext();
    const ImuvConstants = localCtx.getGameView().getLocalScriptModules()[
      'ImuvConstants'
    ];
    lsComp.conf.iframe_src =
      ImuvConstants.WBO_PUBLIC_URL + '/' + this.goInGame.getUUID();
  }
}
