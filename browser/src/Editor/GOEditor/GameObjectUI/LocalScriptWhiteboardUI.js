import { LocalScript } from 'ud-viz/src/Game/Game';

export class LocalScriptWhiteboardUI {
  constructor(goUI, gameView) {
    this.content = goUI.content;
    const go = goUI.go;

    const uuid = go.getUUID();
    this.goInGame = gameView.getLastState().getGameObject().find(uuid);

    const lsComp = this.goInGame.getComponent(LocalScript.TYPE);
    if (!lsComp) throw new Error('no localscript');
    const conf = lsComp.conf;
    conf.factorWidth = conf.factorWidth || 3;
    conf.factorHeight = conf.factorHeight || 3;

    this.initHtml(conf);
    this.initCallback(conf);
  }

  initHtml(conf) {
    const content = this.content;
    //title
    const titleWhiteboard = document.createElement('h3');
    titleWhiteboard.innerHTML = 'Whiteboard:';
    content.appendChild(titleWhiteboard);

    /* Creating a label and input for the height and width of the whiteboard. */
    const labelFactorHeight = document.createElement('label');
    labelFactorHeight.innerHTML = 'Factor Height';
    content.appendChild(labelFactorHeight);

    const inputFactorHeight = document.createElement('input');
    inputFactorHeight.type = 'number';
    inputFactorHeight.value = conf.factorHeight;
    inputFactorHeight.step = 0.1;
    this.inputFactorHeight = inputFactorHeight;
    content.appendChild(inputFactorHeight);

    const labelFactorWidth = document.createElement('label');
    labelFactorWidth.innerHTML = 'Factor Width';
    content.appendChild(labelFactorWidth);

    const inputFactorWidth = document.createElement('input');
    inputFactorWidth.type = 'number';
    inputFactorWidth.value = conf.factorWidth;
    inputFactorWidth.step = 0.1;
    this.inputFactorWidth = inputFactorWidth;
    content.appendChild(inputFactorWidth);
  }

  initCallback(conf) {
    const lsWBO = this.goInGame.fetchLocalScripts()['whiteboard'];

    this.inputFactorHeight.oninput = function () {
      conf.factorHeight = this.value;
      lsWBO.createWhiteboardPlane.call(lsWBO);
    };

    this.inputFactorWidth.oninput = function () {
      conf.factorWidth = this.value;
      lsWBO.createWhiteboardPlane.call(lsWBO);
    };
  }
}
